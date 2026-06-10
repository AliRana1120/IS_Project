"""
Bell-LaPadula Security Model Middleware
Simple Security Property: No Read Up (NRU)
Star Property: No Write Down (NWD)
"""
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponseForbidden
from .models import AccessLog

# URL patterns that require specific security levels
PROTECTED_URLS = {
    '/documents/secret/': 2,      # SECRET level
    '/documents/confidential/': 1, # CONFIDENTIAL level
    '/admin-panel/': 2,
    '/reports/': 1,
}


class BellLapadulaPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            path = request.path
            user_clearance = getattr(request.user, 'security_clearance', 0)

            for url_pattern, required_level in PROTECTED_URLS.items():
                if path.startswith(url_pattern):
                    # Bell-LaPadula: No Read Up
                    if user_clearance < required_level:
                        AccessLog.objects.create(
                            user=request.user,
                            action='ACCESS_DENIED',
                            resource=path,
                            ip_address=get_client_ip(request),
                            details=f'Bell-LaPadula NRU violation: user clearance {user_clearance} < required {required_level}',
                            success=False
                        )
                        return HttpResponseForbidden(
                            f'<h1>403 - Access Denied</h1>'
                            f'<p>Bell-LaPadula Policy: No Read Up violation.</p>'
                            f'<p>Your clearance: {user_clearance}, Required: {required_level}</p>'
                            f'<a href="/dashboard/">Go Back</a>'
                        )

        response = self.get_response(request)
        return response


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')
