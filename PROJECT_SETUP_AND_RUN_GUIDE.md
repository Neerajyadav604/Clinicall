# Clinicall Backend - Complete Project Setup & Run Guide

**For New Developers | Step-by-Step Instructions**

Last Updated: March 19, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Project Structure](#project-structure)
4. [Installation Guide](#installation-guide)
5. [Running Each Service](#running-each-service)
6. [Verification Checklist](#verification-checklist)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Testing](#testing)
9. [Quick Reference Commands](#quick-reference-commands)

---

## Project Overview

**Clinicall** is a healthcare application with three main services:

1. **Frontend** (React + Redux) - User interface for patients and doctors
2. **Backend** (Node.js + Express) - REST API with JWT authentication
3. **ML Service** (Python + FastAPI) - ML models for health predictions

All three services must run together for the full application to work.

### Key Features

- Patient login and medical records management
- AI-powered symptom checker
- Doctor recommendations based on symptoms
- Drug interaction checking
- Medical records summarization
- Real-time consultations (coming soon)

---

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10 or later, macOS, or Linux
- **RAM**: 8 GB (16 GB recommended)
- **Disk Space**: 10 GB available
- **Internet**: Required for initial setup

### Software Prerequisites

You must install these before proceeding:

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Python** (v3.8 or higher)
   - Download: https://www.python.org/
   - Verify: `python --version` and `pip --version`

3. **Git** (for version control)
   - Download: https://git-scm.com/
   - Verify: `git --version`

4. **MongoDB** (v5.0 or higher)
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
   - Verify: MongoDB is running on `localhost:27017`

---

## Project Structure

```
Clinicall Backend/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   │   ├── ai/            # AI feature components
│   │   │   ├── doctor/        # Doctor-specific components
│   │   │   └── common/        # Shared components
│   │   ├── slices/            # Redux state management
│   │   ├── services/          # API service wrappers
│   │   └── data/              # Static data (symptoms list, etc)
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── tailwind.config.js     # Tailwind CSS config
│
├── server/                      # Node.js backend
│   ├── controllers/           # Request handlers
│   ├── models/               # Database schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # JWT auth, logging, etc
│   ├── utils/                # Helper functions
│   ├── index.js              # Main server file
│   ├── package.json          # Dependencies
│   └── .env                  # Environment variables (local only)
│
├── ml-service/                # Python ML service
│   ├── models/               # ML model files
│   ├── saved_models/         # Trained model storage
│   ├── main.py              # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment variables (local only)
│
├── tests/                      # Test files
├── playwright/                 # E2E test configuration
└── LogFiles/                   # Documentation and logs
```

---

## Installation Guide

### Step 1: Clone or Open the Project

If you have the project as a ZIP file:
```bash
cd "c:\Users\DELL\OneDrive\Documents"
# Extract "Clinicall Backend.zip" to this folder
```

Or if using Git:
```bash
git clone <repository-url> "Clinicall Backend"
cd "Clinicall Backend"
```

### Step 2: Install Frontend Dependencies

```bash
# Navigate to frontend folder
cd frontend

# Install Node packages
npm install

# Expected output: "added XXX packages"
# Wait 2-3 minutes

# Return to root
cd ..
```

**What this does**: Downloads all React, Redux, Tailwind, and other frontend dependencies from npm registry.

### Step 3: Install Backend Dependencies

```bash
# Navigate to backend folder
cd server

# Install Node packages
npm install

# Expected output: "added XXX packages"
# Wait 1-2 minutes

# Return to root
cd ..
```

**What this does**: Downloads Express, MongoDB drivers, JWT libraries, and other backend dependencies.

### Step 4: Configure Backend Environment Variables

```bash
# Open server/.env file in any text editor (Notepad, VS Code, etc)
# Edit c:\Users\DELL\OneDrive\Documents\Clinicall Backend\server\.env
```

**Minimum required settings**:
```
# Database
MONGODB_URI=mongodb://localhost:27017/clinicall
# OR if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinicall

# JWT Secret (any random string, e.g.)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Port
PORT=4000

# ML Service URL
ML_SERVICE_URL=http://localhost:8000

# Optional: Email service, Stripe keys, etc (if using)
```

### Step 5: Install Python Dependencies for ML Service

```bash
# Navigate to ML service folder
cd ml-service

# Create Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python packages
pip install fastapi uvicorn scikit-learn pandas joblib nltk pydantic requests python-dotenv httpx numpy -q

# Expected output: "Successfully installed ..."
# Wait 2-3 minutes

# Return to root
cd ..
```

**What this does**: Downloads Python libraries for ML models, FastAPI server, and data processing.

### Step 6: Configure ML Service Environment Variables

```bash
# Open ml-service/.env file in any text editor
# Edit c:\Users\DELL\OneDrive\Documents\Clinicall Backend\ml-service\.env
```

**Minimum required settings**:
```
# ML Service Port
PORT=8000

# Backend API URL (for verification)
BACKEND_URL=http://localhost:4000

# Optional: Logging level
LOG_LEVEL=INFO
```

### Verify Setup is Complete

```bash
# Check all required folders exist
ls frontend/src
ls server/index.js
ls ml-service/main.py

# Check dependencies installed
ls frontend/node_modules
ls server/node_modules

# Check virtual environment (Python)
ls ml-service/venv

# If all above show files/folders, installation is complete
```

---

## Running Each Service

### ⚠️ Important: Run in 3 Separate Terminal Windows

You need **3 terminal windows open at the same time**:
- **Terminal 1**: Frontend (port 3000)
- **Terminal 2**: Backend (port 4000)
- **Terminal 3**: ML Service (port 8000)

### Step 1: Start MongoDB

**If using local MongoDB**:
```bash
# Windows - MongoDB usually auto-starts
# Verify it's running: netstat -ano | findstr :27017

# macOS/Linux
brew services start mongodb-community
```

**If using MongoDB Atlas (cloud)**:
- No action needed, it's already running

### Step 2: Start ML Service (Terminal 1)

```bash
# Navigate to ML service
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\ml-service"

# Activate Python virtual environment
venv\Scripts\activate

# Start ML service
python -m uvicorn main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
[ML] Drug interaction checker ready
[ML] All 4 modules ready
```

**⏱️ Wait**: 30-60 seconds for models to load

**✓ Test in new terminal**:
```bash
curl http://localhost:8000/health
# Should return: {"status": "ok"}
```

### Step 3: Start Backend Server (Terminal 2)

```bash
# Navigate to backend
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\server"

# Start Node backend
node index.js
```

**Expected output**:
```
[ML] callML helper loaded
[Express] Server running on port 4000
[MongoDB] Connected to database
[Auth] JWT middleware loaded
```

**✓ Test in new terminal**:
```bash
curl http://localhost:4000/health
# Should return: {"status": "ok"}
```

### Step 4: Start Frontend (Terminal 3)

```bash
# Navigate to frontend
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\frontend"

# Start React development server
npm start
```

**Expected output**:
```
webpack compiled
React app running on http://localhost:3000
```

**⏱️ Wait**: First startup takes 1-2 minutes

**✓ Browser should open automatically** at `http://localhost:3000`

---

## Verification Checklist

After all 3 services are running, verify everything works:

### Check 1: All Services Running

```bash
# Terminal 1: ML Service
# Should show: "Uvicorn running on http://127.0.0.1:8000"

# Terminal 2: Backend
# Should show: "[Express] Server running on port 4000"

# Terminal 3: Frontend
# Should show: "webpack compiled with no errors"
```

### Check 2: React App Loads

1. Open browser: `http://localhost:3000`
2. Should see Clinicall home page
3. No red errors in browser console (F12)

### Check 3: Can Login

1. Register a test account OR use existing credentials
2. Enter email and password
3. Should redirect to dashboard after successful login

### Check 4: Can Access AI Features

1. Go to Home page (logged in)
2. Should see "AI Symptom Checker" widget
3. Type "fever" in search - should show symptoms dropdown
4. Select a symptom - should appear as a chip tag

### Check 5: Backend API Works

```bash
# Open a new terminal and test
curl http://localhost:4000/api/user/profile -H "Authorization: Bearer YOUR_TOKEN"
# Should return user data (not {"error": "Unauthorized"})
```

### Check 6: ML Service Works

```bash
# Test symptom prediction
curl -X POST http://localhost:8000/ml/symptoms/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"symptoms\":[\"fever\",\"headache\"]}"
# Should return predictions with diseases
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module" error in Backend

**Problem**: `Error: Cannot find module 'express'`

**Solution**:
```bash
cd server
npm install
```

---

### Issue 2: "Port 4000 already in use"

**Problem**: `Error: listen EADDRINUSE :::4000`

**Solution**:
```bash
# Find and kill process using port 4000
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :4000
kill -9 <PID>

# Then restart backend
node index.js
```

---

### Issue 3: MongoDB connection error

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:

Option A - Start local MongoDB:
```bash
# Windows (if installed locally)
net start MongoDB

# macOS
brew services start mongodb-community
```

Option B - Check MongoDB Atlas cluster is running:
- Visit https://cloud.mongodb.com
- Check cluster status is "RUNNING"
- Verify connection string in `.env` is correct

---

### Issue 4: ML Service won't start - "Module not found: fastapi"

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd ml-service

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# OR manually
pip install fastapi uvicorn scikit-learn pandas joblib nltk pydantic requests python-dotenv httpx numpy -q
```

---

### Issue 5: Frontend blank page or "Cannot GET /"

**Problem**: React doesn't load, shows blank page or error

**Solution**:
```bash
# Clear React cache and reinstall
cd frontend
rm -rf node_modules
rm -rf .next (if exists)
npm cache clean --force
npm install

# Clear browser cache (Ctrl+Shift+Delete)
# Restart with
npm start
```

---

### Issue 6: "API is not defined" or "Cannot read property of undefined"

**Problem**: Components can't call backend API

**Solution**:

1. Check backend is running on port 4000
2. Check API service import:
   ```javascript
   // CORRECT
   import api from "../../services/Api";  // Capital A
   
   // WRONG
   import api from "../../services/api";  // lowercase a
   ```

3. Verify JWT token is stored in localStorage

---

### Issue 7: Black screen or infinite loading in React

**Problem**: React compiles but shows nothing

**Solution**:
```bash
# Check for TypeScript errors
cd frontend
npm run build

# If errors, check
npm run lint

# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules
npm install
npm start
```

---

## Testing

### Manual Testing

**Test 1: Symptom Checker**
```bash
# Terminal: ML Service running
curl -X POST http://localhost:8000/ml/symptoms/predict \
  -H "Content-Type: application/json" \
  -d "{\"symptoms\":[\"fever\",\"cough\",\"headache\"]}"
```

**Expected**: Returns top 3 disease predictions with confidence scores

**Test 2: Drug Interaction Check**
```bash
curl -X POST http://localhost:8000/ml/drugs/check \
  -H "Content-Type: application/json" \
  -d "{\"medications\":[\"Aspirin\",\"Warfarin\"]}"
```

**Expected**: Returns interaction warnings

**Test 3: Doctor Recommendation**
```bash
curl "http://localhost:8000/ml/doctors/recommend?disease=Influenza&specialization=General+Physician"
```

**Expected**: Returns list of recommended doctors

### Automated Testing

Run E2E tests:
```bash
cd playwright
npx playwright test
```

Run backend tests:
```bash
cd server
npm test
```

---

## Quick Reference Commands

### Start All Services (Quick Method)

**Terminal 1 - ML Service**:
```bash
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\ml-service"
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Backend**:
```bash
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\server"
node index.js
```

**Terminal 3 - Frontend**:
```bash
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend\frontend"
npm start
```

### Stop All Services

```bash
# In each terminal, press: Ctrl + C
```

### Clean Install (If Something Breaks)

```bash
# Stop all services first

# Backend
cd server
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm cache clean --force
npm install

# ML Service
cd ml-service
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn scikit-learn pandas joblib nltk pydantic requests python-dotenv httpx numpy -q
```

### Check Ports Are Available

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :3000
lsof -i :4000
lsof -i :8000
```

### View Logs

**Backend Logs**:
```bash
# Already displayed in terminal 2 where server is running
```

**ML Service Logs**:
```bash
# Already displayed in terminal 1 where ML service is running
```

**Frontend Logs**:
```bash
# Open browser Console (F12 or Right-click → Inspect → Console tab)
```

---

## Troubleshooting Flowchart

```
Does the app load at http://localhost:3000?
  ├─ YES → Can you log in?
  │         ├─ YES → Can you use AI features?
  │         │         ├─ YES → ✓ Everything works!
  │         │         └─ NO → Check ML Service is running (Terminal 1)
  │         └─ NO → Check Backend is running (Terminal 2)
  └─ NO → Check Frontend is running (Terminal 3) - see "Black screen" fix
```

---

## Next Steps After Setup

1. **Read Code**: Start with `frontend/src/pages/Home.jsx`
2. **Explore APIs**: Check `server/routes/` folder
3. **Understand Redux**: Look at `frontend/src/slices/`
4. **Test Features**: Use Postman to test API endpoints
5. **Run Tests**: Execute automated test suite
6. **Deploy**: Follow deployment guide (separate document)

---

## Support & Documentation

- **Frontend Docs**: See `frontend/README.md`
- **Backend Docs**: See `server/README.md` or `LogFiles/ADMIN_API_DOCS.md`
- **ML Service Docs**: See `LogFiles/FHIR_API.md`
- **Architecture**: See `ARCHITECTURE_REFERENCE.md`
- **Testing**: See `E2E_TEST_EXECUTION_GUIDE.md`

---

## Checklist: Your First Run

- [ ] Node.js installed (`node --version` works)
- [ ] Python installed (`python --version` works)
- [ ] MongoDB running or MongoDB Atlas connected
- [ ] Frontend dependencies installed (`frontend/node_modules` exists)
- [ ] Backend dependencies installed (`server/node_modules` exists)
- [ ] ML Service virtual environment created (`ml-service/venv` exists)
- [ ] Backend `.env` file configured
- [ ] ML Service `.env` file configured
- [ ] Terminal 1: ML Service started and showing "Uvicorn running"
- [ ] Terminal 2: Backend started and showing "Server running on port 4000"
- [ ] Terminal 3: Frontend started and browser opened to localhost:3000
- [ ] Can log in to the application
- [ ] Can see AI Symptom Checker on Home page
- [ ] No red errors in browser console

**Once all are checked ✓**, your setup is complete and you're ready to develop!

---

## Useful Links

- **Node.js**: https://nodejs.org/
- **Python**: https://www.python.org/
- **MongoDB**: https://www.mongodb.com/
- **React Docs**: https://react.dev/
- **Express.js**: https://expressjs.com/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/

---

**Last Updated**: March 19, 2026  
**Version**: 1.0  
**Maintained By**: Development Team
