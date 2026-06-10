# CyberHouse — IS Lab Project
## Django Security System: Bell-LaPadula + RBAC + bcrypt

### Setup Instructions

```bash
# 1. Install dependencies
pip install django bcrypt

# 2. Run migrations
python manage.py makemigrations
python manage.py migrate

# 3. Seed demo data
python manage.py seed_data

# 4. Run server
python manage.py runserver
```

### Demo Credentials
| Username         | Password       | Role    | Clearance     |
|-----------------|----------------|---------|---------------|
| admin_alice     | Admin@1234     | Admin   | SECRET        |
| analyst_bob     | Analyst@1234   | Analyst | CONFIDENTIAL  |
| viewer_charlie  | Viewer@1234    | Viewer  | UNCLASSIFIED  |

### Key URLs
- `/` — Home
- `/login/` — Login
- `/register/` — Register
- `/dashboard/` — User Dashboard
- `/documents/` — Document Repository
- `/security-demo/` — Bell-LaPadula Live Demo
- `/hash-demo/` — bcrypt Password Hashing Demo
- `/admin-panel/` — Admin Only Panel
- `/access-logs/` — Audit Logs

### Security Components Implemented
1. **Bell-LaPadula Model** (core/security.py, core/middleware.py)
   - Simple Security Property: No Read Up
   - Star Property: No Write Down
2. **RBAC** — Admin > Analyst > Viewer role hierarchy
3. **bcrypt** — 12-round salted password hashing (django BCryptSHA256PasswordHasher)
4. **Audit Logging** — Every access attempt logged with IP, user, action, result
5. **CSRF Protection** — Django middleware on all forms
