# 🧪 Testing WebAR RPG Locally

## Quick Start Testing

### Method 1: Double-click Test Script
1. **Double-click**: `test_locally.bat`
2. **Wait**: Dependencies install
3. **Open browser**: Go to `http://localhost:5000`

### Method 2: Manual Commands
```bash
# Navigate to backend folder
cd backend

# Install dependencies
python -m pipenv install

# Start server
python -m pipenv run python app/app.py
```

## 📱 Mobile Testing

### For Phone/Tablet Testing:
1. **Run the server** (see above)
2. **Find your IP**: Server will show your local IP
3. **Open on phone**: `https://[YOUR-IP]:5000`
4. **Accept security warning** (HTTPS required for camera)

### Example:
```
✅ READY TO CONNECT
📱 Open on phone: https://192.168.1.100:5000
⚠️  Accept security warning when prompted
```

## 🎮 What to Test

### 1. Landing Page
- [ ] "KLA SICK" logo animation
- [ ] "Start Adventure" button
- [ ] "View Leaderboard" toggle
- [ ] Mobile responsive design

### 2. Character Selection
- [ ] All 5 characters display
- [ ] Selection works
- [ ] "Start Adventure" leads to game

### 3. AR Game
- [ ] Camera permission (back camera)
- [ ] Location permission
- [ ] Debug enemy spawn button
- [ ] Health bars update
- [ ] Combat system
- [ ] Healing system

### 4. Navigation
- [ ] Back buttons work
- [ ] SPA routing smooth
- [ ] No page reloads

## 🔧 Common Issues

### Camera/Location Not Working?
- **Must use HTTPS** on mobile devices
- **Accept permissions** when prompted
- **Use back camera** (facingMode: 'environment')

### Server Won't Start?
- **Check Python version**: Python 3.11+
- **Install pipenv**: `pip install pipenv`
- **Check firewall**: Allow port 5000

### Can't Access on Phone?
- **Same WiFi network** as computer
- **Check firewall settings**
- **Use correct IP address**

## 📊 Test Checklist

- [ ] Landing page loads
- [ ] Logo animation plays
- [ ] Leaderboard shows data
- [ ] Character selection works
- [ ] AR camera starts
- [ ] Enemy spawning works
- [ ] Combat system functional
- [ ] Health bars update
- [ ] Mobile responsive
- [ ] Back navigation works

## 🚀 Ready to Deploy?

Once everything works locally:
```bash
git add .
git commit -m "Test complete - ready for deployment"
git push
```

Your game will be live on Render.com!
