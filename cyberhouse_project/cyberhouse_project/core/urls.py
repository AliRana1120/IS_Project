from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('documents/', views.documents_view, name='documents'),
    path('documents/<int:pk>/', views.document_detail, name='document_detail'),
    path('documents/create/', views.create_document, name='create_document'),
    path('admin-panel/', views.admin_panel, name='admin_panel'),
    path('security-demo/', views.security_demo, name='security_demo'),
    path('hash-demo/', views.hash_demo, name='hash_demo'),
    path('access-logs/', views.access_logs, name='access_logs'),
]
