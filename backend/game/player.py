import time
from typing import Dict, Any, Optional
from game.config import CHARACTERS, HEAL_COOLDOWN, HEAL_AMOUNT

class PlayerManager:
    def __init__(self):
        self.players: Dict[str, Dict[str, Any]] = {}
    
    def create_player(self, player_id: str, character_class: str) -> Dict[str, Any]:
        """Create a new player with the selected character class"""
        if character_class not in CHARACTERS:
            raise ValueError(f"Invalid character class: {character_class}")
        
        character_stats = CHARACTERS[character_class]
        
        player = {
            "id": player_id,
            "character": character_stats,
            "character_class": character_class,
            "current_hp": character_stats["hp"],
            "max_hp": character_stats["hp"],
            "xp": 0,
            "level": 1,
            "skill_points": 0,
            "kills": {"class1": 0, "class2": 0, "class3": 0},
            "last_location": None,
            "distance_since_last_spawn": 0,
            "last_spawn_time": None,
            "last_heal": 0,
            "skill_cooldowns": {},
            "skill_levels": {},  # skill_name -> level
            "active_buffs": {},  # buff_name -> {end_time, value}
            "pending_level_up": False,
            "created_at": time.time()
        }
        
        self.players[player_id] = player
        return player
    
    def get_player(self, player_id: str) -> Optional[Dict[str, Any]]:
        """Get player data by ID"""
        return self.players.get(player_id)
    
    def update_location(self, player_id: str, lat: float, lon: float) -> Dict[str, Any]:
        """Update player location and track distance"""
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        last_location = player["last_location"]
        player["last_location"] = (lat, lon)
        
        distance_traveled = 0
        if last_location:
            from .movement import calculate_distance
            distance_traveled = calculate_distance(
                last_location[0], last_location[1], lat, lon
            )
            player["distance_since_last_spawn"] += distance_traveled
        
        return {
            "player": player,
            "distance_traveled": distance_traveled
        }
    
    def heal_player(self, player_id: str) -> Dict[str, Any]:
        """Heal player without cooldown check"""
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        heal_amount = min(HEAL_AMOUNT, player["max_hp"] - player["current_hp"])
        if heal_amount <= 0:
            return {
                "success": False,
                "error": "Already at full health"
            }
        
        player["current_hp"] += heal_amount
        
        return {
            "success": True,
            "healed": heal_amount,
            "current_hp": player["current_hp"],
            "max_hp": player["max_hp"]
        }
    
    def add_xp(self, player_id: str, xp_amount: int) -> Dict[str, Any]:
        """Add XP and handle level ups"""
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        old_level = player["level"]
        player["xp"] += xp_amount
        new_level = 1 + player["xp"] // 100
        player["level"] = new_level
        
        # Check if player leveled up
        leveled_up = new_level > old_level
        if leveled_up:
            player["pending_level_up"] = True
            player["skill_points"] += 1  # Grant skill point on level up
        
        return {
            "xp_gained": xp_amount,
            "total_xp": player["xp"],
            "level": player["level"],
            "leveled_up": leveled_up,
            "pending_level_up": player["pending_level_up"],
            "skill_points": player["skill_points"]
        }
    
    def upgrade_skill(self, player_id: str, skill_name: str) -> Dict[str, Any]:
        """Upgrade a skill using skill points"""
        from .config import SKILLS, SKILL_UPGRADES
        
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        if player["skill_points"] <= 0:
            return {"success": False, "error": "No skill points available"}
        
        # Check if skill exists for this character
        character_skills = SKILLS.get(player["character_class"], [])
        skill_found = None
        for skill in character_skills:
            if skill["name"] == skill_name:
                skill_found = skill
                break
        
        if not skill_found:
            return {"success": False, "error": "Skill not found for this character"}
        
        # Get current skill level
        current_level = player["skill_levels"].get(skill_name, 0)
        
        # Find the main stat to upgrade
        upgrade_stat = None
        for stat in SKILL_UPGRADES:
            if stat in skill_found:
                upgrade_stat = stat
                break
        
        if not upgrade_stat:
            return {"success": False, "error": "Skill cannot be upgraded"}
        
        # Check max level
        max_level = SKILL_UPGRADES[upgrade_stat]["max_level"]
        if current_level >= max_level:
            return {"success": False, "error": "Skill already at max level"}
        
        # Upgrade the skill
        player["skill_levels"][skill_name] = current_level + 1
        player["skill_points"] -= 1
        
        return {
            "success": True,
            "skill_name": skill_name,
            "new_level": current_level + 1,
            "skill_points_remaining": player["skill_points"]
        }
    
    def apply_level_up_reward(self, player_id: str, reward_type: str) -> Dict[str, Any]:
        """Apply level up reward (heal or confirm level up)"""
        from .config import LEVEL_UP_REWARDS
        
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        if not player["pending_level_up"]:
            return {"success": False, "error": "No pending level up"}
        
        if reward_type not in LEVEL_UP_REWARDS:
            return {"success": False, "error": "Invalid reward type"}
        
        reward = LEVEL_UP_REWARDS[reward_type]
        result = {"success": True, "reward_type": reward_type}
        
        if reward_type == "full_heal":
            heal_amount = player["max_hp"]
            player["current_hp"] = player["max_hp"]
            result.update({
                "healed": heal_amount,
                "current_hp": player["current_hp"],
                "max_hp": player["max_hp"]
            })
        elif reward_type == "partial_heal":
            heal_amount = int(player["max_hp"] * reward["heal_percent"])
            player["current_hp"] = min(player["current_hp"] + heal_amount, player["max_hp"])
            result.update({
                "healed": heal_amount,
                "current_hp": player["current_hp"],
                "max_hp": player["max_hp"]
            })
        elif reward_type == "skill_upgrade":
            # Skill points already granted on level up
            result["skill_points"] = player["skill_points"]
        
        # Clear pending level up
        player["pending_level_up"] = False
        
        return result
    
    def get_skill_with_upgrades(self, player_id: str, skill_name: str) -> Dict[str, Any]:
        """Get skill data with applied upgrades"""
        from .config import SKILLS, SKILL_UPGRADES
        
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        # Find base skill
        character_skills = SKILLS.get(player["character_class"], [])
        base_skill = None
        for skill in character_skills:
            if skill["name"] == skill_name:
                base_skill = skill.copy()
                break
        
        if not base_skill:
            raise ValueError(f"Skill {skill_name} not found")
        
        # Apply upgrades
        skill_level = player["skill_levels"].get(skill_name, 0)
        
        for stat in SKILL_UPGRADES:
            if stat in base_skill:
                upgrade_amount = SKILL_UPGRADES[stat]["upgrade_amount"]
                base_skill[stat] += upgrade_amount * skill_level
        
        # Add level info
        base_skill["current_level"] = skill_level
        max_level = SKILL_UPGRADES.get(stat, {}).get("max_level", 5) if stat else 5
        base_skill["max_level"] = max_level
        
        return base_skill
    
    def add_active_buff(self, player_id: str, buff_name: str, value: float, duration: int):
        """Add an active buff to player"""
        player = self.get_player(player_id)
        if player:
            player["active_buffs"][buff_name] = {
                "value": value,
                "end_time": time.time() + duration
            }
    
    def get_active_buffs(self, player_id: str) -> Dict[str, Any]:
        """Get and clean expired buffs"""
        player = self.get_player(player_id)
        if not player:
            return {}
        
        current_time = time.time()
        active_buffs = {}
        
        for buff_name, buff_data in player["active_buffs"].items():
            if current_time < buff_data["end_time"]:
                active_buffs[buff_name] = buff_data
            else:
                # Remove expired buff
                del player["active_buffs"][buff_name]
        
        return active_buffs
    
    def reset_spawn_tracking(self, player_id: str):
        """Reset spawn tracking after enemy spawn"""
        player = self.get_player(player_id)
        if player:
            player["distance_since_last_spawn"] = 0
            player["last_spawn_time"] = time.time()
    
    def update_skill_cooldown(self, player_id: str, skill_name: str, cooldown: int):
        """Update skill cooldown"""
        player = self.get_player(player_id)
        if player:
            player["skill_cooldowns"][skill_name] = time.time() + cooldown
    
    def is_skill_ready(self, player_id: str, skill_name: str) -> bool:
        """Check if skill is ready to use - always returns True (no cooldowns)"""
        # Cooldowns removed - skills are always ready
        return True
    
    def get_skill_remaining_cooldown(self, player_id: str, skill_name: str) -> float:
        """Get remaining cooldown for a skill - always returns 0 (no cooldowns)"""
        # Cooldowns removed - always return 0
        return 0

# Global player manager instance
player_manager = PlayerManager()
