"""Hak DASHBOARD_CALLBACK Unfold (settings.UNFOLD) - dane dla templates/admin/index.html."""
from django.urls import reverse

from . import admin_stats


def dashboard_callback(request, context):
    period = admin_stats.resolve_period(request.GET)
    context.update({
        "period": period,
        "period_choices": admin_stats.PERIODS,
        "period_query": period.query,
        "kpi": admin_stats.dashboard_kpis(period),
        "stats_links": {
            "calls": reverse("admin_stats_calls"),
            "users": reverse("admin_stats_users"),
            "feedback": reverse("admin_stats_feedback"),
        },
    })
    return context
