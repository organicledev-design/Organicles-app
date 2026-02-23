# Organicles Launch Runbook (SQLite + Cloudflare Quick Tunnel)

## 1. Start Backend

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\backend"
npm run dev
```

## 2. Start Public Tunnel

```powershell
cloudflared tunnel --url http://localhost:5000
```

Copy the generated URL:

`https://<random>.trycloudflare.com`

## 3. Update Environment Values

### `backend/.env`

```env
CORS_ORIGINS=http://localhost:8081,https://<random>.trycloudflare.com
ASSET_BASE_URL=https://<random>.trycloudflare.com
```

### `MyApp/.env`

```env
API_BASE_URL=https://<random>.trycloudflare.com/api
```

Restart backend after changing `backend/.env`.

## 4. Start App

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\MyApp"
npm start -- --reset-cache
```

In another terminal:

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\MyApp"
npm run android
```

## 5. Smoke Test API

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\backend"
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1 -BaseUrl "https://<random>.trycloudflare.com"
```

## 6. Backup SQLite DB

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\backend"
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

## 7. If Prisma/SQLite Breaks After Node Change

```powershell
cd "C:\Users\RAJA ABID\Downloads\New folder\backend"
npm rebuild better-sqlite3
npx prisma generate
```

## Notes

- Quick tunnel URL changes every restart.
- Keep backend + cloudflared terminals running.
- This setup is valid for fast launch/testing.
- For stable production, move to managed backend + Postgres + object storage.
