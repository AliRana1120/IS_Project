"""Management command to seed demo data."""
from django.core.management.base import BaseCommand
from core.models import CustomUser, SecurityDocument, ROLE_SECURITY_LEVEL


class Command(BaseCommand):
    help = 'Seeds demo users and documents'

    def handle(self, *args, **kwargs):
        # Create users
        users_data = [
            {'username': 'admin_alice', 'password': 'Admin@1234', 'role': 'admin',
             'first_name': 'Alice', 'last_name': 'Admin', 'email': 'alice@cyberhouse.pk',
             'department': 'Security Operations'},
            {'username': 'analyst_bob', 'password': 'Analyst@1234', 'role': 'analyst',
             'first_name': 'Bob', 'last_name': 'Analyst', 'email': 'bob@cyberhouse.pk',
             'department': 'Threat Intelligence'},
            {'username': 'viewer_charlie', 'password': 'Viewer@1234', 'role': 'viewer',
             'first_name': 'Charlie', 'last_name': 'Viewer', 'email': 'charlie@cyberhouse.pk',
             'department': 'Public Relations'},
        ]

        created_users = {}
        for ud in users_data:
            if not CustomUser.objects.filter(username=ud['username']).exists():
                u = CustomUser.objects.create_user(
                    username=ud['username'], password=ud['password'],
                    role=ud['role'], first_name=ud['first_name'],
                    last_name=ud['last_name'], email=ud['email'],
                    department=ud['department'],
                    security_clearance=ROLE_SECURITY_LEVEL[ud['role']]
                )
                created_users[ud['role']] = u
                self.stdout.write(f'  Created user: {ud["username"]} ({ud["role"]})')
            else:
                created_users[ud['role']] = CustomUser.objects.get(username=ud['username'])
                self.stdout.write(f'  User exists: {ud["username"]}')

        admin = created_users.get('admin') or CustomUser.objects.filter(role='admin').first()

        # Seed documents
        docs = [
            {'title': 'Public Security Policy 2024', 'security_level': 0,
             'category': 'Policy', 'content': 'This document outlines the public-facing security policy of CyberHouse. All visitors must sign in. CCTV monitoring is in effect. Report suspicious activities to security@cyberhouse.pk.'},
            {'title': 'Network Architecture Overview', 'security_level': 0,
             'category': 'Infrastructure', 'content': 'CyberHouse operates a three-tier network architecture: DMZ, Internal Network, and Secure Enclave. All external communications pass through the DMZ firewall cluster.'},
            {'title': 'Threat Intelligence Report — Q4 2024', 'security_level': 1,
             'category': 'Intelligence', 'content': 'CONFIDENTIAL: APT-29 activity detected in regional networks. IOCs: 192.168.45.0/24, malware hash d41d8cd98f00b204e9800998ecf8427e. Recommended action: block and monitor.'},
            {'title': 'Analyst Playbook — Incident Response', 'security_level': 1,
             'category': 'Operations', 'content': 'CONFIDENTIAL: Step 1 — Containment. Step 2 — Eradication. Step 3 — Recovery. Contact CISO within 1 hour of P1 incidents. Encryption key rotation required post-incident.'},
            {'title': 'Operation Black Shield — Mission Brief', 'security_level': 2,
             'category': 'Operations', 'content': 'SECRET: Target: Rogue nation state actor. Objective: Neutralize C2 infrastructure. Timeline: 72 hours. Assets deployed: 3 zero-day exploits. Authorized by: Director Operations. DO NOT DISTRIBUTE.'},
            {'title': 'Cryptographic Keys & Certificates', 'security_level': 2,
             'category': 'Cryptography', 'content': 'SECRET: RSA-4096 master key fingerprint: AB:CD:EF:12:34. CA root certificate expires 2027-01-01. HSM PIN: contact SecOps only. All keys rotated quarterly per NIST SP 800-57.'},
        ]

        for dd in docs:
            if not SecurityDocument.objects.filter(title=dd['title']).exists():
                SecurityDocument.objects.create(created_by=admin, **dd)
                self.stdout.write(f'  Created doc: {dd["title"]} [Level {dd["security_level"]}]')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete!'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  admin_alice / Admin@1234  (SECRET clearance)')
        self.stdout.write('  analyst_bob / Analyst@1234  (CONFIDENTIAL clearance)')
        self.stdout.write('  viewer_charlie / Viewer@1234  (UNCLASSIFIED clearance)')
