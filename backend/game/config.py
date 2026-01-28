# Game configuration constants
ENEMY_STATS = {
    "class1": {"hp": 30, "atk": 5, "name": "Goblin", "xp_reward": 10},
    "class2": {"hp": 50, "atk": 10, "name": "Orc", "xp_reward": 25},
    "class3": {"hp": 100, "atk": 15, "name": "Dragon", "xp_reward": 50}
}

CHARACTERS = {
    "Volta": {"hp": 120, "atk": 15, "class": "warrior"},
    "Pedro Penduko": {"hp": 80, "atk": 25, "class": "mage"},
    "Kidlat": {"hp": 100, "atk": 18, "class": "archer"},
    "Victor Magtanggol": {"hp": 110, "atk": 12, "class": "healer"},
    "WanPakMan": {"hp": 90, "atk": 20, "class": "rogue"},
}

# Skills configuration - 3 skills per character with one heal/buff
SKILLS = {
    "Volta": [
        {"name": "Electrokinesis", "damage_multiplier": 2.0, "cooldown": 10, "description": "Double damage attack", "type": "damage"},
        {"name": "Tanging Ina SMASH", "damage": 15, "cooldown": 8, "description": "Stun enemy for 1 turn", "type": "damage"},
        {"name": "Battle Heal", "heal_amount": 40, "cooldown": 15, "description": "Restore 40 HP", "type": "heal"}
    ],
    "Pedro Penduko": [
        {"name": "Fireball", "damage_multiplier": 2.5, "cooldown": 12, "description": "Powerful magic attack", "type": "damage"},
        {"name": "Arcane Missiles", "damage": 35, "cooldown": 10, "description": "Multiple magic projectiles", "type": "damage"},
        {"name": "Mutya ", "damage_reduction": 0.5, "duration": 3, "cooldown": 20, "description": "Reduce damage by 50% for 3 turns", "type": "buff"}
    ],
    "Kidlat": [
        {"name": "Thunder Bolt", "damage_multiplier": 1.8, "cooldown": 8, "description": "High accuracy attack", "type": "damage"},
        {"name": "Anti-Bastos", "damage": 30, "cooldown": 15, "description": "Area damage attack", "type": "damage"},
        {"name": "Perfect Storm", "heal_amount": 35, "cooldown": 12, "description": "Restore 35 HP", "type": "heal"}
    ],
    "Victor Magtanggol": [
        {"name": "aldenkantotmaine", "damage": 25, "cooldown": 10, "description": "Holy damage attack", "type": "damage"},
        {"name": "ALDUB 4Ever", "heal_amount": 60, "cooldown": 15, "description": "Restore 60 HP", "type": "heal"},
        {"name": "Pabebe Wave", "damage_boost": 1.5, "duration": 4, "cooldown": 25, "description": "Increase damage by 50% for 4 turns", "type": "buff"}
    ],
    "WanPakMan": [
        {"name": "Asim Kilig", "damage_multiplier": 3.0, "cooldown": 15, "description": "Critical strike from behind", "type": "damage"},
        {"name": "Figthing Senator", "damage": 20, "poison_damage": 5, "duration": 3, "cooldown": 12, "description": "Attack with poison damage over 3 turns", "type": "damage"},
        {"name": "Go Manny", "heal_amount": 30, "cooldown": 10, "description": "Restore 30 HP", "type": "heal"}
    ]
}

# Skill upgrade configurations
SKILL_UPGRADES = {
    "damage_multiplier": {"upgrade_amount": 0.3, "max_level": 5},
    "damage": {"upgrade_amount": 8, "max_level": 5},
    "heal_amount": {"upgrade_amount": 15, "max_level": 5},
    "damage_reduction": {"upgrade_amount": 0.1, "max_level": 3},
    "damage_boost": {"upgrade_amount": 0.2, "max_level": 3},
    "poison_damage": {"upgrade_amount": 3, "max_level": 4},
    "duration": {"upgrade_amount": 1, "max_level": 3}
}

# Level-up rewards
LEVEL_UP_REWARDS = {
    "skill_upgrade": {"skill_points": 1},
    "full_heal": {"heal_percent": 1.0},
    "partial_heal": {"heal_percent": 0.5}
}

# Game balance settings
SPAWN_CONFIG = {
    "spawn_distance": 1,  # meters - minimum distance to trigger spawn check
    "spawn_probability": 1,  # 100% chance when distance threshold met
    "enemy_weights": {
        "class1": 0.5,  # 50% chance for Goblin
        "class2": 0.3,  # 30% chance for Orc  
        "class3": 0.2   # 20% chance for Dragon
    },
    "max_enemies_per_area": 3,
    "spawn_cooldown": 10,  # seconds between spawns
    "area_radius":1  # meters - radius for area limit checking
}

SPAWN_DISTANCE_THRESHOLD = 1  # meters
MIN_TRAVEL_DISTANCE = 5  # meters for guaranteed spawn chance (increased even more)
SPAWN_RATE = 1  # 100% chance
HEAL_COOLDOWN = 10  # seconds
HEAL_AMOUNT = 25
CRIT_CHANCE = 0.1
CRIT_MULTIPLIER = 2.0
DODGE_CHANCE = 0.05
