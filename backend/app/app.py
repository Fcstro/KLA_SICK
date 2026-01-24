
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

player = {
    "character": None,
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
    return jsonify({"status":"ok","character":name})

@app.route("/update-location", methods=["POST"])
def update_location():
    lat, lon = request.json["lat"], request.json["lon"]
    last = player["last_location"]
    player["last_location"] = (lat, lon)

    if last:
        dist = distance(last[0], last[1], lat, lon)
        if dist >= 8 and random.random() < 0.8:
            enemy = random.choices(
                ["class1","class2","class3"],
                weights=[70,25,5]
            )[0]
            return jsonify({"spawn":True,"enemy":enemy})

    return jsonify({"spawn":False})

@app.route("/attack", methods=["POST"])
def attack():
    enemy = request.json["enemy"]
    player["kills"][enemy]+=1
    player["xp"] += {"class1":10,"class2":25,"class3":50}[enemy]
    player["level"] = 1 + player["xp"]//100
    return jsonify(player)

@app.route("/leaderboard")
def leaderboard():
    return jsonify(player)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
