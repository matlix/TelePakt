"""Widoki stron statystyk panelu admina.

Rejestrowane w urls.py przez ``admin.site.admin_view`` - mają to samo logowanie, uprawnienia
(tylko personel) i wygląd Unfold co pozostałe ekrany panelu.
"""
import json

from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import reverse

from . import admin_stats

PAGES = {
    "calls": ("Statystyki połączeń", admin_stats.calls_page),
    "users": ("Statystyki użytkowników", admin_stats.users_page),
    "feedback": ("Opinie i zakupy", admin_stats.feedback_page),
}


def stats_view(request, page):
    title, builder = PAGES[page]
    data = builder(request.GET)
    context = {
        **admin.site.each_context(request),
        "title": title,
        "page": page,
        "period": data["period"],
        "periods": admin_stats.PERIODS,
        "groups": admin_stats.GROUPS,
        "group_value": request.GET.get("group") or "auto",
        "kpis": data["kpis"],
        "filters": data["filters"],
        "tables": data["tables"],
        "charts": data["charts"],
        "charts_json": json.dumps(data["charts"], ensure_ascii=False),
        "nav": [(key, label, reverse(f"admin_stats_{key}")) for key, (label, _fn) in PAGES.items()],
    }
    return TemplateResponse(request, "admin/stats/page.html", context)


def make_view(page):
    def view(request):
        return stats_view(request, page)

    view.__name__ = f"stats_{page}"
    return view
