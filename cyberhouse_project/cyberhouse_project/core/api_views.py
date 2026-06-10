import hashlib
import bcrypt
from django.contrib.auth import login, logout, authenticate
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import CustomUser, SecurityDocument, AccessLog, LoginAttempt, ROLE_SECURITY_LEVEL
from .serializers import (
    UserSerializer, AdminUserSerializer, DocumentSerializer,
    AccessLogSerializer, LoginSerializer, DocumentCreateSerializer,
    UserCreateSerializer, ProfileUpdateSerializer
)
from .security import (
    bell_lapadula_can_read, bell_lapadula_can_write,
    rbac_can_access, log_access
)
from .middleware import get_client_ip

MAX_LOGIN_ATTEMPTS = 3
LOCKOUT_SECONDS = 60


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    ip = get_client_ip(request)

    # Check lockout
    attempt, _ = LoginAttempt.objects.get_or_create(ip_address=ip)
    if attempt.is_locked():
        remaining = attempt.remaining_seconds()
        return Response({
            'success': False,
            'locked': True,
            'remaining_seconds': remaining,
            'error': f'Too many failed attempts. Try again in {remaining} seconds.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(request, username=username, password=password)
        if user:
            # Reset attempts on successful login
            attempt.attempts = 0
            attempt.locked_until = None
            attempt.save()

            user.last_login_ip = ip
            user.save(update_fields=['last_login_ip'])
            login(request, user)
            log_access(user, 'LOGIN', 'API Login', request, f'Successful login | Role: {user.role}')
            return Response({
                'success': True,
                'user': UserSerializer(user).data
            })
        else:
            # Increment failed attempts
            attempt.attempts += 1
            if attempt.attempts >= MAX_LOGIN_ATTEMPTS:
                attempt.locked_until = timezone.now() + timedelta(seconds=LOCKOUT_SECONDS)
            attempt.save()

            remaining_attempts = MAX_LOGIN_ATTEMPTS - attempt.attempts
            log_access(None, 'ACCESS_DENIED', 'API Login', request,
                       f'Failed login attempt for: {username} (attempt {attempt.attempts})', success=False)

            error_msg = 'Invalid credentials'
            if remaining_attempts > 0:
                error_msg += f' ({remaining_attempts} attempts remaining)'
            elif attempt.is_locked():
                error_msg = f'Account locked for {LOCKOUT_SECONDS} seconds due to too many failed attempts.'

            return Response({
                'success': False,
                'error': error_msg,
                'locked': attempt.is_locked(),
                'remaining_seconds': attempt.remaining_seconds(),
                'attempts_left': max(0, remaining_attempts),
            }, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def api_logout(request):
    log_access(request.user, 'LOGOUT', 'API Session', request)
    logout(request)
    return Response({'success': True})


@api_view(['GET'])
def api_current_user(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'PUT'])
def api_profile(request):
    """Users can view and update their own profile."""
    user = request.user
    if request.method == 'GET':
        data = UserSerializer(user).data
        data['plain_password'] = user.plain_password
        return Response(data)

    # PUT - update profile
    serializer = ProfileUpdateSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        if 'email' in data:
            user.email = data['email']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'department' in data:
            user.department = data['department']

        # Password change
        if data.get('new_password'):
            if not data.get('current_password'):
                return Response({'error': 'Current password is required to set a new one.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(data['current_password']):
                return Response({'error': 'Current password is incorrect.'},
                                status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data['new_password'])
            user.plain_password = data['new_password']

        user.save()
        log_access(user, 'WRITE', 'Profile Update', request, 'User updated their profile')
        return Response({'success': True, 'user': UserSerializer(user).data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def api_dashboard_stats(request):
    user = request.user
    all_docs = SecurityDocument.objects.all()
    accessible_docs = [d for d in all_docs if bell_lapadula_can_read(user, d)]

    now = timezone.now()
    last_7_days = now - timedelta(days=7)

    recent_logs = AccessLog.objects.filter(timestamp__gte=last_7_days)
    access_granted = recent_logs.filter(success=True).count()
    access_denied = recent_logs.filter(success=False).count()

    daily_stats = []
    for i in range(7):
        day = now - timedelta(days=6 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_logs = AccessLog.objects.filter(timestamp__range=[day_start, day_end])
        daily_stats.append({
            'day': day.strftime('%a'),
            'date': day.strftime('%Y-%m-%d'),
            'granted': day_logs.filter(success=True).count(),
            'denied': day_logs.filter(success=False).count(),
        })

    role_counts = CustomUser.objects.values('role').annotate(count=Count('id'))

    doc_levels = {
        'unclassified': len([d for d in accessible_docs if d.security_level == 0]),
        'confidential': len([d for d in accessible_docs if d.security_level == 1]),
        'secret': len([d for d in accessible_docs if d.security_level == 2]),
    }

    if rbac_can_access(user, 'admin'):
        recent_activity = AccessLog.objects.all().order_by('-timestamp')[:10]
    else:
        recent_activity = AccessLog.objects.filter(user=user).order_by('-timestamp')[:10]

    return Response({
        'total_documents': len(accessible_docs),
        'total_users': CustomUser.objects.count(),
        'access_granted_7d': access_granted,
        'access_denied_7d': access_denied,
        'daily_stats': daily_stats,
        'role_distribution': list(role_counts),
        'doc_level_distribution': doc_levels,
        'recent_activity': AccessLogSerializer(recent_activity, many=True).data,
        'user_clearance': user.get_security_label(),
        'user_role': user.role,
    })


@api_view(['GET'])
def api_documents(request):
    user = request.user
    all_docs = SecurityDocument.objects.all().order_by('-created_at')
    accessible = [d for d in all_docs if bell_lapadula_can_read(user, d)]
    denied_count = len(all_docs) - len(accessible)

    log_access(user, 'READ', 'API Documents List', request,
               f'Accessed {len(accessible)} docs, {denied_count} denied by BLP')

    return Response({
        'documents': DocumentSerializer(accessible, many=True).data,
        'denied_count': denied_count,
        'total_count': len(all_docs),
    })


@api_view(['GET'])
def api_document_detail(request, pk):
    try:
        doc = SecurityDocument.objects.get(pk=pk)
    except SecurityDocument.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not bell_lapadula_can_read(user, doc):
        log_access(user, 'ACCESS_DENIED', f'Document:{pk}', request,
                   f'BLP No-Read-Up: clearance {user.security_clearance} < doc level {doc.security_level}',
                   success=False)
        return Response({
            'error': 'Access Denied',
            'reason': 'Bell-LaPadula No Read Up',
            'user_clearance': user.get_security_label(),
            'required_clearance': doc.get_security_label(),
        }, status=status.HTTP_403_FORBIDDEN)

    log_access(user, 'READ', f'Document:{doc.title}', request)
    return Response(DocumentSerializer(doc).data)


@api_view(['POST'])
def api_create_document(request):
    user = request.user
    if not rbac_can_access(user, 'analyst'):
        log_access(user, 'ACCESS_DENIED', 'Create Document', request,
                   'RBAC: Viewer cannot create documents', success=False)
        return Response({'error': 'RBAC: Viewers cannot create documents'},
                        status=status.HTTP_403_FORBIDDEN)

    serializer = DocumentCreateSerializer(data=request.data)
    if serializer.is_valid():
        target_level = serializer.validated_data['security_level']
        if not bell_lapadula_can_write(user, target_level):
            log_access(user, 'ACCESS_DENIED', 'Create Document', request,
                       f'BLP Star Property: Cannot write down. Clearance {user.security_clearance} > target {target_level}',
                       success=False)
            return Response({
                'error': f'Bell-LaPadula Star Property violation: Cannot write to lower level. Your clearance: {user.get_security_label()}'
            }, status=status.HTTP_403_FORBIDDEN)

        doc = serializer.save(created_by=user)
        log_access(user, 'CREATE', f'Document:{doc.title}', request,
                   f'Created at level {doc.get_security_label()}')
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def api_users(request):
    user = request.user
    if not rbac_can_access(user, 'admin'):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    users = CustomUser.objects.all().order_by('role')
    log_access(user, 'READ', 'API Users List', request)
    return Response(AdminUserSerializer(users, many=True).data)


@api_view(['POST'])
def api_create_user(request):
    """Admin creates a new user."""
    user = request.user
    if not rbac_can_access(user, 'admin'):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        new_user = serializer.create(serializer.validated_data)
        log_access(user, 'CREATE', f'User:{new_user.username}', request,
                   f'Admin created user {new_user.username} with role {new_user.role}')
        return Response(AdminUserSerializer(new_user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def api_access_logs(request):
    user = request.user
    if rbac_can_access(user, 'admin'):
        logs = AccessLog.objects.all().order_by('-timestamp')[:100]
    else:
        logs = AccessLog.objects.filter(user=user).order_by('-timestamp')[:50]
    return Response(AccessLogSerializer(logs, many=True).data)


@api_view(['GET'])
def api_security_demo(request):
    user = request.user
    docs = SecurityDocument.objects.all()
    results = []
    for doc in docs:
        can_read = bell_lapadula_can_read(user, doc)
        can_write = bell_lapadula_can_write(user, doc.security_level)
        results.append({
            'doc_id': doc.id,
            'doc_title': doc.title,
            'doc_level': doc.security_level,
            'doc_label': doc.get_security_label(),
            'can_read': can_read,
            'can_write': can_write,
            'read_reason': (
                f'ALLOWED: Clearance({user.security_clearance}) >= DocLevel({doc.security_level})'
                if can_read else
                f'DENIED: Clearance({user.security_clearance}) < DocLevel({doc.security_level})'
            ),
            'write_reason': (
                f'ALLOWED: Clearance({user.security_clearance}) <= DocLevel({doc.security_level})'
                if can_write else
                f'DENIED: Clearance({user.security_clearance}) > DocLevel({doc.security_level})'
            ),
        })
    return Response({
        'user_clearance': user.security_clearance,
        'user_label': user.get_security_label(),
        'user_role': user.role,
        'results': results,
    })


@api_view(['GET', 'POST'])
def api_hash_demo(request):
    if request.method == 'POST':
        password = request.data.get('password', 'TestPassword123')
    else:
        password = request.query_params.get('password', 'TestPassword123')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode(), salt)
    sha256 = hashlib.sha256(password.encode()).hexdigest()
    return Response({
        'password': password,
        'bcrypt_hash': hashed.decode(),
        'sha256_hash': sha256,
        'verified': bcrypt.checkpw(password.encode(), hashed),
        'rounds': 12,
    })
