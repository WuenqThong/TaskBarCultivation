# Enemy Asset Import

## Scope

This import covers the five existing enemy IDs:

- `green_wind_wolf` — Thanh Phong Lang
- `fire_spirit_snake` — Hỏa Linh Xà
- `iron_shell_beetle` — Thiết Giáp Trùng
- `blood_frenzy_wolf` — Cuồng Huyết Lang
- `green_wind_wolf_king` — Thanh Phong Lang Vương

Runtime code uses only `public/assets/enemies/` and `public/assets/ui/enemy/`. Original raw PNGs are preserved under `public/assets/_enemy-import/_processed/`.

## Raw asset audit

All eight source PNGs are 32-bit ARGB PNGs with transparent backgrounds.

| Raw file | Size | Classification | Approx. visible bounds | Production destination |
| --- | ---: | --- | --- | --- |
| Ảnh ChatGPT 12_43_25 6 thg 10, 2026-1.png | 1448×1086 | Thanh Phong Lang 8-frame character sheet | x≈0–1420, y≈220–925 | `enemies/green-wind-wolf/sprites/sheet.png` |
| Ảnh ChatGPT 12_43_27 6 thg 10, 2026-2.png | 1448×1086 | Hỏa Linh Xà 8-frame character sheet | x≈0–1410, y≈150–920 | `enemies/fire-spirit-snake/sprites/sheet.png` |
| Ảnh ChatGPT 12_43_28 6 thg 10, 2026-3.png | 1448×1086 | Thiết Giáp Trùng 8-frame character sheet | x≈10–1415, y≈245–875 | `enemies/iron-shell-beetle/sprites/sheet.png` |
| Ảnh ChatGPT 12_43_30 6 thg 10, 2026-4.png | 1448×1086 | Cuồng Huyết Lang 8-frame character sheet | x≈0–1410, y≈185–930 | `enemies/blood-frenzy-wolf/sprites/sheet.png` |
| Ảnh ChatGPT 12_43_31 6 thg 10, 2026-5.png | 1448×1086 | Wolf King phase-1 / base 8-frame sheet | x≈0–1420, y≈170–930 | `enemies/green-wind-wolf-king/sprites/phase-1.png` |
| Ảnh ChatGPT 12_43_33 6 thg 10, 2026-6.png | 1448×1086 | Wolf King phase-2 8-frame sheet | x≈0–1420, y≈150–940 | `enemies/green-wind-wolf-king/sprites/phase-2.png` |
| Ảnh ChatGPT 12_43_34 6 thg 10, 2026-7.png | 1448×1086 | Wolf King phase-3 8-frame sheet | x≈0–1415, y≈150–930 | `enemies/green-wind-wolf-king/sprites/phase-3.png` |
| health bả.png | 1536×304 | Shared enemy/boss UI atlas: HP/MP/shield-looking bars, loot glows, rarity frames, boss frame and phase ornaments | x≈15–1515, y≈5–298 | `ui/enemy/common/enemy-ui-atlas.png` |

The seven creature sheets use a deterministic 4×2 layout. Each subtexture is 362×543. Frames are not independently trimmed, preserving a consistent origin and avoiding animation jitter.

## Animation mapping

Normal-enemy sheets use these frame indexes:

- idle: 1–2
- move: 3–4
- attack: 5–6
- hurt: 7
- death: 8
- special/berserk fallback: 5–7

Configured playback:

| Enemy | Idle | Move | Attack | Hurt | Death |
| --- | ---: | ---: | ---: | ---: | ---: |
| Thanh Phong Lang | 5 fps | 10 fps | 11 fps | 6 fps | 5 fps |
| Hỏa Linh Xà | 4 fps | 7 fps | 8 fps | 5 fps | 4 fps |
| Thiết Giáp Trùng | 3 fps | 5 fps | 6 fps | 4 fps | 3 fps |
| Cuồng Huyết Lang | 5 fps | 8 fps | 9 fps | 6 fps | 5 fps |
| Thanh Phong Lang Vương | 4 fps | 7 fps | 8 fps | 5 fps | 4 fps |

The Wolf King switches sheet source by existing boss phase: phase-1 → phase-1.png, phase-2 → phase-2.png, phase-3 → phase-3.png. Gameplay phase multipliers still come from `bossData.ts` / `BossController.ts`.

## Gameplay integration

`EnemyFactory` remains the single stat construction path. Archetype multipliers remain authoritative:

- Swift keeps movement/attack-speed behavior.
- Tank keeps the existing 1.8× HP multiplier.
- Berserker keeps the existing 40% HP threshold and existing attack / attack-speed / move-speed multipliers.
- No duplicate combat or enemy manager was created.

`Enemy.ts` now renders an `AnimatedSprite` from the production sheet, drives idle/move/attack/hurt/death states, and keeps nearest-neighbor rendering enabled.

## Normal enemy UI

All non-boss enemies use one shared `EnemyWorldHUD`:

- dynamic enemy name and archetype text
- shared atlas-backed HP frame/fill
- actual HP values from the `Enemy` entity
- HUD hides on death
- berserker name accent reacts to the existing enrage state

There are no supplied standalone per-enemy nameplate frames, so no fake unique nameplate PNGs were generated.

## Shield / barrier

The UI atlas contains shield-looking art, but no gameplay shield state exists in the repository (`currentShield`, `maxShield`, shield/barrier combat logic were not present). Therefore no shield gameplay or shield bar was invented.

## Loot UI

`EnemyLootDropUI` uses the supplied loot-glow artwork and displays data from the real `LootSystem.rollLoot()` result. It does not roll or fabricate loot independently. Inventory/material/catalyst/artifact-fragment updates remain in the existing reward flow.

## Boss HUD

`BossHUD` is attached directly to `app.stage` and is screen-space. It uses the supplied Wolf King boss artwork from the UI atlas and shows:

- dynamic boss name
- actual HP current/max
- three phase markers
- current phase
- active boss self-buff duration

The boss does not use the normal-enemy world HP bar. The HUD appears for the boss encounter and hides after boss cleanup.

## Debug mode

In development, append `?enemyDebug` to the URL to show:

- origin marker
- logical sprite bounds
- attack-range line
- enemy ID/archetype
- HP
- boss phase
- berserk state

Debug visuals are off by default.

## Known limitations

- The source character sheets are pose sheets rather than authored frame-perfect sprite animations. The implementation maps their eight poses into deterministic animation states while preserving the original artwork.
- No dedicated standalone nameplate skins were supplied.
- No gameplay shield/barrier system exists yet, so shield-looking atlas art remains unused.
- The fire serpent sheet contains fire-breath-looking poses, but ranged fire-breath gameplay was not added because the current enemy definition is melee/balanced.
- Boss phase art is mapped to existing phase state; phase gameplay itself remains unchanged.

## Validation

Configured package scripts only expose `dev`, `build`, and `preview`. `npm run build` runs TypeScript plus Vite and passes after this import.

Runtime source contains no references to `public/assets/_enemy-import/`.

