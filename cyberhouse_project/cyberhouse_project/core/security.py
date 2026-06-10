"""
Bell-LaPadula Model Implementation
===================================
Simple Security Property (ss-property): No Read Up
  - A subject at security level L can only READ objects at level <= L
Star Property (*-property): No Write Down
  - A subject at security level L can only WRITE objects at level >= L
"""
from .models import AccessLog, SECURITY_LEVEL_SECRET, SECURITY_LEVEL_CONFIDENTIAL, SECURITY_LEVEL_UNCLASSIFIED


def bell_lapadula_can_read(user, document):
    """
    Bell-LaPadula Simple Security Property (No Read Up).
    User can read document only if user_clearance >= document_security_level.
    """
    return user.security_clearance >= document.security_level


def bell_lapadula_can_write(user, target_level):
    """
    Bell-LaPadula Star Property (No Write Down).
    User can write only at their own level or higher — cannot write down.
    Writing 'down' would allow leaking classified info to lower-level objects.
    """
    return user.security_clearance <= target_level


def rbac_can_access(user, required_role):
    """
    RBAC Check: role hierarchy.
    admin > analyst > viewer
    """
    role_hierarchy = {'admin': 3, 'analyst': 2, 'viewer': 1}
    user_rank = role_hierarchy.get(user.role, 0)
    required_rank = role_hierarchy.get(required_role, 0)
    return user_rank >= required_rank


def log_access(user, action, resource, request=None, details='', success=True):
    ip = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
    AccessLog.objects.create(
        user=user,
        action=action,
        resource=resource,
        ip_address=ip,
        details=details,
        success=success
    )


def get_security_badge_class(level):
    return {0: 'badge-unclassified', 1: 'badge-confidential', 2: 'badge-secret'}.get(level, '')
