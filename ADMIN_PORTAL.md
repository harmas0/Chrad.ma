# Desktop Admin Portal — Deployment Guide

## What was built

A separate **desktop-only web application** for Ghrad.ma administration, sharing the same Supabase backend as the mobile app.

```
ghrad.ma/          → Mobile/Web client (clients & runners)
admin.ghrad.ma/    → Desktop Admin Portal (command center)
```

## Build outputs

| Command | Output | Purpose |
|---------|--------|---------|
| `npm run build` | `dist/` | Mobile/web client |
| `npm run build:admin` | `dist-admin/` | Desktop admin portal |
| `npm run dev` | `localhost:5173` | Mobile/client dev |
| `npm run dev:admin` | `localhost:5174` | Admin dev |

## Admin portal structure

```
admin/
├── index.html              # Entry point
├── src/
│   ├── main.jsx            # Mount point + BrowserRouter + AuthProvider
│   ├── App.jsx             # Routes + AdminLayout sidebar
│   ├── index.css           # Desktop-optimized admin styles
│   ├── context/
│   │   └── AuthContext.jsx  # Auth (shares Supabase via @shared alias)
│   └── pages/admin/
│       ├── AdminDashboard.jsx  # 6-stat grid + quick actions + activity
│       ├── AdminUsers.jsx      # Wide user table + ban/unban modals
│       ├── AdminTasks.jsx      # Task table + detail modal
│       ├── AdminKYC.jsx        # 3-column layout: Queue / Viewer / Actions
│       ├── AdminDisputes.jsx   # Dispute cards + resolve modal
│       ├── AdminAuditLog.jsx   # Expandable audit table
│       └── AdminSettings.jsx   # Platform config toggles
```

## Key features

- **3-column KYC workspace** — Queue | Document Viewer | Action Panel with prev/next navigation
- **Wide desktop tables** — All columns visible without horizontal scroll
- **Fixed sidebar navigation** — Always visible, no mobile hiding
- **Shared Supabase backend** — Same database, same auth, real-time sync
- **Independent deployment** — Can host on `admin.ghrad.ma` subdomain

## Deployment steps

### 1. Build the admin portal

```bash
npm run build:admin
```

This outputs to `dist-admin/`.

### 2. Deploy `dist-admin/` to your hosting

**Options:**
- **Netlify/Vercel:** Point to `dist-admin/` as publish directory, set root to `admin/` if using their CLI
- **Nginx/Caddy:** Serve `dist-admin/` on `admin.ghrad.ma`
- **Same server as main app:** Add a server block/subdomain pointing to `dist-admin/`

### 3. Configure subdomain (example: Nginx)

```nginx
server {
    listen 80;
    server_name admin.ghrad.ma;

    root /path/to/chrad.ma/dist-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Ensure Supabase RLS allows admin access

The admin portal uses the same Supabase project. Make sure:
- Admin users have `role = 'admin'` in the `profiles` table
- RLS policies allow admin operations (run `admin_migration.sql`)

### 5. Grant admin access

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

## Security notes

- Admin access is enforced via Supabase Auth + `role = 'admin'` check
- The `ProtectedRoute` component in `admin/src/App.jsx` redirects non-admins
- All admin actions are logged to `admin_audit_log` table
- Consider adding IP allowlisting or 2FA for admin accounts in production

## Tech stack

- React 19 + Vite 8 + Tailwind CSS v4
- Supabase (shared with mobile app)
- React Router DOM v7 (BrowserRouter for desktop)
- Lucide React icons
