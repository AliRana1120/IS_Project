import hashlib
import bcrypt
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden, JsonResponse
from django.utils import timezone
from .models import CustomUser, SecurityDocument, AccessLog, ROLE_SECURITY_LEVEL
from .forms import RegisterForm, LoginForm, DocumentForm
from .security import (bell_lapadula_can_read, bell_lapadula_can_write,
                        rbac_can_access, log_access, get_security_badge_class)
from .middleware import get_client_ip


def home(request):
    return render(request, 'core/home.html')


def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        log_access(user, 'LOGIN', 'Registration', request, 'New user registered')
        login(request, user)
        messages.success(request, f'Welcome to CyberHouse, {user.username}! Account created with {user.role} role.')
        return redirect('login')
    return render(request, 'core/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    form = LoginForm(request, data=request.POST or None)
    error = None
    if request.method == 'POST':
        if form.is_valid():
            user = form.get_user()
            user.last_login_ip = get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
            login(request, user)
            log_access(user, 'LOGIN', 'Login Page', request, f'Successful login | Role: {user.role}')
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect('dashboard')
        else:
            username = request.POST.get('username', '')
            log_access(None, 'ACCESS_DENIED', 'Login Page', request,
                       f'Failed login attempt for username: {username}', success=False)
            error = 'Invalid username or password.'
    return render(request, 'core/login.html', {'form': form, 'error': error})


@login_required
def logout_view(request):
    log_access(request.user, 'LOGOUT', 'Session', request)
    logout(request)
    messages.info(request, 'You have been securely logged out.')
    return redirect('home')


@login_required
def dashboard(request):
    user = request.user
    # Fetch documents based on Bell-LaPadula read policy
    all_docs = SecurityDocument.objects.all()
    accessible_docs = [d for d in all_docs if bell_lapadula_can_read(user, d)]
    recent_logs = AccessLog.objects.filter(user=user).order_by('-timestamp')[:5]
    
    stats = {
        'total_docs': len(accessible_docs),
        'secret_docs': len([d for d in accessible_docs if d.security_level == 2]),
        'confidential_docs': len([d for d in accessible_docs if d.security_level == 1]),
        'unclassified_docs': len([d for d in accessible_docs if d.security_level == 0]),
    }
    return render(request, 'core/dashboard.html', {
        'docs': accessible_docs[:6],
        'stats': stats,
        'recent_logs': recent_logs,
    })


@login_required
def documents_view(request):
    user = request.user
    all_docs = SecurityDocument.objects.all().order_by('-created_at')
    
    # Bell-LaPadula: filter by clearance
    accessible = []
    denied_count = 0
    for doc in all_docs:
        if bell_lapadula_can_read(user, doc):
            accessible.append(doc)
        else:
            denied_count += 1

    log_access(user, 'READ', 'Documents List', request,
               f'Accessed {len(accessible)} docs, {denied_count} denied by BLP')
    
    return render(request, 'core/documents.html', {
        'documents': accessible,
        'denied_count': denied_count,
    })


@login_required
def document_detail(request, pk):
    doc = get_object_or_404(SecurityDocument, pk=pk)
    user = request.user

    # Bell-LaPadula Simple Security Property: No Read Up
    if not bell_lapadula_can_read(user, doc):
        log_access(user, 'ACCESS_DENIED', f'Document:{pk}', request,
                   f'BLP No-Read-Up violation: clearance {user.security_clearance} < doc level {doc.security_level}',
                   success=False)
        return render(request, 'core/access_denied.html', {
            'reason': 'Bell-LaPadula No Read Up',
            'user_clearance': user.get_security_label(),
            'required_clearance': doc.get_security_label(),
        })

    log_access(user, 'READ', f'Document:{doc.title}', request, 'Document accessed successfully')
    return render(request, 'core/document_detail.html', {'doc': doc})


@login_required
def create_document(request):
    user = request.user
    # RBAC: only admin and analyst can create
    if not rbac_can_access(user, 'analyst'):
        log_access(user, 'ACCESS_DENIED', 'Create Document', request,
                   'RBAC: Viewer cannot create documents', success=False)
        return render(request, 'core/access_denied.html', {
            'reason': 'RBAC Policy: Viewers cannot create documents.',
            'user_clearance': user.role,
            'required_clearance': 'Analyst or Admin',
        })

    form = DocumentForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        target_level = int(form.cleaned_data['security_level'])
        # Bell-LaPadula Star Property: No Write Down
        if not bell_lapadula_can_write(user, target_level):
            log_access(user, 'ACCESS_DENIED', 'Create Document', request,
                       f'BLP Star Property: Cannot write down. User clearance {user.security_clearance} > target {target_level}',
                       success=False)
            messages.error(request, f'Bell-LaPadula Star Property violation: You cannot write to a lower security level than your clearance. Your clearance: {user.get_security_label()}')
            return render(request, 'core/create_document.html', {'form': form})

        doc = form.save(commit=False)
        doc.created_by = user
        doc.save()
        log_access(user, 'CREATE', f'Document:{doc.title}', request,
                   f'Created document at level {doc.get_security_label()}')
        messages.success(request, f'Document "{doc.title}" created successfully.')
        return redirect('documents')

    return render(request, 'core/create_document.html', {'form': form})


@login_required
def admin_panel(request):
    user = request.user
    # RBAC: Admin only
    if not rbac_can_access(user, 'admin'):
        log_access(user, 'ACCESS_DENIED', 'Admin Panel', request,
                   'RBAC: Only admins can access this panel', success=False)
        return render(request, 'core/access_denied.html', {
            'reason': 'RBAC Policy: Admin role required.',
            'user_clearance': user.role,
            'required_clearance': 'Admin',
        })

    users = CustomUser.objects.all().order_by('role')
    all_logs = AccessLog.objects.all().order_by('-timestamp')[:50]
    log_access(user, 'READ', 'Admin Panel', request, 'Admin accessed user management panel')
    return render(request, 'core/admin_panel.html', {'users': users, 'logs': all_logs})


@login_required
def security_demo(request):
    """Demonstrates Bell-LaPadula policy enforcement with live proof."""
    user = request.user
    docs = SecurityDocument.objects.all()
    demo_results = []

    for doc in docs:
        can_read = bell_lapadula_can_read(user, doc)
        can_write = bell_lapadula_can_write(user, doc.security_level)
        demo_results.append({
            'doc': doc,
            'can_read': can_read,
            'can_write': can_write,
            'read_reason': (
                f'ALLOWED: Clearance({user.security_clearance}) >= DocLevel({doc.security_level})'
                if can_read else
                f'DENIED (NRU): Clearance({user.security_clearance}) < DocLevel({doc.security_level})'
            ),
            'write_reason': (
                f'ALLOWED: Clearance({user.security_clearance}) <= DocLevel({doc.security_level})'
                if can_write else
                f'DENIED (NWD): Clearance({user.security_clearance}) > DocLevel({doc.security_level})'
            ),
        })

    return render(request, 'core/security_demo.html', {
        'demo_results': demo_results,
        'user': user,
    })


@login_required
def hash_demo(request):
    """Shows bcrypt password hashing proof."""
    demo_data = []
    test_passwords = ['MyP@ssw0rd', 'CyberHouse2024!', 'SecretAgent#99']
    for pw in test_passwords:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(pw.encode(), salt)
        sha256 = hashlib.sha256(pw.encode()).hexdigest()
        demo_data.append({
            'password': pw,
            'bcrypt_hash': hashed.decode(),
            'sha256': sha256,
            'verified': bcrypt.checkpw(pw.encode(), hashed),
        })
    return render(request, 'core/hash_demo.html', {'demo_data': demo_data})


@login_required
def access_logs(request):
    user = request.user
    if rbac_can_access(user, 'admin'):
        logs = AccessLog.objects.all().order_by('-timestamp')[:100]
    else:
        logs = AccessLog.objects.filter(user=user).order_by('-timestamp')[:50]
    return render(request, 'core/access_logs.html', {'logs': logs})
