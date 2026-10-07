export interface HUDRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const HUD_STANDARD_WIDTH = 1184;
export const HUD_STANDARD_HEIGHT = 96;
export const HUD_COMPACT_HEIGHT = 64;
export const HUD_BOTTOM_MARGIN = 8;

export const HUD_REGIONS: Readonly<Record<string, HUDRegion>> = {
    avatar: { x: 10, y: 12, width: 64, height: 72 },
    profile: { x: 86, y: 9, width: 276, height: 78 },
    quickSlots: { x: 378, y: 22, width: 236, height: 52 },
    currency: { x: 628, y: 19, width: 132, height: 58 },
    navigation: { x: 776, y: 24, width: 236, height: 48 },
    utility: { x: 1024, y: 18, width: 150, height: 60 },
} as const;
