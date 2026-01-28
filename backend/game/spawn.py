import math
import random
import time

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two GPS coordinates in meters.
    Uses the Haversine formula.
    """
    # Earth's radius in meters
    earth_radius = 6371000
    
    # Convert latitude and longitude to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Differences
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Haversine formula
    a = (math.sin(dlat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = earth_radius * c
    return distance

def should_spawn_enemy(spawn_probability):
    """
    Determine if an enemy should spawn based on probability.
    """
    return random.random() < spawn_probability

def get_enemy_type_by_weight(enemy_weights):
    """
    Select enemy type based on configured weights.
    enemy_weights: dict with enemy types as keys and weights as values
    """
    enemy_types = list(enemy_weights.keys())
    weights = list(enemy_weights.values())
    
    # Normalize weights to ensure they sum to 1
    total_weight = sum(weights)
    if total_weight != 1:
        weights = [w / total_weight for w in weights]
    
    return random.choices(enemy_types, weights=weights)[0]

def check_area_limits(player_location, existing_enemies, config):
    """
    Check if spawning is allowed based on area limits and cooldowns.
    Returns (can_spawn, reason)
    """
    current_time = time.time()
    area_radius = config["area_radius"]
    max_enemies = config["max_enemies_per_area"]
    cooldown = config["spawn_cooldown"]
    
    # Count enemies in current area
    enemies_in_area = 0
    last_spawn_time = None
    
    for enemy in existing_enemies:
        # Calculate distance from player to enemy
        enemy_distance = calculate_distance(
            player_location['lat'], player_location['lon'],
            enemy['lat'], enemy['lon']
        )
        
        if enemy_distance <= area_radius:
            enemies_in_area += 1
            # Track the most recent spawn time in this area
            if enemy.get('spawn_time'):
                if last_spawn_time is None or enemy['spawn_time'] > last_spawn_time:
                    last_spawn_time = enemy['spawn_time']
    
    # Check area limit
    if enemies_in_area >= max_enemies:
        return False, f"Area limit reached ({enemies_in_area}/{max_enemies} enemies)"
    
    # Check cooldown
    if last_spawn_time and (current_time - last_spawn_time) < cooldown:
        remaining_cooldown = cooldown - (current_time - last_spawn_time)
        return False, f"Cooldown active ({remaining_cooldown:.1f}s remaining)"
    
    return True, "Spawning allowed"

def spawn_enemy(enemy_type, location=None):
    """
    Create an enemy with stats based on the configuration.
    """
    from game.config import ENEMY_STATS
    
    if enemy_type not in ENEMY_STATS:
        enemy_type = "class1"  # Default to goblin
    
    enemy_stats = ENEMY_STATS[enemy_type].copy()
    enemy_stats['type'] = enemy_type
    enemy_stats['current_hp'] = enemy_stats['hp']
    enemy_stats['max_hp'] = enemy_stats['hp']
    enemy_stats['spawn_time'] = time.time()  # Track spawn time for cooldown
    
    # Add location if provided
    if location:
        enemy_stats['lat'] = location['lat']
        enemy_stats['lon'] = location['lon']
    
    return enemy_stats
