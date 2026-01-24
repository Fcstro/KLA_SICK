# WebAR RPG Game

A mobile browser-based AR role-playing game that uses real-world movement, GPS data, and camera-based interaction.

## 🎮 Game Features

- **Character Selection**: Choose from 5 unique characters (Warrior, Mage, Archer, Healer, Rogue)
- **Camera-Based AR**: Live camera feed as game background
- **GPS Movement**: Real-world movement triggers enemy encounters
- **Combat System**: Battle enemies and gain XP
- **Leveling System**: Progress through levels by defeating enemies
- **Leaderboard**: Track kills and XP

## 🚀 Deployment

### Local Development
```bash
cd backend
pipenv install
pipenv run python app/app.py
```

### Render.com Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/webar-rpg.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select "Python 3" as runtime
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python backend/app/app.py`
   - Click "Create Web Service"

3. **Access Your Game**
   - Render will provide a HTTPS URL
   - Open on mobile browser
   - Allow camera and location permissions

## 📱 Mobile Requirements

- **Browser**: Chrome (recommended) or Safari
- **Permissions**: Camera and Location access required
- **Connection**: HTTPS required for AR features

## 🛠️ Technical Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **APIs**: Geolocation API, MediaDevices API
- **Deployment**: Render.com (recommended)

## 🎯 Game Mechanics

- **Enemy Spawning**: Based on real-world movement (8+ meters)
- **Enemy Classes**: 
  - Class 1 (Common) - 70% spawn rate, 10 XP
  - Class 2 (Elite) - 25% spawn rate, 25 XP  
  - Class 3 (Boss) - 5% spawn rate, 50 XP
- **Leveling**: 100 XP per level

## 📄 License

This project is for educational purposes.
