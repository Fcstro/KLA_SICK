# AR Enemy Spawning System Guide

## 🎯 Overview

This system provides realistic AR enemy spawning using real-world Points of Interest (POI) data from multiple sources, making your GPS-based RPG feel like a true augmented reality experience.

## 🌍 Supported Data Sources

### 1. **OpenStreetMap (Overpass API) - FREE** 🆓
- **Coverage**: Global
- **Cost**: Free
- **Data Types**: Tourist attractions, parks, restaurants, shops, historic sites
- **Pros**: No API key required, good coverage
- **Cons**: No ratings, less detailed data

### 2. **Google Places API** 💰
- **Coverage**: Global
- **Cost**: $200/month free tier, then $2.50 per 1000 calls
- **Data Types**: All POIs with ratings, photos, reviews
- **Pros**: High quality, detailed information
- **Cons**: Requires API key and billing setup

### 3. **Foursquare Places API** 💰
- **Coverage**: Global (100M+ POIs)
- **Cost**: Free tier available, paid plans start at $500/month
- **Data Types**: Venues, restaurants, attractions with ratings
- **Pros**: Rich venue data, user-generated content
- **Cons**: Expensive for high usage

## 🚀 Quick Setup

### 1. **Free Setup (OpenStreetMap Only)**
```python
# No API keys needed - works out of the box!
# The system automatically uses OpenStreetMap as the primary source
```

### 2. **Premium Setup (Google + Foursquare)**
```bash
# Get API Keys:
# 1. Google Places API: https://console.cloud.google.com/
# 2. Foursquare: https://developer.foursquare.com/

# Set keys via API:
curl -X POST http://localhost:5000/set-ar-api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "google_api_key": "YOUR_GOOGLE_API_KEY",
    "foursquare_api_key": "YOUR_FOURSQUARE_API_KEY"
  }'
```

## 🎮 How AR Spawning Works

### **Spawn Logic Flow**
1. **Player Movement**: Player travels ≥5 meters
2. **Distance Check**: Total travel ≥10 meters since last spawn
3. **POI Discovery**: Find nearby Points of Interest within 100m radius
4. **Location Analysis**: Calculate spawn probability based on POI type
5. **Enemy Selection**: Choose appropriate enemy type for location
6. **Spawn Creation**: Generate enemy at real-world location

### **Spawn Probability Factors**
| Factor | Impact | Example |
|--------|--------|---------|
| **POI Type** | +10% to +30% | Tourist attraction: +30%, Park: +20% |
| **POI Rating** | Up to +20% | 5-star place: +20% spawn bonus |
| **Player Level** | +5% per level | Level 10: +30% max bonus |
| **Time of Day** | ±10% | Daytime (8am-8pm): +10%, Night: -10% |

### **Enemy Type Selection by Location**
| Location Type | Enemy Weights (Class1/2/3) |
|---------------|----------------------------|
| Tourist Areas | 60% / 30% / 10% (more rare enemies) |
| Parks | 70% / 25% / 5% (balanced) |
| Commercial Areas | 80% / 18% / 2% (mostly common) |
| High Level Player (10+) | 40% / 35% / 25% (more challenging) |

## 🗺️ Real-World Integration Examples

### **Tourist Attraction Spawns**
```json
{
  "enemy": "class3",
  "name": "Dragon",
  "location": {
    "lat": 40.7589,
    "lon": -73.9851,
    "poi_name": "Empire State Building",
    "poi_type": "tourist_attraction"
  },
  "spawn_source": "ar_poi"
}
```

### **Park Spawns**
```json
{
  "enemy": "class2", 
  "name": "Orc",
  "location": {
    "lat": 40.7829,
    "lon": -73.9654,
    "poi_name": "Central Park",
    "poi_type": "park"
  },
  "spawn_source": "ar_poi"
}
```

## 🔧 API Endpoints

### **Get AR Spawn Information**
```bash
curl http://localhost:5000/ar-spawn-info?player_id=abc123
```

**Response:**
```json
{
  "player_location": {"lat": 40.7589, "lon": -73.9851},
  "search_radius": 100,
  "pois_found": 15,
  "poi_sources": {"osm": 12, "google": 3},
  "potential_spawns": [
    {
      "name": "Empire State Building",
      "types": ["tourism", "attraction"],
      "distance": 45.2,
      "spawn_probability": 0.85,
      "source": "google"
    }
  ]
}
```

### **Test AR Spawning**
```bash
curl -X POST http://localhost:5000/test-ar-spawn \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 40.7589,
    "lon": -73.9851,
    "player_level": 5
  }'
```

### **Set API Keys**
```bash
curl -X POST http://localhost:5000/set-ar-api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "google_api_key": "YOUR_KEY_HERE",
    "foursquare_api_key": "YOUR_KEY_HERE"
  }'
```

## 🎯 Frontend Integration

### **Enhanced Enemy Spawn Response**
When an enemy spawns via AR system, you'll get additional data:

```javascript
// Standard spawn response
{
  "spawn": true,
  "enemy": "class3",
  "enemy_stats": {...},
  "distance_traveled": 25.3,
  "ar_location": {  // 🆕 AR-specific data
    "lat": 40.7589,
    "lon": -73.9851,
    "poi_name": "Empire State Building",
    "poi_type": "tourist_attraction"
  }
}
```

### **Display AR Context**
```javascript
if (response.ar_location) {
  // Show AR-specific UI
  showARContext({
    location: response.ar_location.poi_name,
    type: response.ar_location.poi_type,
    message: `Enemy spawned at ${response.ar_location.poi_name}!`
  });
}
```

### **Spawn Probability Visualization**
```javascript
// Get spawn info for debugging/visualization
fetch('/ar-spawn-info?player_id=' + playerId)
  .then(response => response.json())
  .then(data => {
    // Show nearby POIs and spawn chances
    displaySpawnMap(data.potential_spawns);
  });
```

## 🌟 Advanced Features

### **Caching System**
- **Duration**: 1 hour cache for POI data
- **Purpose**: Reduce API calls and improve performance
- **Automatic**: Cache refreshes on expiry

### **Fallback System**
If AR spawning fails:
1. **Primary**: Try AR POI system
2. **Fallback**: Use legacy random spawning (30% chance)
3. **Safety**: Always guarantee some spawn possibility

### **Multi-Source Integration**
- **Deduplication**: Removes duplicate POIs from different sources
- **Priority**: Google > Foursquare > OpenStreetMap
- **Quality**: Higher-rated sources preferred

## 📊 Performance & Costs

### **API Usage Estimates**
| Player Activity | Daily API Calls | Monthly Cost (Google) |
|-----------------|-----------------|----------------------|
| 1 player, 1 hour/day | ~100 calls | FREE |
| 10 players, 1 hour/day | ~1,000 calls | FREE |
| 100 players, 1 hour/day | ~10,000 calls | $25 |
| 1,000 players, 1 hour/day | ~100,000 calls | $250 |

### **Optimization Tips**
1. **Use OpenStreetMap** for free development/testing
2. **Increase cache duration** for less frequent updates
3. **Reduce search radius** to lower API calls
4. **Batch requests** when possible

## 🛠️ Configuration Options

### **Spawn Settings** (in `ar_spawning.py`)
```python
self.spawn_radius = 100  # meters - search radius for POIs
self.max_pois_per_request = 20  # limit API results
self.cache_expiry = 3600  # seconds - cache duration
```

### **Enemy Weights** (in `movement.py`)
```python
# Tourist areas - more rare enemies
weights = [60, 30, 10]  # class1, class2, class3

# High level players - more challenging
if player_level >= 10:
    weights = [40, 35, 25]
```

## 🎮 Gameplay Benefits

### **Realistic AR Experience**
- Enemies spawn at real locations
- Context-aware enemy placement
- Immersive location-based gameplay

### **Strategic Depth**
- Players learn high-spawn areas
- Different enemies in different location types
- Exploration rewarded with better spawns

### **Player Engagement**
- Real-world landmarks become gameplay elements
- Location variety creates fresh experiences
- Social sharing of spawn discoveries

## 🔍 Troubleshooting

### **No AR Spawns Happening**
1. Check if player has traveled ≥10 meters
2. Verify location data is accurate
3. Test with `/test-ar-spawn` endpoint
4. Check API key configuration

### **High API Costs**
1. Increase cache duration
2. Reduce spawn radius
3. Use OpenStreetMap for development
4. Implement rate limiting

### **Inaccurate Spawns**
1. Check GPS accuracy on client
2. Verify POI data quality
3. Adjust spawn probability factors
4. Review distance calculations

## 🚀 Future Enhancements

### **Planned Features**
1. **Weather-based spawning**: Different enemies by weather
2. **Time-based events**: Special spawns at specific times
3. **Crowd-sourced POIs**: Player-submitted locations
4. **AR overlays**: Visual indicators in AR view
5. **Social features**: Shared spawn locations

### **Integration Ideas**
1. **Google Lens**: Visual POI recognition
2. **ARCore/ARKit**: Native AR positioning
3. **Mapbox**: Alternative mapping service
4. **HERE Maps**: Another POI data source

## 📚 Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Foursquare API Documentation](https://docs.foursquare.com/developer/reference/)
- [OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [ARCore Geospatial API](https://developers.google.com/ar/develop/geospatial)

---

**🎮 Ready to create true AR experiences?** The system works immediately with OpenStreetMap, and scales up with premium data sources for the ultimate location-based RPG experience!
