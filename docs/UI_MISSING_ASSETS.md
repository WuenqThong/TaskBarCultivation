# UI Missing Assets

- \`public/assets/ui/hud/taskbar/taskbar-main-bottom-frame.png\`
  - Missing in the current repository.
  - The main HUD currently uses a PixiJS Graphics fallback shell.
  - Expected style: dark bronze, aged gold, jade accents, pixel-art Xianxia ornamentation.

- \`docs/UI_IMPLEMENTATION_GUIDE.md\` and \`docs/UI_SCREEN_MAP.md\`
  - Referenced by the implementation request but not present in the repository.

The HUD is asset-independent so the production frame can replace the fallback without changing gameplay bindings.
