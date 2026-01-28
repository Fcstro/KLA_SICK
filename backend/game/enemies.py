from typing import Dict, Any, List
from .config import ENEMY_STATS

class EnemyManager:
    def __init__(self):
        self.enemy_templates = ENEMY_STATS
    
    def get_enemy_stats(self, enemy_type: str) -> Dict[str, Any]:
        """Get enemy stats by type"""
        if enemy_type not in self.enemy_templates:
            raise ValueError(f"Invalid enemy type: {enemy_type}")
        return self.enemy_templates[enemy_type].copy()
    
    def get_all_enemy_types(self) -> List[str]:
        """Get list of all available enemy types"""
        return list(self.enemy_templates.keys())
    
    def create_enemy(self, enemy_type: str) -> Dict[str, Any]:
        """Create a new enemy instance"""
        import time
        
        stats = self.get_enemy_stats(enemy_type)
        return {
            "type": enemy_type,
            "hp": stats["hp"],
            "max_hp": stats["hp"],
            "atk": stats["atk"],
            "name": stats["name"],
            "spawn_time": time.time()
        }
    
    def get_spawn_weights(self) -> Dict[str, int]:
        """Get spawn weights for enemy types"""
        return {
            "class1": 70,  # Common enemies
            "class2": 25,  # Uncommon enemies
            "class3": 5    # Rare enemies
        }

# Global enemy manager instance
enemy_manager = EnemyManager()
