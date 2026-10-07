import { ENEMY_DATA } from "../enemies/enemyData";

export type EncounterKind = "normal" | "elite" | "gauntlet" | "boss";

export interface EncounterWave {
    enemyIds: readonly string[];
    hpMultiplier?: number;
    attackMultiplier?: number;
    speedMultiplier?: number;
    spacing?: number;
}

export interface EncounterDefinition {
    chapter: number;
    stage: number;
    kind: EncounterKind;
    label: string;
    waves: readonly EncounterWave[];
}

const WOLF = ENEMY_DATA.GREEN_WIND_WOLF.id;
const SNAKE = ENEMY_DATA.FIRE_SPIRIT_SNAKE.id;
const BEETLE = ENEMY_DATA.IRON_SHELL_BEETLE.id;
const BLOOD_WOLF = ENEMY_DATA.BLOOD_FRENZY_WOLF.id;

function cycle(stage: number, options: readonly string[], count: number): string[] {
    return Array.from({ length: count }, (_, index) =>
        options[(stage + index) % options.length],
    );
}

export function getEncounterDefinition(chapter: number, stage: number): EncounterDefinition {
    if (stage === 50) {
        return {
            chapter,
            stage,
            kind: "boss",
            label: chapter === 1 ? "Thanh Phong Lang Vương" : "Boss",
            waves: [],
        };
    }

    if (chapter !== 1) {
        return {
            chapter,
            stage,
            kind: "normal",
            label: "Yêu Thú Hỗn Chiến",
            waves: [{ enemyIds: cycle(stage, [WOLF, SNAKE, BEETLE, BLOOD_WOLF], 4) }],
        };
    }

    if (stage <= 9) {
        return {
            chapter,
            stage,
            kind: "normal",
            label: stage <= 4 ? "Phong Lang Ngoại Vi" : "Linh Thú Sơn Cốc",
            waves: [{ enemyIds: cycle(stage, [WOLF, SNAKE], 3) }],
        };
    }

    if (stage === 10) {
        return {
            chapter,
            stage,
            kind: "elite",
            label: "Tinh Anh · Song Lang",
            waves: [{ enemyIds: [WOLF, WOLF], hpMultiplier: 1.6, attackMultiplier: 1.2 }],
        };
    }

    if (stage <= 19) {
        return {
            chapter,
            stage,
            kind: "normal",
            label: "Thiết Giáp Địa Vực",
            waves: [{ enemyIds: cycle(stage, [WOLF, SNAKE, BEETLE], 4) }],
        };
    }

    if (stage === 20) {
        return {
            chapter,
            stage,
            kind: "elite",
            label: "Tinh Anh · Thiết Giáp Trùng",
            waves: [{ enemyIds: [BEETLE], hpMultiplier: 2.6, attackMultiplier: 1.35 }],
        };
    }

    if (stage <= 29) {
        return {
            chapter,
            stage,
            kind: "normal",
            label: "Cuồng Huyết Lâm",
            waves: [{ enemyIds: cycle(stage, [SNAKE, BEETLE, BLOOD_WOLF, WOLF], 5) }],
        };
    }

    if (stage === 30) {
        return {
            chapter,
            stage,
            kind: "elite",
            label: "Tinh Anh · Cuồng Huyết Lang",
            waves: [{ enemyIds: [BLOOD_WOLF], hpMultiplier: 2.4, attackMultiplier: 1.55, speedMultiplier: 1.08 }],
        };
    }

    if (stage <= 39) {
        return {
            chapter,
            stage,
            kind: "gauntlet",
            label: "Song Trận Yêu Thú",
            waves: [
                { enemyIds: cycle(stage, [WOLF, SNAKE, BEETLE], 3) },
                { enemyIds: cycle(stage + 1, [BLOOD_WOLF, BEETLE, WOLF], 3), hpMultiplier: 1.12, attackMultiplier: 1.08 },
            ],
        };
    }

    if (stage === 40) {
        return {
            chapter,
            stage,
            kind: "gauntlet",
            label: "Tiểu Thủ Lĩnh · Huyết Giáp",
            waves: [
                { enemyIds: [BEETLE, WOLF, WOLF], hpMultiplier: 1.2 },
                { enemyIds: [BLOOD_WOLF, BEETLE], hpMultiplier: 1.9, attackMultiplier: 1.35 },
            ],
        };
    }

    return {
        chapter,
        stage,
        kind: "gauntlet",
        label: "Lang Vương Cấm Địa",
        waves: [
            { enemyIds: cycle(stage, [WOLF, SNAKE, BEETLE, BLOOD_WOLF], 4), hpMultiplier: 1.08 },
            { enemyIds: cycle(stage + 2, [BLOOD_WOLF, BEETLE, WOLF, SNAKE], 4), hpMultiplier: 1.2, attackMultiplier: 1.12 },
        ],
    };
}
