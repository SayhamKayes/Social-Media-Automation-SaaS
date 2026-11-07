@echo off
echo ========================================================
echo Starting AutoReply AI Frontend (React + Tailwind CSS)
echo ========================================================
cd frontend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
echo Starting Vite Dev Server...
call npm run dev
pause

