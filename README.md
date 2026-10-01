# Kidland School — Full Stack Management System

## Stack
**Frontend:** React 18, Tailwind CSS, Framer Motion, React Icons, Recharts  
**Backend:** Node.js, Express, MongoDB, JWT Auth, Multer

---

## Quick Start (Windows)

### 1. Install MongoDB
Download and install from: https://www.mongodb.com/try/download/community  
(Check "Install MongoDB as a Service" during setup — it starts automatically)

**OR use MongoDB Atlas (Free Cloud):**
1. Go to https://cloud.mongodb.com → Create free account → Free cluster
2. Get connection string and paste it in `server/.env` as `MONGO_URI=<your-string>`

### 2. Open TWO PowerShell/CMD windows in the project folder

**Terminal 1 — Backend:**
```powershell
cd server
npm install
node seed.js
npm run dev
```
You should see: `MongoDB connected` and `Server on port 5000`

**Terminal 2 — Frontend:**
```powershell
cd client
npm install
npm run dev
```
You should see: `Local: http://localhost:5173`

### 3. Open in browser
- **Public Site:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin

---

## Admin Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@kidland.edu.np | admin123456 |
| Co Admin | coadmin@kidland.edu.np | coadmin123 |

> **Change these passwords** after first login!

---

## Troubleshooting

**"MongoDB connection failed"**  
→ MongoDB service is not running  
→ Windows: Search "Services" → Find "MongoDB Server" → Right-click → Start  
→ Or use MongoDB Atlas cloud (free tier)

**Login shows "(Offline mode)"**  
→ The backend server is not running — check Terminal 1 has no errors  
→ Make sure you ran `cd server && npm run dev`

**Port 5000 already in use**  
→ Edit `server/.env`: change `PORT=5000` to `PORT=5001`  
→ Edit `client/vite.config.js`: change `target: 'http://localhost:5000'` to match

**"npm not found"**  
→ Install Node.js from https://nodejs.org (LTS version)

