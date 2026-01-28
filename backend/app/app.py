from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import socket
import uuid
import time
import sys
import os
import functools

# Add the backend directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from game.player import player_manager
from game.combat import combat_system
from game.movement import check_ar_enemy_spawn, spawn_enemy
from game.enemies import enemy_manager
from game.ar_spawning import ar_spawning_system
from game.config import CHARACTERS

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

app = Flask(__name__)
# Restrict CORS to specific origins for security
CORS(app, resources={
    r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}
})

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

def validate_json_data(required_fields):
    """Decorator to validate JSON request data"""
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid JSON data"}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({"error": f"Missing required fields: {missing_fields}"}), 400
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def get_or_create_player_id(request_data=None):
    """Get player ID from request or create a new one"""
    if request_data is None:
        request_data = request.get_json() or {}
    
    player_id = request_data.get("player_id")
    
    if not player_id:
        # Create new player ID for new sessions
        player_id = str(uuid.uuid4())
    
    return player_id

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/select-character", methods=["POST"])
@limiter.limit("10 per minute")
@validate_json_data(["character"])
def select_character():
    try:
        data = request.get_json()
        character_class = data["character"]
        player_id = get_or_create_player_id(data)
        
        player = player_manager.create_player(player_id, character_class)
        
        return jsonify({
            "status": "ok",
            "player_id": player_id,
            "character": character_class,
            "player": {
                "character_class": player["character_class"],
                "max_hp": player["max_hp"],
                "current_hp": player["current_hp"],
                "level": player["level"],
                "xp": player["xp"]
            }
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/update-location", methods=["POST"])
@validate_json_data(["lat", "lon", "player_id"])
def update_location():
    try:
        data = request.get_json()
        lat = data["lat"]
        lon = data["lon"]
        player_id = data["player_id"]
        
        from game.config import SPAWN_CONFIG, ENEMY_STATS
        from game.spawn import calculate_distance, should_spawn_enemy, get_enemy_type_by_weight, check_area_limits, spawn_enemy
        
        player = player_manager.get_player(player_id)
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        # Calculate distance moved
        last_location = player.get('last_location')
        distance_traveled = 0
        should_spawn = False
        spawn_reason = ""
        
        if last_location:
            distance_traveled = calculate_distance(
                last_location['lat'], last_location['lon'],
                lat, lon
            )
            
            # Check if should spawn based on config distance
            if distance_traveled >= SPAWN_CONFIG["spawn_distance"]:
                should_spawn = should_spawn_enemy(SPAWN_CONFIG["spawn_probability"])
                if not should_spawn:
                    spawn_reason = "Probability check failed"
        else:
            # First location update, don't spawn immediately
            should_spawn = False
            spawn_reason = "First location update"
        
        # Update player's last location
        player['last_location'] = {'lat': lat, 'lon': lon}
        
        if should_spawn and not combat_system.get_combat(player_id):
            # Get all existing enemies in combat to check area limits
            existing_enemies = []
            for combat_id, combat_data in combat_system.combats.items():
                if combat_data.get('player_id') == player_id:
                    enemy = combat_data.get('enemy')
                    if enemy:
                        existing_enemies.append(enemy)
            
            # Check area limits and cooldowns
            player_location = {'lat': lat, 'lon': lon}
            can_spawn, reason = check_area_limits(player_location, existing_enemies, SPAWN_CONFIG)
            
            if can_spawn:
                # Get enemy type based on weights from config
                enemy_type = get_enemy_type_by_weight(SPAWN_CONFIG["enemy_weights"])
                enemy = spawn_enemy(enemy_type, player_location)
                combat_system.start_combat(player_id, enemy)
                
                return jsonify({
                    "spawn": True,
                    "enemy": enemy_type,
                    "enemy_stats": enemy,
                    "distance_traveled": distance_traveled,
                    "spawn_reason": "Config-based spawn successful"
                })
            else:
                return jsonify({
                    "spawn": False,
                    "distance_traveled": distance_traveled,
                    "spawn_reason": reason,
                    "config_used": SPAWN_CONFIG
                })
        else:
            return jsonify({
                "spawn": False,
                "distance_traveled": distance_traveled,
                "spawn_reason": spawn_reason or f"Distance threshold not met ({SPAWN_CONFIG['spawn_distance']}m required)",
                "config_used": SPAWN_CONFIG
            })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/player-attack", methods=["POST"])
@limiter.limit("30 per minute")
def player_attack():
    try:
        player_id = get_or_create_player_id()
        player = player_manager.get_player(player_id)
        
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        combat = combat_system.get_combat(player_id)
        if not combat:
            return jsonify({"error": "No enemy to attack"}), 400
        
        # Process combat turn
        result = combat_system.process_combat_turn(player_id, player)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/use-skill", methods=["POST"])
@limiter.limit("20 per minute")
@validate_json_data(["skill_name"])
def use_skill():
    try:
        data = request.get_json()
        player_id = get_or_create_player_id()
        skill_name = data["skill_name"]
        
        player = player_manager.get_player(player_id)
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        combat = combat_system.get_combat(player_id)
        enemy = combat["enemy"] if combat else None
        
        # Use skill
        result = combat_system.use_skill(player, skill_name, enemy)
        
        # Handle escape skill
        if result.get("escaped"):
            combat_system.end_combat(player_id)
            return jsonify({
                "escaped": True,
                "combat_messages": result.get("combat_messages", [])
            })
        
        # Handle combat results if enemy was damaged
        if enemy and result.get("enemy_defeated"):
            from game.config import ENEMY_STATS
            enemy_type = enemy["type"]
            player["kills"][enemy_type] += 1
            
            xp_result = player_manager.add_xp(player["id"], ENEMY_STATS[enemy_type]["xp_reward"])
            result.update({
                "enemy_defeated": True,
                "xp_gained": xp_result["xp_gained"],
                "new_level": xp_result["level"],
                "leveled_up": xp_result["leveled_up"]
            })
            
            if xp_result["leveled_up"]:
                result["combat_messages"].append(f"⭐ LEVEL UP! You are now level {xp_result['level']}!")
            
            combat_system.end_combat(player_id)
        elif enemy and result.get("damage", 0) > 0:
            # Enemy counter-attacks if damaged but not defeated
            enemy_attack_result = combat_system.enemy_attack(enemy)
            if enemy_attack_result["hit"]:
                # Apply damage reduction buffs
                final_damage = combat_system.apply_buffs_to_defense(player, enemy_attack_result["damage"])
                player["current_hp"] -= final_damage
                player["current_hp"] = max(0, player["current_hp"])
                
                result["combat_messages"].append(f"👹 Enemy counter-attacks for {final_damage} damage!")
            else:
                result["combat_messages"].append(f"🛡️ Enemy attack dodged!")
            
            result.update({
                "enemy_attack": enemy_attack_result,
                "player_hp": player["current_hp"],
                "player_defeated": player["current_hp"] <= 0
            })
            
            if player["current_hp"] <= 0:
                result["combat_messages"].append(f"💀 You have been defeated!")
                combat_system.end_combat(player_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/combat-turn", methods=["POST"])
@limiter.limit("20 per minute")
@validate_json_data(["player_id", "action"])
def combat_turn():
    try:
        data = request.get_json()
        player_id = data["player_id"]
        action = data["action"]
        
        player = player_manager.get_player(player_id)
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        # Check if player is in combat
        combat = combat_system.get_combat(player_id)
        if not combat:
            return jsonify({"error": "No active combat"}), 400
        
        # Process combat turn based on action
        if action == "attack":
            # Use character's basic attack
            from game.config import SKILLS
            character_class = player["character_class"]
            attack_skill = None
            
            for skill in SKILLS.get(character_class, []):
                if skill["type"] == "damage" and "damage_multiplier" in skill:
                    attack_skill = skill["name"]
                    break
            
            if not attack_skill:
                return jsonify({"error": "No attack skill found"}), 400
            
            result = combat_system.use_skill(player, attack_skill, combat["enemy"])
            
        elif action == "skill":
            skill_name = data.get("skill_name")
            if not skill_name:
                return jsonify({"error": "Skill name required for skill action"}), 400
            
            result = combat_system.use_skill(player, skill_name, combat["enemy"])
            
        else:
            return jsonify({"error": "Invalid action"}), 400
        
        # Handle escape
        if result.get("escaped"):
            combat_system.end_combat(player_id)
            return jsonify({
                "escaped": True,
                "combat_messages": result.get("combat_messages", [])
            })
        
        # Handle combat results
        if result.get("enemy_defeated"):
            from game.config import ENEMY_STATS
            enemy_type = combat["enemy"]["type"]
            player["kills"][enemy_type] += 1
            
            xp_result = player_manager.add_xp(player["id"], ENEMY_STATS[enemy_type]["xp_reward"])
            result.update({
                "enemy_defeated": True,
                "xp_gained": xp_result["xp_gained"],
                "new_level": xp_result["level"],
                "leveled_up": xp_result["leveled_up"],
                "pending_level_up": xp_result["pending_level_up"],
                "skill_points": xp_result["skill_points"]
            })
            
            if xp_result["leveled_up"]:
                result["combat_messages"].append(f"⭐ LEVEL UP! You are now level {xp_result['level']}!")
            
            combat_system.end_combat(player_id)
        else:
            # Enemy counter-attacks if not defeated
            enemy_attack_result = combat_system.enemy_attack(combat["enemy"])
            if enemy_attack_result["hit"]:
                # Apply damage reduction buffs
                final_damage = combat_system.apply_buffs_to_defense(player, enemy_attack_result["damage"])
                player["current_hp"] -= final_damage
                player["current_hp"] = max(0, player["current_hp"])
                
                result["combat_messages"].append(f"👹 Enemy hits for {final_damage} damage!")
            else:
                result["combat_messages"].append(f"🛡️ Enemy attack dodged!")
            
            result.update({
                "enemy_attack": enemy_attack_result,
                "player_hp": player["current_hp"],
                "player_defeated": player["current_hp"] <= 0
            })
            
            if player["current_hp"] <= 0:
                result["combat_messages"].append(f"💀 You have been defeated!")
                combat_system.end_combat(player_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/heal", methods=["POST"])
@limiter.limit("10 per minute")
def heal():
    try:
        player_id = get_or_create_player_id()
        
        result = player_manager.heal_player(player_id)
        
        if not result["success"]:
            return jsonify(result), 429
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/spawn-enemy", methods=["POST"])
@limiter.limit("5 per minute")
@validate_json_data(["enemy_type"])
def spawn_enemy_route():
    try:
        data = request.get_json()
        player_id = get_or_create_player_id()
        enemy_type = data["enemy_type"]
        
        player = player_manager.get_player(player_id)
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        # End any existing combat
        combat_system.end_combat(player_id)
        
        # Spawn new enemy
        enemy = spawn_enemy(enemy_type)
        combat_system.start_combat(player_id, enemy)
        
        return jsonify({
            "spawn": True,
            "enemy": enemy_type,
            "enemy_stats": enemy
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/get-skills", methods=["GET"])
@limiter.limit("30 per minute")
def get_skills():
    try:
        player_id = get_or_create_player_id()
        player = player_manager.get_player(player_id)
        
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        character_class = player["character_class"]
        from game.config import SKILLS
        
        skills = []
        for skill in SKILLS.get(character_class, []):
            skill_name = skill["name"]
            is_ready = player_manager.is_skill_ready(player_id, skill_name)
            remaining_cooldown = player_manager.get_skill_remaining_cooldown(player_id, skill_name)
            
            # Get skill with upgrades
            try:
                upgraded_skill = player_manager.get_skill_with_upgrades(player_id, skill_name)
                skills.append({
                    "name": skill_name,
                    "description": skill["description"],
                    "type": skill["type"],
                    "cooldown": skill["cooldown"],
                    "is_ready": is_ready,
                    "remaining_cooldown": remaining_cooldown,
                    "current_level": upgraded_skill.get("current_level", 0),
                    "max_level": upgraded_skill.get("max_level", 5),
                    "upgraded_stats": {
                        k: v for k, v in upgraded_skill.items() 
                        if k in ["damage", "damage_multiplier", "heal_amount", "damage_reduction", "damage_boost", "poison_damage", "duration"]
                    }
                })
            except ValueError:
                # Fallback to base skill if upgrade fails
                skills.append({
                    "name": skill_name,
                    "description": skill["description"],
                    "type": skill["type"],
                    "cooldown": skill["cooldown"],
                    "is_ready": is_ready,
                    "remaining_cooldown": remaining_cooldown,
                    "current_level": 0,
                    "max_level": 5
                })
        
        return jsonify({
            "skills": skills,
            "skill_points": player["skill_points"],
            "pending_level_up": player["pending_level_up"]
        })
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/upgrade-skill", methods=["POST"])
@limiter.limit("10 per minute")
@validate_json_data(["skill_name"])
def upgrade_skill():
    try:
        data = request.get_json()
        player_id = get_or_create_player_id()
        skill_name = data["skill_name"]
        
        result = player_manager.upgrade_skill(player_id, skill_name)
        
        if not result["success"]:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/level-up-reward", methods=["POST"])
@limiter.limit("10 per minute")
@validate_json_data(["reward_type"])
def level_up_reward():
    try:
        data = request.get_json()
        player_id = get_or_create_player_id()
        reward_type = data["reward_type"]
        
        result = player_manager.apply_level_up_reward(player_id, reward_type)
        
        if not result["success"]:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/ar-spawn-info", methods=["GET"])
@limiter.limit("30 per minute")
def ar_spawn_info():
    """Get information about AR spawn locations near player"""
    try:
        player_id = get_or_create_player_id()
        player = player_manager.get_player(player_id)
        
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        last_location = player.get("last_location")
        if not last_location:
            return jsonify({"error": "No location data available"}), 400
        
        spawn_info = ar_spawning_system.get_spawn_info(last_location[0], last_location[1])
        return jsonify(spawn_info)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/set-ar-api-keys", methods=["POST"])
@limiter.limit("5 per minute")
@validate_json_data([])
def set_ar_api_keys():
    """Set API keys for AR spawning services (development only)"""
    try:
        data = request.get_json() or {}
        google_api_key = data.get("google_api_key")
        foursquare_api_key = data.get("foursquare_api_key")
        
        ar_spawning_system.set_api_keys(google_api_key, foursquare_api_key)
        
        return jsonify({
            "success": True,
            "message": "API keys updated successfully",
            "google_set": google_api_key is not None,
            "foursquare_set": foursquare_api_key is not None
        })
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/test-ar-spawn", methods=["POST"])
@limiter.limit("10 per minute")
def test_ar_spawn():
    """Test AR spawning at a specific location"""
    try:
        data = request.get_json()
        lat = float(data.get("lat", 0))
        lon = float(data.get("lon", 0))
        player_level = int(data.get("player_level", 1))
        
        enemy = ar_spawning_system.find_best_spawn_location(lat, lon, player_level)
        
        if enemy:
            return jsonify({
                "success": True,
                "enemy": enemy,
                "message": f"Enemy spawned at {enemy.get('location', {}).get('poi_name', 'Unknown location')}"
            })
        else:
            return jsonify({
                "success": False,
                "message": "No suitable spawn location found"
            })
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/test-assets")
def test_assets():
    import os
    assets_path = os.path.join(app.static_folder, 'assets', 'enemies')
    files = []
    if os.path.exists(assets_path):
        files = os.listdir(assets_path)
    return jsonify({"assets_path": assets_path, "files": files})

@app.route("/leaderboard")
@limiter.limit("20 per minute")
def leaderboard():
    try:
        # Get all players and sort by total kills
        all_players = list(player_manager.players.values())
        
        # Calculate total kills for each player
        leaderboard_data = []
        for player in all_players:
            total_kills = sum(player["kills"].values())
            leaderboard_data.append({
                "player_id": player["id"],
                "character_class": player["character_class"],
                "level": player["level"],
                "total_kills": total_kills,
                "kills_by_type": player["kills"],
                "total_xp": player["xp"]
            })
        
        # Sort by total kills, then by level
        leaderboard_data.sort(key=lambda p: (p["total_kills"], p["level"]), reverse=True)
        
        # Return top 10 players
        return jsonify({
            "leaderboard": leaderboard_data[:10],
            "total_players": len(all_players)
        })
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/player-status", methods=["GET"])
@limiter.limit("60 per minute")
def player_status():
    try:
        player_id = get_or_create_player_id()
        player = player_manager.get_player(player_id)
        
        if not player:
            return jsonify({"error": "Player not found"}), 400
        
        combat = combat_system.get_combat(player_id)
        active_buffs = player_manager.get_active_buffs(player_id)
        
        # Return player status without sensitive data
        status = {
            "player_id": player_id,
            "character_class": player["character_class"],
            "level": player["level"],
            "xp": player["xp"],
            "current_hp": player["current_hp"],
            "max_hp": player["max_hp"],
            "kills": player["kills"],
            "in_combat": combat is not None,
            "skill_points": player["skill_points"],
            "pending_level_up": player["pending_level_up"],
            "active_buffs": active_buffs,
            "skill_levels": player["skill_levels"]
        }
        
        if combat:
            status["enemy"] = combat["enemy"]
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
