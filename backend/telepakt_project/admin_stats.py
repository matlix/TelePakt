"""Statystyki panelu administracyjnego: dashboard i strony Połączenia / Użytkownicy / Opinie i zakupy.

Podejście przeniesione z projektu Kupuś: jeden generyczny szablon (templates/admin/stats/page.html)
dostaje listę specyfikacji wykresów, a Chart.js rysuje je po stronie przeglądarki. Samo ORM,
bez cache i bez nowych tabel.

Okresy: dziś / wczoraj / 7 / 30 / 90 dni / ten miesiąc / ten rok / wszystko / własny zakres.
Wykresy są grupowane godzinami, dniami, tygodniami lub miesiącami (automatycznie wg długości
okresu); puste przedziały są uzupełniane zerami, żeby oś była ciągła.

Modele są importowane leniwie wewnątrz funkcji (moduł jest wskazywany ścieżką w settings.py).
"""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Max, Q, Sum
from django.db.models.functions import ExtractHour, TruncDay, TruncHour, TruncMonth, TruncWeek
from django.urls import reverse
from django.utils import timezone

PERIODS = [
    ("today", "Dziś"),
    ("yesterday", "Wczoraj"),
    ("7d", "7 dni"),
    ("30d", "30 dni"),
    ("month", "Ten miesiąc"),
    ("90d", "90 dni"),
    ("year", "Ten rok"),
    ("all", "Wszystko"),
    ("custom", "Własny zakres"),
]
GROUPS = [
    ("auto", "Automatycznie"),
    ("hour", "Godzinami"),
    ("day", "Dniami"),
    ("week", "Tygodniami"),
    ("month", "Miesiącami"),
]
_TRUNC = {"hour": TruncHour, "day": TruncDay, "week": TruncWeek, "month": TruncMonth}
ALL = ("", "Wszystkie")


@dataclass
class Period:
    key: str
    label: str
    start: datetime | None  # włącznie
    end: datetime | None  # wyłącznie
    group: str
    date_from: str = ""
    date_to: str = ""

    @property
    def query(self) -> str:
        """Parametry zapytania przenoszące wybrany okres na kolejną stronę."""
        q = f"period={self.key}"
        if self.key == "custom":
            q += f"&date_from={self.date_from}&date_to={self.date_to}"
        return q


# --------------------------------------------------------------------------- okresy


def _day_start(d: date) -> datetime:
    return timezone.make_aware(datetime.combine(d, time.min))


def _parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def resolve_period(params, default="30d") -> Period:
    """Czyta ``period``, ``date_from``, ``date_to``, ``group`` z QueryDict."""
    key = params.get("period") or default
    if key not in dict(PERIODS):
        key = default
    today = timezone.localdate()
    date_from = date_to = ""
    start = end = None

    if key == "today":
        start, end = _day_start(today), _day_start(today + timedelta(days=1))
    elif key == "yesterday":
        start, end = _day_start(today - timedelta(days=1)), _day_start(today)
    elif key in ("7d", "30d", "90d"):
        days = int(key[:-1])
        start, end = _day_start(today - timedelta(days=days - 1)), _day_start(today + timedelta(days=1))
    elif key == "month":
        start, end = _day_start(today.replace(day=1)), _day_start(today + timedelta(days=1))
    elif key == "year":
        start, end = _day_start(today.replace(month=1, day=1)), _day_start(today + timedelta(days=1))
    elif key == "custom":
        d_from, d_to = _parse_date(params.get("date_from")), _parse_date(params.get("date_to"))
        if d_from and d_to and d_from <= d_to:
            start, end = _day_start(d_from), _day_start(d_to + timedelta(days=1))
            date_from, date_to = d_from.isoformat(), d_to.isoformat()
        else:  # niepełny zakres własny -> domyślny okres
            key = default
            return resolve_period({"period": default, "group": params.get("group")}, default)
    # key == "all": start/end zostają None

    group = params.get("group") or "auto"
    if group not in _TRUNC:
        if key in ("today", "yesterday"):
            group = "hour"
        elif start is None:
            group = "month"
        else:
            span = (end - start).days
            group = "day" if span <= 45 else "week" if span <= 250 else "month"
    label = f"{date_from} → {date_to}" if key == "custom" else dict(PERIODS)[key]
    return Period(key, label, start, end, group, date_from, date_to)


def in_period(qs, field, period: Period):
    """Zawęża queryset po polu daty do okresu."""
    if period.start is not None:
        qs = qs.filter(**{f"{field}__gte": period.start})
    if period.end is not None:
        qs = qs.filter(**{f"{field}__lt": period.end})
    return qs


# --------------------------------------------------------------------------- szeregi czasowe


def _floor(dt: datetime, group: str) -> datetime:
    d = timezone.localtime(dt).replace(minute=0, second=0, microsecond=0)
    if group == "hour":
        return d
    d = d.replace(hour=0)
    if group == "week":
        return d - timedelta(days=d.weekday())
    if group == "month":
        return d.replace(day=1)
    return d


def _next(dt: datetime, group: str) -> datetime:
    if group == "hour":
        return _floor(dt + timedelta(hours=1, minutes=1), "hour")
    if group == "day":
        return _floor(dt + timedelta(days=1, hours=1), "day")
    if group == "week":
        return _floor(dt + timedelta(days=7, hours=1), "week")
    return _floor(dt + timedelta(days=32), "month")


def _label(dt: datetime, group: str) -> str:
    return {"hour": f"{dt:%d.%m %H:00}", "day": f"{dt:%d.%m}", "week": f"{dt:%d.%m}", "month": f"{dt:%m.%Y}"}[group]


def _num(value):
    if value is None:
        return 0
    if isinstance(value, Decimal):
        return float(round(value, 2))
    return value


def series(qs, field, period: Period, value, split=None, split_labels=None):
    """Szereg czasowy agregatu ``value`` po polu ``field``; z ``split`` jeden zestaw danych na wartość."""
    trunc = _TRUNC[period.group](field, tzinfo=timezone.get_current_timezone())
    group_by = ["_b"] + ([split] if split else [])
    rows = qs.annotate(_b=trunc).values(*group_by).annotate(_v=value).order_by("_b")

    data, observed = {}, []
    for row in rows:
        if row["_b"] is None:
            continue
        key = _floor(row["_b"], period.group)
        observed.append(key)
        data.setdefault(row[split] if split else None, {})[key] = _num(row["_v"])

    now = timezone.now()
    start = period.start or (min(observed) if observed else now)
    end = period.end or (now + timedelta(seconds=1))
    keys, cur = [], _floor(start, period.group)
    while cur < end and len(keys) < 2000:
        keys.append(cur)
        cur = _next(cur, period.group)

    labels = [_label(k, period.group) for k in keys]
    datasets = []
    for name in sorted(data, key=lambda n: str(n)):
        label = (split_labels or {}).get(name, name) if split else "Razem"
        datasets.append({"label": str(label), "data": [data[name].get(k, 0) for k in keys]})
    if not datasets:
        datasets = [{"label": "Razem", "data": [0] * len(keys)}]
    return {"labels": labels, "datasets": datasets}


def chart(id_, title, kind, labels, datasets, stacked=False, note=""):
    """Specyfikacja wykresu dla Chart.js (kind: bar | line | doughnut | hbar)."""
    return {"id": id_, "title": title, "kind": kind, "labels": labels, "datasets": datasets,
            "stacked": stacked, "note": note}


def ts_chart(id_, title, kind, ser, stacked=False, note=""):
    return chart(id_, title, kind, ser["labels"], ser["datasets"], stacked, note)


def breakdown(qs, field, labels=None, label_default="—"):
    """Podział liczby rekordów wg pola: ``(etykiety, wartości)`` do wykresu kołowego."""
    rows = qs.values(field).annotate(c=Count("id")).order_by("-c")
    names = [str((labels or {}).get(r[field], r[field]) or label_default) for r in rows]
    return names, [r["c"] for r in rows]


def doughnut(id_, title, qs, field, labels=None, note=""):
    names, values = breakdown(qs, field, labels)
    return chart(id_, title, "doughnut", names, [{"label": title, "data": values}], note=note)


def _link(url, text):
    return {"url": url, "text": text}


def _changelist(model, **query):
    qs = "&".join(f"{k}={v}" for k, v in query.items())
    return reverse(f"admin:{model}_changelist") + (f"?{qs}" if qs else "")


def _select(name, label, options, params):
    return {"name": name, "label": label, "options": options, "value": params.get(name, "")}


# --------------------------------------------------------------------------- strony


def calls_page(params):
    from telephony.models import CallLog

    period = resolve_period(params)
    status_labels = dict(CallLog.STATUS_CHOICES)
    provider = params.get("provider", "")
    status = params.get("status", "")

    qs = in_period(CallLog.objects.all(), "timestamp", period)
    if provider:
        qs = qs.filter(provider=provider)
    if status in status_labels:
        qs = qs.filter(status=status)

    total = qs.count()
    agg = qs.aggregate(secs=Sum("duration_seconds"), avg=Avg("duration_seconds"), numbers=Count("caller_number", distinct=True))
    kpis = [
        ("Połączeń", total),
        ("Nagrywanych", qs.filter(recording_started=True).count()),
        ("Usuniętych (Zero-Storage)", qs.filter(deleted_from_server=True).count()),
        ("Unikalnych numerów", agg["numbers"] or 0),
        ("Łączny czas [min]", round((agg["secs"] or 0) / 60, 1)),
        ("Średnia długość [s]", round(agg["avg"] or 0)),
    ]

    by_hour = {r["h"]: r["c"] for r in qs.annotate(h=ExtractHour("timestamp", tzinfo=timezone.get_current_timezone()))
               .values("h").annotate(c=Count("id"))}
    charts = [
        ts_chart("c_time", "Połączenia w czasie", "bar", series(qs, "timestamp", period, Count("id"))),
        ts_chart("c_secs", "Czas rozmów [s]", "line", series(qs, "timestamp", period, Sum("duration_seconds"))),
        doughnut("c_status", "Status połączeń", qs, "status", status_labels),
        doughnut("c_provider", "Dostawca telefonii", qs, "provider"),
        chart("c_hours", "Pora dnia (godzina połączenia)", "bar", [f"{h:02d}" for h in range(24)],
              [{"label": "Połączeń", "data": [by_hour.get(h, 0) for h in range(24)]}],
              note="Pokazuje, o jakich godzinach dzwonią spamerzy."),
    ]

    top = (qs.values("caller_number").annotate(c=Count("id"), last=Max("timestamp"), secs=Sum("duration_seconds"))
           .order_by("-c", "-last")[:15])
    tables = [{
        "title": "Najczęściej dzwoniące numery",
        "head": ["Numer", "Połączeń", "Łącznie [s]", "Ostatnio"],
        "rows": [[_link(_changelist("telephony_calllog", q=r["caller_number"]), r["caller_number"]), r["c"],
                  r["secs"] or 0, timezone.localtime(r["last"]).strftime("%d.%m.%Y %H:%M")] for r in top],
        "empty": "Brak połączeń w wybranym okresie.",
    }]
    filters = [
        _select("provider", "Dostawca", [ALL, ("twilio", "Twilio"), ("telnyx", "Telnyx")], params),
        _select("status", "Status", [ALL] + list(CallLog.STATUS_CHOICES), params),
    ]
    return {"period": period, "kpis": kpis, "charts": charts, "tables": tables, "filters": filters}


def users_page(params):
    from accounts.models import Profile

    period = resolve_period(params)
    plan_labels = dict(Profile.PLAN_CHOICES)
    plan = params.get("plan", "")

    base = Profile.objects.all()
    if plan in plan_labels:
        base = base.filter(subscription_plan=plan)
    qs = in_period(base, "created_at", period)

    kpis = [
        ("Nowi w okresie", qs.count()),
        ("Wszystkich kont", base.count()),
        ("Z numerem telefonu", base.exclude(phone_protected="").count()),
        ("Płatne plany", base.exclude(subscription_plan="free").count()),
    ]
    charts = [
        ts_chart("u_time", "Rejestracje w czasie", "bar", series(qs, "created_at", period, Count("id"))),
        ts_chart("u_plan_time", "Rejestracje wg planu", "bar",
                 series(qs, "created_at", period, Count("id"), split="subscription_plan", split_labels=plan_labels),
                 stacked=True),
        doughnut("u_plan", "Plany (wszystkie konta)", base, "subscription_plan", plan_labels),
        chart("u_phone", "Numer telefonu w profilu", "doughnut", ["Z numerem", "Bez numeru"],
              [{"label": "Konta", "data": [base.exclude(phone_protected="").count(), base.filter(phone_protected="").count()]}],
              note="Bez numeru w profilu przycisk „Nagrywaj” nie zadziała."),
    ]
    recent = qs.select_related("user").order_by("-created_at")[:15]
    tables = [{
        "title": "Ostatnie rejestracje",
        "head": ["Użytkownik", "E-mail", "Plan", "Telefon", "Założono"],
        "rows": [[_link(reverse("admin:accounts_profile_change", args=[p.pk]), p.name), p.user.email,
                  plan_labels.get(p.subscription_plan, p.subscription_plan), p.phone_protected or "—",
                  timezone.localtime(p.created_at).strftime("%d.%m.%Y %H:%M")] for p in recent],
        "empty": "Brak rejestracji w wybranym okresie.",
    }]
    filters = [_select("plan", "Plan", [ALL] + list(Profile.PLAN_CHOICES), params)]
    return {"period": period, "kpis": kpis, "charts": charts, "tables": tables, "filters": filters}


def feedback_page(params):
    from telephony.models import CustomerReview, InAppPurchaseReceipt

    period = resolve_period(params)
    platform_labels = dict(InAppPurchaseReceipt.PLATFORM_CHOICES)
    rating = params.get("rating", "")

    reviews = in_period(CustomerReview.objects.all(), "created_at", period)
    if rating.isdigit():
        reviews = reviews.filter(rating=int(rating))
    receipts = in_period(InAppPurchaseReceipt.objects.all(), "created_at", period)

    avg = reviews.aggregate(a=Avg("rating"))["a"]
    kpis = [
        ("Opinii", reviews.count()),
        ("Średnia ocena", round(avg, 2) if avg else "—"),
        ("Czeka na moderację", CustomerReview.objects.filter(is_approved=False).count()),
        ("Paragonów IAP", receipts.count()),
        ("Niezweryfikowanych", receipts.filter(is_verified=False).count()),
    ]
    by_rating = {r["rating"]: r["c"] for r in reviews.values("rating").annotate(c=Count("id"))}
    charts = [
        ts_chart("f_reviews", "Opinie w czasie", "bar", series(reviews, "created_at", period, Count("id"))),
        chart("f_ratings", "Rozkład ocen", "bar", ["1★", "2★", "3★", "4★", "5★"],
              [{"label": "Opinii", "data": [by_rating.get(i, 0) for i in range(1, 6)]}]),
        ts_chart("f_iap", "Paragony IAP w czasie", "bar", series(receipts, "created_at", period, Count("id"))),
        doughnut("f_platform", "Paragony wg sklepu", receipts, "platform", platform_labels),
        chart("f_verified", "Weryfikacja paragonów", "doughnut", ["Zweryfikowane", "Oczekują"],
              [{"label": "Paragony", "data": [receipts.filter(is_verified=True).count(), receipts.filter(is_verified=False).count()]}],
              note="Weryfikacja w API sklepów nie jest jeszcze zaimplementowana - paragony czekają."),
    ]
    pending = CustomerReview.objects.filter(is_approved=False).order_by("-created_at")[:10]
    tables = [{
        "title": "Opinie czekające na moderację",
        "head": ["Autor", "Ocena", "Tytuł", "Dodano"],
        "rows": [[_link(reverse("admin:telephony_customerreview_change", args=[r.pk]), r.author_name), f"{r.rating}★",
                  r.title, timezone.localtime(r.created_at).strftime("%d.%m.%Y")] for r in pending],
        "empty": "Brak opinii do moderacji.",
    }]
    filters = [_select("rating", "Ocena", [ALL] + [(str(i), f"{i}★") for i in range(1, 6)], params)]
    return {"period": period, "kpis": kpis, "charts": charts, "tables": tables, "filters": filters}


# --------------------------------------------------------------------------- dashboard


def dashboard_kpis(period: Period) -> dict:
    from accounts.models import Profile
    from telephony.models import CallLog, CustomerReview, InAppPurchaseReceipt, TelephonyProvider

    calls = in_period(CallLog.objects.all(), "timestamp", period)
    providers = list(TelephonyProvider.objects.order_by("priority"))
    return {
        "calls": calls.count(),
        "calls_recorded": calls.filter(recording_started=True).count(),
        "users_new": in_period(Profile.objects.all(), "created_at", period).count(),
        "users_total": Profile.objects.count(),
        "reviews_pending": CustomerReview.objects.filter(is_approved=False).count(),
        "receipts_pending": InAppPurchaseReceipt.objects.filter(is_verified=False).count(),
        "providers": providers,
        "providers_failing": sum(1 for p in providers if p.is_enabled and p.status == "failing"),
        "providers_enabled": sum(1 for p in providers if p.is_enabled),
        "calls_by_status": [
            {"label": dict(CallLog.STATUS_CHOICES).get(r["status"], r["status"]), "count": r["c"]}
            for r in calls.values("status").annotate(c=Count("id")).order_by("-c")
        ],
        "users_by_plan": [
            {"label": dict(Profile.PLAN_CHOICES).get(r["subscription_plan"], r["subscription_plan"]), "count": r["c"]}
            for r in Profile.objects.values("subscription_plan").annotate(c=Count("id")).order_by("-c")
        ],
    }
