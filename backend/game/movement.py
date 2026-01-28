import math
import random
import time
from typing import Dict, Any, Optional
from .config import ENEMY_STATS, SPAWN_DISTANCE_THRESHOLD, MIN_TRAVEL_DISTANCE, SPAWN_RATE

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

def check_enemy_spawn(player: Dict[str, Any], distance_traveled: float) -> Optional[Dict[str, Any]]:
    """Check if an enemy should spawn based on player movement (legacy system)"""
    # Only consider spawn if player traveled minimum distance
    if distance_traveled < SPAWN_DISTANCE_THRESHOLD:
        return None
    
    # Check if player has traveled enough for guaranteed spawn chance
    if player["distance_since_last_spawn"] < MIN_TRAVEL_DISTANCE:
        return None
    
    # Random spawn check
    if random.random() > SPAWN_RATE:
        return None
    
    # Select enemy type based on weighted probabilities
    enemy_type = random.choices(
        ["class1", "class2", "class3"],
        weights=[70, 25, 5]
    )[0]
    
    # Create enemy instance
    enemy_stats = ENEMY_STATS[enemy_type]
    enemy = {
        "type": enemy_type,
        "hp": enemy_stats["hp"],
        "max_hp": enemy_stats["hp"],
        "atk": enemy_stats["atk"],
        "name": enemy_stats["name"],
        "spawn_time": time.time(),
        "spawn_source": "legacy"
    }
    
    return enemy

def check_ar_enemy_spawn(player: Dict[str, Any], distance_traveled: float) -> Optional[Dict[str, Any]]:
    """Check if an enemy should spawn using AR POI-based system"""
    # Only consider spawn if player traveled minimum distance
    if distance_traveled < SPAWN_DISTANCE_THRESHOLD:
        return None
    
    # Check if player has traveled enough for AR spawn chance
    if player["distance_since_last_spawn"] < MIN_TRAVEL_DISTANCE:
        return None
    
    # Get player's last location
    last_location = player["last_location"]
    if not last_location:
        return None
    
    # Use AR spawning system
    try:
        from .ar_spawning import ar_spawning_system
        enemy = ar_spawning_system.find_best_spawn_location(
            last_location[0], 
            last_location[1], 
            player["level"]
        )
        
        if enemy:
            return enemy
            
    except Exception as e:
        print(f"AR spawning error: {e}")
        # Fallback to legacy system
        return check_enemy_spawn(player, distance_traveled)
    
    # If no AR spawn found, try legacy system with lower probability
    if random.random() < 0.3:  # 30% chance for legacy fallback
        return check_enemy_spawn(player, distance_traveled)
    
    return None

def spawn_enemy(enemy_type: str) -> Dict[str, Any]:
    """Manually spawn an enemy of specified type"""
    if enemy_type not in ENEMY_STATS:
        raise ValueError(f"Invalid enemy type: {enemy_type}")
    
    enemy_stats = ENEMY_STATS[enemy_type]
    return {
        "type": enemy_type,
        "hp": enemy_stats["hp"],
        "max_hp": enemy_stats["hp"],
        "atk": enemy_stats["atk"],
        "name": enemy_stats["name"],
        "spawn_time": time.time(),
        "spawn_source": "manual"
    }
