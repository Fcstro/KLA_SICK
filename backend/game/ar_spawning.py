import requests
import math
import random
import time
from typing import Dict, Any, List, Optional, Tuple
from .config import ENEMY_STATS

class ARSpawningSystem:
    def __init__(self):
        # API Keys (you'll need to get these)
        self.google_places_api_key = None  # Get from Google Cloud Console
        self.foursquare_api_key = None      # Get from Foursquare Developer Portal
        
        # Cache for POI data to reduce API calls
        self.poi_cache = {}
        self.cache_expiry = 3600  # 1 hour cache
        
        # Spawn configuration
        self.spawn_radius = 100  # meters
        self.max_pois_per_request = 20
        self.poi_types_for_spawning = [
            'tourist_attraction', 'park', 'museum', 'art_gallery',
            'restaurant', 'cafe', 'store', 'shopping_mall',
            'place_of_worship', 'landmark', 'point_of_interest'
        ]
    
    def get_nearby_pois_google(self, lat: float, lon: float, radius: int = 200) -> List[Dict[str, Any]]:
        """Get nearby Points of Interest using Google Places API"""
        if not self.google_places_api_key:
            return []
        
        cache_key = f"google_{lat}_{lon}_{radius}"
        if cache_key in self.poi_cache:
            cached_data, timestamp = self.poi_cache[cache_key]
            if time.time() - timestamp < self.cache_expiry:
                return cached_data
        
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{lat},{lon}",
            'radius': radius,
            'type': 'point_of_interest',
            'key': self.google_places_api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            pois = []
            for place in data.get('results', []):
                poi = {
                    'name': place.get('name', 'Unknown'),
                    'lat': place['geometry']['location']['lat'],
                    'lon': place['geometry']['location']['lng'],
                    'types': place.get('types', []),
                    'rating': place.get('rating', 0),
                    'place_id': place.get('place_id', ''),
                    'source': 'google'
                }
                pois.append(poi)
            
            # Cache the results
            self.poi_cache[cache_key] = (pois, time.time())
            return pois[:self.max_pois_per_request]
            
        except Exception as e:
            print(f"Google Places API error: {e}")
            return []
    
    def get_nearby_pois_foursquare(self, lat: float, lon: float, radius: int = 200) -> List[Dict[str, Any]]:
        """Get nearby Points of Interest using Foursquare API"""
        if not self.foursquare_api_key:
            return []
        
        cache_key = f"foursquare_{lat}_{lon}_{radius}"
        if cache_key in self.poi_cache:
            cached_data, timestamp = self.poi_cache[cache_key]
            if time.time() - timestamp < self.cache_expiry:
                return cached_data
        
        url = "https://api.foursquare.com/v3/places/search"
        headers = {
            'Authorization': f'{self.foursquare_api_key}',
            'accept': 'application/json'
        }
        params = {
            'll': f"{lat},{lon}",
            'radius': radius,
            'limit': self.max_pois_per_request,
            'fields': 'name,geocodes,location,rating,categories'
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            pois = []
            for place in data.get('results', []):
                poi = {
                    'name': place.get('name', 'Unknown'),
                    'lat': place['geocodes']['main']['latitude'],
                    'lon': place['geocodes']['main']['longitude'],
                    'types': [cat.get('name', '') for cat in place.get('categories', [])],
                    'rating': place.get('rating', 0),
                    'place_id': place.get('fsq_id', ''),
                    'source': 'foursquare'
                }
                pois.append(poi)
            
            # Cache the results
            self.poi_cache[cache_key] = (pois, time.time())
            return pois
            
        except Exception as e:
            print(f"Foursquare API error: {e}")
            return []
    
    def get_nearby_pois_osm(self, lat: float, lon: float, radius: int = 200) -> List[Dict[str, Any]]:
        """Get nearby Points of Interest using OpenStreetMap (Overpass API) - Free option"""
        cache_key = f"osm_{lat}_{lon}_{radius}"
        if cache_key in self.poi_cache:
            cached_data, timestamp = self.poi_cache[cache_key]
            if time.time() - timestamp < self.cache_expiry:
                return cached_data
        
        # Calculate bounding box
        def deg2rad(deg):
            return deg * math.pi / 180
        
        def get_bounding_box(lat, lon, radius_meters):
            lat_delta = radius_meters / 111320  # 1 degree latitude ≈ 111.32 km
            lon_delta = radius_meters / (111320 * math.cos(deg2rad(lat)))
            return {
                'south': lat - lat_delta,
                'north': lat + lat_delta,
                'west': lon - lon_delta,
                'east': lon + lon_delta
            }
        
        bbox = get_bounding_box(lat, lon, radius)
        
        # Overpass QL query for POIs
        overpass_url = "https://overpass-api.de/api/interpreter"
        overpass_query = f"""
        [out:json][timeout:25];
        (
          node["tourism"~"attraction|museum|art_gallery"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
          node["amenity"~"restaurant|cafe|fast_food"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
          node["shop"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
          node["leisure"~"park|playground"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
          node["historic"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
        );
        out geom;
        """
        
        try:
            response = requests.get(overpass_url, params={'data': overpass_query}, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            pois = []
            for element in data.get('elements', []):
                if element['type'] == 'node':
                    tags = element.get('tags', {})
                    poi = {
                        'name': tags.get('name', 'Unknown Location'),
                        'lat': element['lat'],
                        'lon': element['lon'],
                        'types': [key for key in tags.keys() if key in ['tourism', 'amenity', 'shop', 'leisure', 'historic']],
                        'rating': 0,  # OSM doesn't provide ratings
                        'place_id': str(element['id']),
                        'source': 'osm',
                        'tags': tags
                    }
                    pois.append(poi)
            
            # Cache the results
            self.poi_cache[cache_key] = (pois, time.time())
            return pois[:self.max_pois_per_request]
            
        except Exception as e:
            print(f"OpenStreetMap API error: {e}")
            return []
    
    def get_all_nearby_pois(self, lat: float, lon: float, radius: int = 200) -> List[Dict[str, Any]]:
        """Get POIs from all available sources"""
        all_pois = []
        
        # Try OSM first (free)
        osm_pois = self.get_nearby_pois_osm(lat, lon, radius)
        all_pois.extend(osm_pois)
        
        # Try Google Places if API key is available
        if self.google_places_api_key:
            google_pois = self.get_nearby_pois_google(lat, lon, radius)
            # Remove duplicates based on location
            for poi in google_pois:
                if not any(self._is_same_location(poi, existing) for existing in all_pois):
                    all_pois.append(poi)
        
        # Try Foursquare if API key is available
        if self.foursquare_api_key:
            foursquare_pois = self.get_nearby_pois_foursquare(lat, lon, radius)
            for poi in foursquare_pois:
                if not any(self._is_same_location(poi, existing) for existing in all_pois):
                    all_pois.append(poi)
        
        return all_pois
    
    def _is_same_location(self, poi1: Dict, poi2: Dict, threshold: float = 0.0001) -> bool:
        """Check if two POIs are essentially the same location"""
        lat_diff = abs(poi1['lat'] - poi2['lat'])
        lon_diff = abs(poi1['lon'] - poi2['lon'])
        return lat_diff < threshold and lon_diff < threshold
    
    def calculate_spawn_probability(self, poi: Dict[str, Any], player_level: int = 1) -> float:
        """Calculate spawn probability based on POI characteristics"""
        base_probability = 0.3  # 30% base chance
        
        # Adjust based on POI type
        poi_types = poi.get('types', [])
        type_bonus = 0
        
        if any('tourism' in str(t).lower() or 'attraction' in str(t).lower() for t in poi_types):
            type_bonus += 0.3  # Tourist attractions are great spawn points
        elif any('park' in str(t).lower() or 'leisure' in str(t).lower() for t in poi_types):
            type_bonus += 0.2  # Parks are good spawn points
        elif any('restaurant' in str(t).lower() or 'shop' in str(t).lower() for t in poi_types):
            type_bonus += 0.1  # Commercial areas are okay
        
        # Adjust based on rating (if available)
        rating = poi.get('rating', 0)
        rating_bonus = min(rating / 5.0 * 0.2, 0.2)  # Max 20% bonus for 5-star places
        
        # Adjust based on player level (higher level = more spawns)
        level_bonus = min(player_level * 0.05, 0.3)  # Max 30% bonus
        
        # Time of day bonus (daytime = more spawns)
        current_hour = time.localtime().tm_hour
        time_bonus = 0.1 if 8 <= current_hour <= 20 else -0.1
        
        total_probability = base_probability + type_bonus + rating_bonus + level_bonus + time_bonus
        return max(0.1, min(1.0, total_probability))  # Clamp between 10% and 100%
    
    def select_enemy_type_for_poi(self, poi: Dict[str, Any], player_level: int = 1) -> str:
        """Select appropriate enemy type based on POI characteristics"""
        poi_types = poi.get('types', [])
        
        # Determine enemy type based on location
        if any('tourism' in str(t).lower() or 'museum' in str(t).lower() for t in poi_types):
            # Tourist areas - more variety, including rare enemies
            weights = [60, 30, 10]  # More class3 (dragons) in tourist areas
        elif any('park' in str(t).lower() or 'leisure' in str(t).lower() for t in poi_types):
            # Parks - balanced spawn
            weights = [70, 25, 5]
        elif any('restaurant' in str(t).lower() or 'shop' in str(t).lower() for t in poi_types):
            # Commercial areas - more common enemies
            weights = [80, 18, 2]
        else:
            # Default weights
            weights = [70, 25, 5]
        
        # Adjust weights based on player level
        if player_level >= 5:
            weights = [50, 35, 15]  # More challenging enemies for higher levels
        elif player_level >= 10:
            weights = [40, 35, 25]  # Even more challenging
        
        return random.choices(["class1", "class2", "class3"], weights=weights)[0]
    
    def spawn_enemy_at_poi(self, poi: Dict[str, Any], player_level: int = 1) -> Optional[Dict[str, Any]]:
        """Spawn an enemy at a specific POI location"""
        spawn_chance = self.calculate_spawn_probability(poi, player_level)
        
        if random.random() > spawn_chance:
            return None
        
        enemy_type = self.select_enemy_type_for_poi(poi, player_level)
        enemy_stats = ENEMY_STATS[enemy_type]
        
        enemy = {
            "type": enemy_type,
            "hp": enemy_stats["hp"],
            "max_hp": enemy_stats["hp"],
            "atk": enemy_stats["atk"],
            "name": enemy_stats["name"],
            "spawn_time": time.time(),
            "location": {
                "lat": poi['lat'],
                "lon": poi['lon'],
                "poi_name": poi['name'],
                "poi_type": poi.get('types', ['unknown'])[0] if poi.get('types') else 'unknown'
            },
            "spawn_source": "ar_poi"
        }
        
        return enemy
    
    def find_best_spawn_location(self, player_lat: float, player_lon: float, player_level: int = 1) -> Optional[Dict[str, Any]]:
        """Find the best POI to spawn an enemy near the player"""
        pois = self.get_all_nearby_pois(player_lat, player_lon, self.spawn_radius)
        
        if not pois:
            return None
        
        # Sort POIs by spawn probability
        pois_with_probability = []
        for poi in pois:
            prob = self.calculate_spawn_probability(poi, player_level)
            pois_with_probability.append((poi, prob))
        
        pois_with_probability.sort(key=lambda x: x[1], reverse=True)
        
        # Try to spawn at the best locations first
        for poi, prob in pois_with_probability[:5]:  # Try top 5 locations
            enemy = self.spawn_enemy_at_poi(poi, player_level)
            if enemy:
                return enemy
        
        return None
    
    def set_api_keys(self, google_api_key: str = None, foursquare_api_key: str = None):
        """Set API keys for external services"""
        if google_api_key:
            self.google_places_api_key = google_api_key
        if foursquare_api_key:
            self.foursquare_api_key = foursquare_api_key
    
    def get_spawn_info(self, player_lat: float, player_lon: float) -> Dict[str, Any]:
        """Get information about potential spawn locations for debugging"""
        pois = self.get_all_nearby_pois(player_lat, player_lon, self.spawn_radius)
        
        spawn_info = {
            "player_location": {"lat": player_lat, "lon": player_lon},
            "search_radius": self.spawn_radius,
            "pois_found": len(pois),
            "poi_sources": {},
            "potential_spawns": []
        }
        
        # Count POIs by source
        for poi in pois:
            source = poi['source']
            spawn_info["poi_sources"][source] = spawn_info["poi_sources"].get(source, 0) + 1
        
        # Calculate potential spawns
        for poi in pois[:10]:  # Show top 10
            prob = self.calculate_spawn_probability(poi)
            spawn_info["potential_spawns"].append({
                "name": poi['name'],
                "types": poi.get('types', []),
                "distance": self._calculate_distance(player_lat, player_lon, poi['lat'], poi['lon']),
                "spawn_probability": prob,
                "source": poi['source']
            })
        
        return spawn_info
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in meters"""
        R = 6371000  # Earth's radius in meters
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
        return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

# Global AR spawning system instance
ar_spawning_system = ARSpawningSystem()
