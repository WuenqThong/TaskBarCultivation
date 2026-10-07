export const MENU_ASSETS = {
    loadout: {
        main: "/assets/ui/loadout/loadout-main.png",
    },
    cards: {
        neutral: "/assets/ui/menu/cards/card-neutral.png",
        health: "/assets/ui/menu/cards/card-health.png",
        attack: "/assets/ui/menu/cards/card-attack.png",
        defense: "/assets/ui/menu/cards/card-defense.png",
        speed: "/assets/ui/menu/cards/card-speed.png",
        special: "/assets/ui/menu/cards/card-special.png",
        cultivation: "/assets/ui/menu/cards/card-cultivation.png",
    },
    inventory: {
        gridFrame: "/assets/ui/menu/inventory/icon-grid-frame.png",
        rarityFrame: "/assets/ui/menu/inventory/rarity-frame.png",
        selectedFrame: "/assets/ui/menu/inventory/selected-frame.png",
        detailPanes: [
            "/assets/ui/menu/inventory/detail-pane-1.png",
            "/assets/ui/menu/inventory/detail-pane-2.png",
            "/assets/ui/menu/inventory/detail-pane-3.png",
            "/assets/ui/menu/inventory/detail-pane-4.png",
        ],
    },
} as const;

export const ALL_MENU_TEXTURE_PATHS = [
    MENU_ASSETS.loadout.main,
    ...Object.values(MENU_ASSETS.cards),
    MENU_ASSETS.inventory.gridFrame,
    MENU_ASSETS.inventory.rarityFrame,
    MENU_ASSETS.inventory.selectedFrame,
    ...MENU_ASSETS.inventory.detailPanes,
];
