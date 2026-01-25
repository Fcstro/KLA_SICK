# Enemy Assets

Place your enemy assets here:

## 3D Models (Primary)
- `class1.glb` - Common enemy (70% spawn rate) - Goblin creature
- `class2.glb` - Elite enemy (25% spawn rate) - Orc creature  
- `class3.glb` - Boss enemy (5% spawn rate) - Dragon creature

**Format:** GLB/GLTF for Three.js compatibility
**Recommended:** Include animations for idle, attack, hurt, and defeat states
**Scale:** Adjust in code (currently set to 2x scale)

## 2D Fallback Images
- `class1.png` - Common enemy fallback
- `class2.png` - Elite enemy fallback
- `class3.png` - Boss enemy fallback

**Format:** PNG with transparency
**Recommended size:** 256x256px

## 3D Model Sources
- **Sketchfab:** Free and premium 3D models
- **Mixamo:** Animated character models
- **Blender:** Create custom models
- **Unity Asset Store:** Export to GLB format

## Animation Setup
Models should include:
- Idle animation (looping)
- Attack animation (triggered on combat)
- Hurt animation (when taking damage)
- Defeat animation (when HP reaches 0)

If no 3D models are found, the system will automatically fall back to colored 3D cubes with rotation animation.
