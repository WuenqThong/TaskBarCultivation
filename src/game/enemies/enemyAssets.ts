import { Assets, Rectangle, Texture } from "pixi.js";

export type EnemyAnimationState = "idle" | "move" | "attack" | "hurt" | "death" | "special";

interface EnemySheetDefinition {
    sheet: string;
    phaseSheets?: readonly string[];
    scale: number;
    fps: Readonly<Record<EnemyAnimationState, number>>;
}

const FRAME_WIDTH = 362;
const FRAME_HEIGHT = 543;
const COLUMNS = 4;

export const ENEMY_UI_ATLAS = "/assets/ui/enemy/common/enemy-ui-atlas.png";

export const ENEMY_ASSETS: Readonly<Record<string, EnemySheetDefinition>> = {
    green_wind_wolf: {
        sheet: "/assets/enemies/green-wind-wolf/sprites/sheet.png",
        scale: 0.30,
        fps: { idle: 5, move: 10, attack: 11, hurt: 6, death: 5, special: 8 },
    },
    fire_spirit_snake: {
        sheet: "/assets/enemies/fire-spirit-snake/sprites/sheet.png",
        scale: 0.30,
        fps: { idle: 4, move: 7, attack: 8, hurt: 5, death: 4, special: 7 },
    },
    iron_shell_beetle: {
        sheet: "/assets/enemies/iron-shell-beetle/sprites/sheet.png",
        scale: 0.28,
        fps: { idle: 3, move: 5, attack: 6, hurt: 4, death: 3, special: 5 },
    },
    blood_frenzy_wolf: {
        sheet: "/assets/enemies/blood-frenzy-wolf/sprites/sheet.png",
        scale: 0.30,
        fps: { idle: 5, move: 8, attack: 9, hurt: 6, death: 5, special: 10 },
    },
    green_wind_wolf_king: {
        sheet: "/assets/enemies/green-wind-wolf-king/sprites/phase-1.png",
        phaseSheets: [
            "/assets/enemies/green-wind-wolf-king/sprites/phase-1.png",
            "/assets/enemies/green-wind-wolf-king/sprites/phase-2.png",
            "/assets/enemies/green-wind-wolf-king/sprites/phase-3.png",
        ],
        scale: 0.38,
        fps: { idle: 4, move: 7, attack: 8, hurt: 5, death: 4, special: 9 },
    },
};

const STATE_FRAMES: Readonly<Record<EnemyAnimationState, readonly number[]>> = {
    idle: [0, 1],
    move: [2, 3],
    attack: [4, 5],
    hurt: [6],
    death: [7],
    special: [4, 5, 6],
};

export async function loadEnemyAssets(): Promise<void> {
    const paths = new Set<string>([ENEMY_UI_ATLAS]);
    for (const asset of Object.values(ENEMY_ASSETS)) {
        paths.add(asset.sheet);
        for (const phaseSheet of asset.phaseSheets ?? []) paths.add(phaseSheet);
    }
    const textures = await Promise.all([...paths].map((path) => Assets.load<Texture>(path)));
    textures.forEach((texture) => {
        texture.source.scaleMode = "nearest";
    });
}

export function getEnemyAnimationTextures(
    enemyId: string,
    state: EnemyAnimationState,
    phaseIndex = 0,
): Texture[] {
    const definition = ENEMY_ASSETS[enemyId];
    if (!definition) return [Texture.EMPTY];
    const sheetPath = definition.phaseSheets?.[
        Math.max(0, Math.min((definition.phaseSheets?.length ?? 1) - 1, phaseIndex))
    ] ?? definition.sheet;
    const source = Assets.get<Texture>(sheetPath);
    if (!source) return [Texture.EMPTY];
    source.source.scaleMode = "nearest";

    return STATE_FRAMES[state].map((index) => new Texture({
        source: source.source,
        frame: new Rectangle(
            (index % COLUMNS) * FRAME_WIDTH,
            Math.floor(index / COLUMNS) * FRAME_HEIGHT,
            FRAME_WIDTH,
            FRAME_HEIGHT,
        ),
    }));
}

export function getEnemyVisualConfig(enemyId: string): EnemySheetDefinition | null {
    return ENEMY_ASSETS[enemyId] ?? null;
}

export function getEnemyUiAtlasTexture(): Texture {
    const texture = Assets.get<Texture>(ENEMY_UI_ATLAS);
    if (!texture) return Texture.EMPTY;
    texture.source.scaleMode = "nearest";
    return texture;
}
