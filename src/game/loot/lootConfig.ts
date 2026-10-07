export const DIRECT_EQUIPMENT_DROP_ENABLED = false;

export const SPIRIT_STONE_DROP = {
    boss: 150,
} as const;

export const MATERIAL_DROP_MULTIPLIER = 1;
export const BOSS_MATERIAL_MULTIPLIER = 1;

export interface ChapterOneRewardBand {
    minStage: number;
    maxStage: number;
    spiritStonePerEnemy: number;
    materialChanceMultiplier: number;
}

export const CHAPTER_ONE_REWARD_BANDS: ReadonlyArray<ChapterOneRewardBand> = [
    { minStage: 1, maxStage: 9, spiritStonePerEnemy: 3, materialChanceMultiplier: 0.85 },
    { minStage: 10, maxStage: 19, spiritStonePerEnemy: 4, materialChanceMultiplier: 0.95 },
    { minStage: 20, maxStage: 29, spiritStonePerEnemy: 5, materialChanceMultiplier: 1 },
    { minStage: 30, maxStage: 39, spiritStonePerEnemy: 6, materialChanceMultiplier: 1.05 },
    { minStage: 40, maxStage: 49, spiritStonePerEnemy: 7, materialChanceMultiplier: 1.1 },
    { minStage: 50, maxStage: 50, spiritStonePerEnemy: SPIRIT_STONE_DROP.boss, materialChanceMultiplier: 1 },
];

export function getChapterOneRewardBand(stage: number): ChapterOneRewardBand {
    return CHAPTER_ONE_REWARD_BANDS.find(
        (band) => stage >= band.minStage && stage <= band.maxStage,
    ) ?? CHAPTER_ONE_REWARD_BANDS[0];
}
