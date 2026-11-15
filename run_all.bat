@echo off
echo =======================================================
echo Starting AutoReply SaaS: Client (3000) and Admin (3001)
echo =======================================================
start "AutoReply Client Portal (Port 3000)" cmd /k "cd frontend && npm run dev"
start "AutoReply Super Admin (Port 3001)" cmd /k "cd admin && npm run dev"
echo.
echo Client Portal: http://localhost:3000
echo Super Admin:   http://localhost:3001
echo.

