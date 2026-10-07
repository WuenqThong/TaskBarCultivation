export const ARTIFACT_FRAGMENTS_REQUIRED = 40;

export interface ArtifactFragmentDropBand {
    minStage: number;
    maxStage: number;
    chance: number;
    minAmount: number;
    maxAmount: number;
}

export const CHAPTER_ONE_ARTIFACT_FRAGMENT_BANDS: ReadonlyArray<
    ArtifactFragmentDropBand
> = [
    { minStage: 1, maxStage: 9, chance: 0.03, minAmount: 1, maxAmount: 2 },
    { minStage: 10, maxStage: 19, chance: 0.04, minAmount: 1, maxAmount: 2 },
    { minStage: 20, maxStage: 29, chance: 0.05, minAmount: 1, maxAmount: 2 },
    { minStage: 30, maxStage: 39, chance: 0.06, minAmount: 1, maxAmount: 2 },
    { minStage: 40, maxStage: 49, chance: 0.08, minAmount: 1, maxAmount: 3 },
    { minStage: 50, maxStage: 50, chance: 1, minAmount: 16, maxAmount: 18 },
];

export function getArtifactFragmentDropBand(
    chapter: number,
    stage: number,
    isBoss: boolean,
): ArtifactFragmentDropBand {
    if (chapter === 1) {
        return CHAPTER_ONE_ARTIFACT_FRAGMENT_BANDS.find(
            (band) => stage >= band.minStage && stage <= band.maxStage,
        ) ?? CHAPTER_ONE_ARTIFACT_FRAGMENT_BANDS[0];
    }

    return isBoss
        ? { minStage: stage, maxStage: stage, chance: 1, minAmount: 8, maxAmount: 12 }
        : { minStage: stage, maxStage: stage, chance: 0.08, minAmount: 1, maxAmount: 3 };
}
