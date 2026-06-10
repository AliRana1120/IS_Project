from django.urls import path
from . import api_views

urlpatterns = [
    path('auth/login/', api_views.api_login, name='api_login'),
    path('auth/logout/', api_views.api_logout, name='api_logout'),
    path('auth/me/', api_views.api_current_user, name='api_current_user'),
    path('profile/', api_views.api_profile, name='api_profile'),
    path('dashboard/stats/', api_views.api_dashboard_stats, name='api_dashboard_stats'),
    path('documents/', api_views.api_documents, name='api_documents'),
    path('documents/<int:pk>/', api_views.api_document_detail, name='api_document_detail'),
    path('documents/create/', api_views.api_create_document, name='api_create_document'),
    path('users/', api_views.api_users, name='api_users'),
    path('users/create/', api_views.api_create_user, name='api_create_user'),
    path('access-logs/', api_views.api_access_logs, name='api_access_logs'),
    path('security-demo/', api_views.api_security_demo, name='api_security_demo'),
    path('hash-demo/', api_views.api_hash_demo, name='api_hash_demo'),
]
