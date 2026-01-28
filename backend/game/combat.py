import random
import time
from typing import Dict, Any, Tuple, Optional
from .config import CRIT_CHANCE, CRIT_MULTIPLIER, DODGE_CHANCE, SKILLS

class CombatSystem:
    def __init__(self):
        self.active_combats: Dict[str, Dict[str, Any]] = {}  # player_id -> combat_data
    
    def start_combat(self, player_id: str, enemy: Dict[str, Any]):
        """Start combat for a player"""
        self.active_combats[player_id] = {
            "enemy": enemy,
            "start_time": time.time(),
            "turn_count": 0
        }
    
    def end_combat(self, player_id: str):
        """End combat for a player"""
        if player_id in self.active_combats:
            del self.active_combats[player_id]
    
    def get_combat(self, player_id: str) -> Optional[Dict[str, Any]]:
        """Get current combat data for a player"""
        return self.active_combats.get(player_id)
    
    def calculate_damage(self, base_damage: int, is_critical: bool = False) -> int:
        """Calculate damage with randomness and critical hits"""
        # Add randomness to base damage (±3)
        damage = random.randint(base_damage - 3, base_damage + 3)
        damage = max(1, damage)  # Minimum 1 damage
        
        # Apply critical hit
        if is_critical:
            damage = int(damage * CRIT_MULTIPLIER)
        
        return damage
    
    def check_critical_hit(self) -> bool:
        """Check if attack is a critical hit"""
        return random.random() < CRIT_CHANCE
    
    def check_dodge(self) -> bool:
        """Check if attack is dodged"""
        return random.random() < DODGE_CHANCE
    
    def player_attack(self, player: Dict[str, Any], enemy: Dict[str, Any]) -> Dict[str, Any]:
        """Handle player attack against enemy"""
        if self.check_dodge():
            return {
                "hit": False,
                "damage": 0,
                "is_critical": False,
                "message": "Enemy dodged the attack!"
            }
        
        is_critical = self.check_critical_hit()
        base_damage = player["character"]["atk"]
        damage = self.calculate_damage(base_damage, is_critical)
        
        enemy["hp"] -= damage
        enemy["hp"] = max(0, enemy["hp"])
        
        result = {
            "hit": True,
            "damage": damage,
            "is_critical": is_critical,
            "enemy_hp": enemy["hp"],
            "enemy_defeated": enemy["hp"] <= 0
        }
        
        if is_critical:
            result["message"] = "Critical hit!"
        
        return result
    
    def enemy_attack(self, enemy: Dict[str, Any]) -> Dict[str, Any]:
        """Handle enemy attack against player"""
        if self.check_dodge():
            return {
                "hit": False,
                "damage": 0,
                "message": "Player dodged the attack!"
            }
        
        damage = self.calculate_damage(enemy["atk"])
        
        result = {
            "hit": True,
            "damage": damage,
            "message": f"Enemy attacks for {damage} damage!"
        }
        
        return result
    
    def use_skill(self, player: Dict[str, Any], skill_name: str, enemy: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Handle skill usage with upgrades and buffs"""
        from .player import player_manager
        
        character_class = player["character_class"]
        
        # Get skill with upgrades applied
        try:
            skill = player_manager.get_skill_with_upgrades(player["id"], skill_name)
        except ValueError:
            return {
                "success": False,
                "error": "Skill not found for this character class"
            }
        
        # Check cooldown
        if not player_manager.is_skill_ready(player["id"], skill_name):
            remaining = player_manager.get_skill_remaining_cooldown(player["id"], skill_name)
            return {
                "success": False,
                "error": f"Skill on cooldown: {remaining:.1f}s remaining"
            }
        
        # Set cooldown
        player_manager.update_skill_cooldown(player["id"], skill_name, skill["cooldown"])
        
        # Initialize result
        result = {
            "success": True,
            "skill_name": skill_name,
            "description": skill["description"],
            "skill_level": skill.get("current_level", 0),
            "combat_messages": []
        }
        
        # Add skill usage message
        result["combat_messages"].append(f"✨ {skill_name} used!")
        
        # Handle different skill types
        if "damage_multiplier" in skill:
            # Damage multiplier skill
            base_damage = player["character"]["atk"]
            # Apply damage buffs
            damage_multiplier = skill["damage_multiplier"]
            active_buffs = player_manager.get_active_buffs(player["id"])
            if "damage_boost" in active_buffs:
                damage_multiplier *= active_buffs["damage_boost"]["value"]
            
            damage = self.calculate_damage(int(base_damage * damage_multiplier))
            
            if enemy:
                enemy["hp"] -= damage
                enemy["hp"] = max(0, enemy["hp"])
                result.update({
                    "damage": damage,
                    "enemy_hp": enemy["hp"],
                    "enemy_defeated": enemy["hp"] <= 0,
                    "enemy_health_percent": round((enemy["hp"] / enemy["max_hp"]) * 100, 1)
                })
                result["combat_messages"].append(f"⚔️ {skill_name} deals {damage} damage!")
        
        elif "damage" in skill:
            # Fixed damage skill (with poison effect possible)
            damage = skill["damage"]
            
            # Apply damage buffs
            active_buffs = player_manager.get_active_buffs(player["id"])
            if "damage_boost" in active_buffs:
                damage = int(damage * active_buffs["damage_boost"]["value"])
            
            if enemy:
                enemy["hp"] -= damage
                enemy["hp"] = max(0, enemy["hp"])
                
                result.update({
                    "damage": damage,
                    "enemy_hp": enemy["hp"],
                    "enemy_defeated": enemy["hp"] <= 0,
                    "enemy_health_percent": round((enemy["hp"] / enemy["max_hp"]) * 100, 1)
                })
                result["combat_messages"].append(f"⚔️ {skill_name} deals {damage} damage!")
                
                # Handle poison effect
                if "poison_damage" in skill and "duration" in skill:
                    poison_total = skill["poison_damage"] * skill["duration"]
                    result["poison_damage"] = poison_total
                    result["poison_duration"] = skill["duration"]
                    result["combat_messages"].append(f"☠️ Poison applied! {poison_total} damage over {skill['duration']} turns")
        
        elif "heal_amount" in skill:
            # Healing skill
            heal_amount = min(skill["heal_amount"], player["max_hp"] - player["current_hp"])
            player["current_hp"] += heal_amount
            result.update({
                "healed": heal_amount,
                "current_hp": player["current_hp"]
            })
            result["combat_messages"].append(f"💚 Healed for {heal_amount} HP!")
        
        elif "damage_reduction" in skill:
            # Damage reduction buff
            player_manager.add_active_buff(
                player["id"], 
                "damage_reduction", 
                skill["damage_reduction"], 
                skill.get("duration", 3)
            )
            result.update({
                "buff_applied": "damage_reduction",
                "damage_reduction": skill["damage_reduction"],
                "duration": skill.get("duration", 3)
            })
            result["combat_messages"].append(f"🛡️ Damage reduction activated! {int(skill['damage_reduction']*100)}% less damage for {skill.get('duration', 3)} turns")
        
        elif "damage_boost" in skill:
            # Damage boost buff
            player_manager.add_active_buff(
                player["id"], 
                "damage_boost", 
                skill["damage_boost"], 
                skill.get("duration", 4)
            )
            result.update({
                "buff_applied": "damage_boost",
                "damage_boost": skill["damage_boost"],
                "duration": skill.get("duration", 4)
            })
            result["combat_messages"].append(f"⚡ Damage boost activated! +{int((skill['damage_boost']-1)*100)}% damage for {skill.get('duration', 4)} turns")
        
        elif "escape" in skill:
            # Escape skill
            result["escaped"] = True
            result["combat_messages"].append(f"🏃 Successfully escaped from combat!")
        
        return result
    
    def apply_buffs_to_damage(self, player: Dict[str, Any], base_damage: int) -> int:
        """Apply active buffs to damage calculation"""
        from .player import player_manager
        
        active_buffs = player_manager.get_active_buffs(player["id"])
        modified_damage = base_damage
        
        if "damage_boost" in active_buffs:
            modified_damage = int(modified_damage * active_buffs["damage_boost"]["value"])
        
        return modified_damage
    
    def apply_buffs_to_defense(self, player: Dict[str, Any], incoming_damage: int) -> int:
        """Apply active buffs to damage reduction"""
        from .player import player_manager
        
        active_buffs = player_manager.get_active_buffs(player["id"])
        modified_damage = incoming_damage
        
        if "damage_reduction" in active_buffs:
            reduction = active_buffs["damage_reduction"]["value"]
            modified_damage = int(modified_damage * (1 - reduction))
        
        return max(0, modified_damage)
    
    def process_combat_turn(self, player_id: str, player: Dict[str, Any]) -> Dict[str, Any]:
        """Process a complete combat turn with buffs"""
        combat = self.get_combat(player_id)
        if not combat:
            return {"error": "No active combat"}
        
        enemy = combat["enemy"]
        combat["turn_count"] += 1
        
        # Calculate enemy health percentage
        enemy_health_percent = (enemy["hp"] / enemy["max_hp"]) * 100
        
        # Player attacks first (with buffs applied)
        attack_result = self.player_attack(player, enemy)
        
        result = {
            "player_attack": attack_result,
            "enemy_stats": {
                **enemy,
                "health_percent": round(enemy_health_percent, 1)
            },
            "active_buffs": player_manager.get_active_buffs(player_id),
            "combat_messages": []
        }
        
        # Add combat messages
        if attack_result.get("hit"):
            if attack_result.get("is_critical"):
                result["combat_messages"].append(f"💥 CRITICAL HIT! {attack_result['damage']} damage!")
            else:
                result["combat_messages"].append(f"⚔️ Hit for {attack_result['damage']} damage!")
        else:
            result["combat_messages"].append(f"❌ Missed!")
        
        # Check if enemy is defeated
        if attack_result.get("enemy_defeated", False):
            from game.config import ENEMY_STATS
            enemy_type = enemy["type"]
            player["kills"][enemy_type] += 1
            
            result["combat_messages"].append(f"🎉 {enemy['name']} defeated!")
            
            # Add XP reward
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
            
            self.end_combat(player_id)
        else:
            # Enemy counter-attacks (with player defense buffs)
            enemy_attack_result = self.enemy_attack(enemy)
            if enemy_attack_result["hit"]:
                # Apply damage reduction buffs
                final_damage = self.apply_buffs_to_defense(player, enemy_attack_result["damage"])
                player["current_hp"] -= final_damage
                player["current_hp"] = max(0, player["current_hp"])
                
                enemy_attack_result["damage"] = final_damage
                result["combat_messages"].append(f"👹 Enemy hits for {final_damage} damage!")
            else:
                result["combat_messages"].append(f"🛡️ Dodged enemy attack!")
            
            result.update({
                "enemy_attack": enemy_attack_result,
                "player_hp": player["current_hp"],
                "player_defeated": player["current_hp"] <= 0
            })
            
            if player["current_hp"] <= 0:
                result["combat_messages"].append(f"💀 You have been defeated!")
                self.end_combat(player_id)
        
        return result

# Global combat system instance
combat_system = CombatSystem()
