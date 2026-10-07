# Skill Asset Import

## Summary

Raw skill art was imported from `public/assets/_skill-import/`, classified, normalized into `public/assets/skills/`, and connected to the existing `Player`, `SkillManager`, `SkillCombatSystem`, `PlayerAnimationController`, `MainScene`, and bottom HUD quick slots.

The existing hero sprites remain the only player gameplay sprites. Character-inclusive source images are used only as HUD icons and never replace the live player sprite.

## Source audit

| Source | Size | Alpha bounds (x,y,w,h) | Classification | Production mapping |
| --- | ---: | --- | --- | --- |
| `...-1.png` | 1536x1024 | 32,95,1486,887 | 3x2 / 6-frame normal slash VFX sheet | `skills/normal-slash/slash/frame-01..06.png` |
| `...-2.png` | 1774x887 | 46,99,1694,684 | 4x2 / 8-frame Sword Qi projectile/dissolve sheet | `skills/sword-qi/projectile/frame-01..08.png` |
| `...-3.png` | 1774x887 | 23,22,1726,836 | 4x2 / 8-frame Ten Thousand Swords AoE sheet | `skills/ten-thousand-swords/swords/frame-01..08.png` |
| `...-4.png` | 1774x887 | 49,28,1701,825 | 4x2 / 8-frame healing aura sheet | `skills/heal/aura/frame-01..08.png` |
| `...-5.png` | 1254x1254 | 34,156,1210,1009 | normal slash icon art | `skills/normal-slash/icon/icon.png` |
| `...-6.png` | 1254x1254 | 65,127,1142,1046 | Sword Qi icon art | `skills/sword-qi/icon/icon.png` |
| `...-7.png` | 1254x1254 | 46,32,1164,1194 | Ten Thousand Swords icon art | `skills/ten-thousand-swords/icon/icon.png` |
| `...-8.png` | 1254x1254 | 56,36,1160,1201 | healing icon art | `skills/heal/icon/icon.png` |
| `...-9.png` | 1774x887 | 18,29,1738,823 | 4x2 / 8-frame radial cooldown overlay sheet | `skills/shared/cooldown/frame-01..08.png` |

The 1774x887 sheets do not divide evenly into 4x2 integer cells. They are sliced using rounded proportional boundaries and padded onto a consistent 444x444 logical canvas. The 1536x1024 sheet is sliced into exact 512x512 cells. This preserves a stable pivot/canvas and avoids frame-to-frame jitter.

## Skill IDs and gameplay

| Hotkey | ID | Name | Qi | Cooldown | Rule |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | `normal-slash` | Chém Thường | 0 | 0.85s | 100% ATK, melee range 180 |
| 2 | `sword-qi` | Kiếm Khí | 10 | 4s | existing 160% ATK balance retained |
| 3 | `ten-thousand-swords` | Vạn Kiếm Trận | 20 | 8s | existing 100% ATK to all living enemies retained |
| 4 | `heal` | Hồi Nguyên Thuật | 15 | 12s | existing 20% max HP heal retained |

Existing balance values were retained where the repository already defined them, per the import rules.

## Runtime flow

- Normal Slash: validate -> slash player animation -> supplied slash VFX -> single hit window -> damage once -> cooldown.
- Sword Qi: validate -> spell player animation -> supplied projectile animation travels to the selected enemy -> collision/hit callback -> damage once -> cleanup -> cooldown.
- Ten Thousand Swords: validate -> spell player animation -> supplied AoE sword sequence -> one deterministic AoE hit window -> cleanup -> cooldown.
- Heal: validate -> spell player animation -> supplied healing aura -> one heal pulse -> clamped player heal -> cleanup -> cooldown.

`SkillState.phase` tracks `ready`, `casting`, `active`, and `cooldown`. Gameplay cooldown remains owned by `SkillManager`; the HUD reads that real cooldown rather than running an independent timer.

## HUD and input

- Slots 1-4 show the supplied skill icons.
- Click/tap uses the existing quick-slot pointer interaction.
- Keyboard keys `1`-`4` cast the corresponding skill.
- The supplied 8-frame cooldown artwork is selected from actual cooldown progress and overlaid on the existing HUD slot. The HUD frame itself is not redrawn.

## Animation and pixel rendering

- Normal Slash uses the existing hero `slash` animation.
- Sword Qi, Ten Thousand Swords, and Heal use the existing hero `spell` animation.
- The existing `PlayerAnimationController` combat lock prevents locomotion from overwriting slash/spell playback.
- Idle/walk/run requests resume automatically after combat animation completion.
- All skill textures are preloaded with PixiJS `nearest` scale mode; effect positions are integer-rounded where practical.

## Debugging

Development hit/collider helpers are off by default. Start the game with `?skillDebug` in development to show skill debug circles.

## Important source files

- `src/game/skills/skillAssets.ts`
- `src/game/skills/skillData.ts`
- `src/game/skills/SkillManager.ts`
- `src/game/skills/SkillCombatSystem.ts`
- `src/game/skills/SkillVfxSystem.ts`
- `src/game/animation/PlayerAnimationController.ts`
- `src/ui/hud/PlayerBottomHUD.ts`
- `src/game/scenes/MainScene.ts`

## Adding another skill

1. Put raw art in `_skill-import` and audit dimensions/alpha/frame layout.
2. Slice or copy it into a deterministic `public/assets/skills/<skill-id>/...` structure without trimming frames inconsistently.
3. Add paths/scales/timing to `skillAssets.ts`.
4. Add gameplay definition to `skillData.ts`.
5. Extend `SkillCombatSystem`/`SkillVfxSystem` only as required by the new behavior; do not create a second combat manager.
6. Bind the definition icon to an available quick slot and use the real `SkillManager` cooldown state.
7. Run `npm run build` and verify all production asset URLs load.
