from django.db import models
from django.contrib.auth.models import AbstractUser

# Bell-LaPadula Security Level Constants
SECURITY_LEVEL_UNCLASSIFIED = 0
SECURITY_LEVEL_CONFIDENTIAL = 1
SECURITY_LEVEL_SECRET = 2

SECURITY_LEVEL_CHOICES = [
    (SECURITY_LEVEL_UNCLASSIFIED, 'Unclassified'),
    (SECURITY_LEVEL_CONFIDENTIAL, 'Confidential'),
    (SECURITY_LEVEL_SECRET, 'Secret'),
]

ROLE_CHOICES = [
    ('admin', 'Admin'),
    ('analyst', 'Analyst'),
    ('viewer', 'Viewer'),
]

ROLE_SECURITY_LEVEL = {
    'admin': SECURITY_LEVEL_SECRET,        # Clearance: SECRET
    'analyst': SECURITY_LEVEL_CONFIDENTIAL, # Clearance: CONFIDENTIAL
    'viewer': SECURITY_LEVEL_UNCLASSIFIED,  # Clearance: UNCLASSIFIED
}


class CustomUser(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    security_clearance = models.IntegerField(choices=SECURITY_LEVEL_CHOICES, default=SECURITY_LEVEL_UNCLASSIFIED)
    department = models.CharField(max_length=100, default='General')
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    groups = models.ManyToManyField('auth.Group', blank=True, related_name='customuser_set')
    user_permissions = models.ManyToManyField('auth.Permission', blank=True, related_name='customuser_set')

    def get_security_label(self):
        labels = {0: 'Unclassified', 1: 'Confidential', 2: 'Secret'}
        return labels.get(self.security_clearance, 'Unknown')

    def __str__(self):
        return f"{self.username} ({self.role})"


class SecurityDocument(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    security_level = models.IntegerField(choices=SECURITY_LEVEL_CHOICES, default=SECURITY_LEVEL_UNCLASSIFIED)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents')
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=100, default='General')

    def get_security_label(self):
        labels = {0: 'Unclassified', 1: 'Confidential', 2: 'Secret'}
        return labels.get(self.security_level, 'Unknown')

    def __str__(self):
        return f"{self.title} [{self.get_security_label()}]"


class AccessLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('ACCESS_GRANTED', 'Access Granted'),
        ('ACCESS_DENIED', 'Access Denied'),
        ('WRITE', 'Write'),
        ('READ', 'Read'),
        ('CREATE', 'Create'),
        ('DELETE', 'Delete'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource = models.CharField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True)
    success = models.BooleanField(default=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.resource}"
