from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, SecurityDocument, AccessLog

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'security_clearance', 'department']
    fieldsets = UserAdmin.fieldsets + (
        ('Security', {'fields': ('role', 'security_clearance', 'department', 'last_login_ip')}),
    )

@admin.register(SecurityDocument)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'security_level', 'created_by', 'created_at', 'category']
    list_filter = ['security_level', 'category']

@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource', 'timestamp', 'success']
    list_filter = ['action', 'success']
    readonly_fields = ['timestamp']
