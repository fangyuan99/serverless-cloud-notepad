# Admin Interface

The admin dashboard at `/admin` provides centralized management for all notes.

## Setup

### Local Development

1. Create/update `.dev.vars` with test values:
```
SCN_SALT=dev-salt-value
SCN_SECRET=dev-secret-value
ADMIN_PW=your-test-password
```

2. Start dev server:
```bash
wrangler dev --local
```

3. Visit `http://localhost:8787/admin` and login

### Production Deployment

Before deploying, add these GitHub secrets to your repository:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `SCN_SALT` | Salt for note password hashing |
| `SCN_SECRET` | Secret for JWT signing |
| **`ADMIN_PW`** | Admin login password (NEW) |

The GitHub Actions workflow will automatically set up the Cloudflare secrets during deployment.

## Features

### Dashboard
- **Notes List**: View all notes with metadata (path, last update, password status, share status)
- **Pagination**: Navigate through notes 50 per page using cursor-based pagination
- **Search**: Filter notes by path
- **Batch Operations**: Select multiple notes and delete them in bulk

### Note Management
- **Preview**: View note content (bypasses note passwords)
- **Edit Link**: Click path to jump to note editor in new tab
- **Delete**: Remove individual or batch notes with confirmation
- **Share Mapping Cleanup**: Automatically removes share entries when notes are deleted

### Data Management
- **Export All**: Download all notes as JSON backup file
- **Import All**: Restore notes from JSON backup file
- **Encryption**: Optional AES-GCM encryption with password-derived keys

## Security

- **Authentication**: Password-based login with JWT HttpOnly cookies
- **Authorization**: All admin routes check for valid admin JWT before executing
- **No Cross-Contamination**: Admin JWT uses `role:'admin'` payload vs note JWTs with `path:'...'`
- **Password Verification**: Direct plaintext comparison (never enters KV storage)
- **CSRF Protection**: JSON Content-Type requirement triggers CORS preflight checks

## API Endpoints

All endpoints require admin authentication (valid `auth_admin` cookie).

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin` | GET | Login page or dashboard |
| `/admin/auth` | POST | Password login |
| `/admin/api/notes` | GET | List notes (cursor pagination) |
| `/admin/api/notes/:path/preview` | GET | Note content preview |
| `/admin/api/notes/:path` | DELETE | Delete single note |
| `/admin/api/notes/delete-batch` | POST | Batch delete |
| `/admin/api/export-all` | GET | Export all notes |
| `/admin/api/import-all` | POST | Import notes |

## Bilingual Support

The admin interface supports English and Chinese. Language is auto-detected from browser `Accept-Language` header.

## Notes

- The path `/admin` is now reserved and cannot be used for regular notes
- Existing notes named "admin" remain in storage but are inaccessible through normal editor (accessible via admin dashboard)
- Admin sessions last 7 days, matching note auth token expiry
- Export/import preserves all metadata including passwords and share status
