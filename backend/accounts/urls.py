from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.register, name='auth_register'),
    path('login/', views.login, name='auth_login'),
    path('logout/', views.logout, name='auth_logout'),
    path('me/', views.me, name='auth_me'),
    path('password-reset/', views.password_reset_request, name='auth_reset_request'),
    path('password-reset/confirm/', views.password_reset_confirm, name='auth_reset_confirm'),
]
