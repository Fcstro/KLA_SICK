
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import random, math, socket
import ssl

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
CORS(app)

ENEMY_STATS = {
    "class1": {"hp": 30, "atk": 5, "name": "Goblin"},
    "class2": {"hp": 50, "atk": 10, "name": "Orc"},
    "class3": {"hp": 100, "atk": 15, "name": "Dragon"}
}

current_enemy = None

player = {
    "character": None,
    "current_hp": None,
    "max_hp": None,
    "xp": 0,
    "level": 1,
    "kills": {"class1":0,"class2":0,"class3":0},
    "last_location": None
}

CHARACTERS = {
    "warrior": {"hp":120,"atk":15},
    "mage": {"hp":80,"atk":25},
    "archer": {"hp":100,"atk":18},
    "healer": {"hp":110,"atk":12},
    "rogue": {"hp":90,"atk":20},
}

def distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2-lat1)
    dl = math.radians(lon2-lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/select-character", methods=["POST"])
def select_character():
    name = request.json["character"]
    player["character"] = CHARACTERS[name]
    player["max_hp"] = CHARACTERS[name]["hp"]
    player["current_hp"] = CHARACTERS[name]["hp"]
    return jsonify({"status":"ok","character":name})

@app.route("/update-location", methods=["POST"])
def update_location():
    global current_enemy
    
    lat, lon = request.json["lat"], request.json["lon"]
    last = player["last_location"]
    player["last_location"] = (lat, lon)

    if last:
        dist = distance(last[0], last[1], lat, lon)
        if dist >= 1 and random.random() < 0.8:
            # dist >= travel distance in Meters 
            # random.random() < 1: spawn rate
            enemy = random.choices(
                ["class1","class2","class3"],
                weights=[70,25,5]
            )[0]
            # Initialize enemy with full HP
            current_enemy = {
                "type": enemy,
                "hp": ENEMY_STATS[enemy]["hp"],
                "max_hp": ENEMY_STATS[enemy]["hp"],
                "atk": ENEMY_STATS[enemy]["atk"],
                "name": ENEMY_STATS[enemy]["name"]
            }
            return jsonify({
                "spawn":True,
                "enemy":enemy,
                "enemy_stats": current_enemy
            })

    return jsonify({"spawn":False})

@app.route("/player-attack", methods=["POST"])
def player_attack():
    global current_enemy
    
    if not current_enemy:
        return jsonify({"error": "No enemy to attack"})
    
    player_atk = player["character"]["atk"]
    enemy_hp = current_enemy["hp"]
    
    # Player attacks enemy
    current_enemy["hp"] -= player_atk
    
    if current_enemy["hp"] <= 0:
        # Enemy defeated
        enemy_type = current_enemy["type"]
        player["kills"][enemy_type] += 1
        player["xp"] += {"class1":10,"class2":25,"class3":50}[enemy_type]
        player["level"] = 1 + player["xp"]//100
        
        result = {
            "player_attack": player_atk,
            "enemy_hp": 0,
            "enemy_defeated": True,
            "player": player,
            "enemy_type": enemy_type
        }
        current_enemy = None
    else:
        # Enemy survives, counter-attacks
        enemy_atk = current_enemy["atk"]
        player["current_hp"] -= enemy_atk
        
        result = {
            "player_attack": player_atk,
            "enemy_hp": current_enemy["hp"],
            "enemy_attack": enemy_atk,
            "player_hp": player["current_hp"],
            "enemy_defeated": False,
            "enemy_stats": current_enemy
        }
    
    return jsonify(result)

@app.route("/heal", methods=["POST"])
def heal():
    if not player["character"]:
        return jsonify({"error": "No character selected"})
    
    # Heal 25 HP (or to max)
    heal_amount = min(25, player["max_hp"] - player["current_hp"])
    player["current_hp"] += heal_amount
    
    return jsonify({
        "healed": heal_amount,
        "current_hp": player["current_hp"],
        "max_hp": player["max_hp"]
    })

@app.route("/attack", methods=["POST"])
def attack():
    enemy = request.json["enemy"]
    player["kills"][enemy]+=1
    player["xp"] += {"class1":10,"class2":25,"class3":50}[enemy]
    player["level"] = 1 + player["xp"]//100
    return jsonify(player)

@app.route("/spawn-enemy", methods=["POST"])
def spawn_enemy():
    global current_enemy
    
    enemy_type = request.json.get("enemy_type", "class1")
    
    current_enemy = {
        "type": enemy_type,
        "hp": ENEMY_STATS[enemy_type]["hp"],
        "max_hp": ENEMY_STATS[enemy_type]["hp"],
        "atk": ENEMY_STATS[enemy_type]["atk"],
        "name": ENEMY_STATS[enemy_type]["name"]
    }
    
    return jsonify({
        "spawn": True,
        "enemy": enemy_type,
        "enemy_stats": current_enemy
    })

@app.route("/test-assets")
def test_assets():
    import os
    assets_path = os.path.join(app.static_folder, 'assets', 'enemies')
    files = []
    if os.path.exists(assets_path):
        files = os.listdir(assets_path)
    return jsonify({"assets_path": assets_path, "files": files})

@app.route("/leaderboard")
def leaderboard():
    return jsonify(player)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
