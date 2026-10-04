export enum CultivationStage {
    EARLY = "early",
    MIDDLE = "middle",
    LATE = "late",
}

export const CULTIVATION_STAGE_LABELS: Readonly<
    Record<CultivationStage, string>
> = {
    [CultivationStage.EARLY]: "Tiền Kỳ",
    [CultivationStage.MIDDLE]: "Trung Kỳ",
    [CultivationStage.LATE]: "Hậu Kỳ",
};

const CULTIVATION_STAGE_RANKS: Readonly<
    Record<CultivationStage, number>
> = {
    [CultivationStage.EARLY]: 1,
    [CultivationStage.MIDDLE]: 2,
    [CultivationStage.LATE]: 3,
};

export function getCultivationStageRank(
    stage: CultivationStage,
): number {
    return CULTIVATION_STAGE_RANKS[stage];
}
