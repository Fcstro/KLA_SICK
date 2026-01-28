# Game configuration constants
ENEMY_STATS = {
    "class1": {"hp": 30, "atk": 5, "name": "Goblin", "xp_reward": 10},
    "class2": {"hp": 50, "atk": 10, "name": "Orc", "xp_reward": 25},
    "class3": {"hp": 100, "atk": 15, "name": "Dragon", "xp_reward": 50}
}

CHARACTERS = {
    "warrior": {"hp": 120, "atk": 15, "class": "warrior"},
    "mage": {"hp": 80, "atk": 25, "class": "mage"},
    "archer": {"hp": 100, "atk": 18, "class": "archer"},
    "healer": {"hp": 110, "atk": 12, "class": "healer"},
    "rogue": {"hp": 90, "atk": 20, "class": "rogue"},
}

# Skills configuration - 3 skills per character with one heal/buff
SKILLS = {
    "warrior": [
        {"name": "Power Strike", "damage_multiplier": 2.0, "cooldown": 10, "description": "Double damage attack", "type": "damage"},
        {"name": "Shield Bash", "damage": 15, "cooldown": 8, "description": "Stun enemy for 1 turn", "type": "damage"},
        {"name": "Battle Heal", "heal_amount": 40, "cooldown": 15, "description": "Restore 40 HP", "type": "heal"}
    ],
    "mage": [
        {"name": "Fireball", "damage_multiplier": 2.5, "cooldown": 12, "description": "Powerful magic attack", "type": "damage"},
        {"name": "Arcane Missiles", "damage": 35, "cooldown": 10, "description": "Multiple magic projectiles", "type": "damage"},
        {"name": "Mana Shield", "damage_reduction": 0.5, "duration": 3, "cooldown": 20, "description": "Reduce damage by 50% for 3 turns", "type": "buff"}
    ],
    "archer": [
        {"name": "Precise Shot", "damage_multiplier": 1.8, "cooldown": 8, "description": "High accuracy attack", "type": "damage"},
        {"name": "Rain of Arrows", "damage": 30, "cooldown": 15, "description": "Area damage attack", "type": "damage"},
        {"name": "Nature's Heal", "heal_amount": 35, "cooldown": 12, "description": "Restore 35 HP", "type": "heal"}
    ],
    "healer": [
        {"name": "Holy Light", "damage": 25, "cooldown": 10, "description": "Holy damage attack", "type": "damage"},
        {"name": "Greater Heal", "heal_amount": 60, "cooldown": 15, "description": "Restore 60 HP", "type": "heal"},
        {"name": "Divine Blessing", "damage_boost": 1.5, "duration": 4, "cooldown": 25, "description": "Increase damage by 50% for 4 turns", "type": "buff"}
    ],
    "rogue": [
        {"name": "Backstab", "damage_multiplier": 3.0, "cooldown": 15, "description": "Critical strike from behind", "type": "damage"},
        {"name": "Poison Blade", "damage": 20, "poison_damage": 5, "duration": 3, "cooldown": 12, "description": "Attack with poison damage over 3 turns", "type": "damage"},
        {"name": "Shadow Mend", "heal_amount": 30, "cooldown": 10, "description": "Restore 30 HP", "type": "heal"}
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
SPAWN_DISTANCE_THRESHOLD = 1  # meters
MIN_TRAVEL_DISTANCE = 5  # meters for guaranteed spawn chance (increased even more)
SPAWN_RATE = 0.7  # 70% chance
HEAL_COOLDOWN = 10  # seconds
HEAL_AMOUNT = 25
CRIT_CHANCE = 0.1
CRIT_MULTIPLIER = 2.0
DODGE_CHANCE = 0.05
