import { CATALYST_DATA } from "../crafting/catalystData";

export interface WeightedCatalystDrop {
    catalystId: string;
    weight: number;
}

export interface BossCatalystDropTable {
    minChapter: number;
    maxChapter: number;
    dropChance: number;
    entries: ReadonlyArray<WeightedCatalystDrop>;
}

export const BOSS_CATALYST_DROP_TABLES: ReadonlyArray<
    BossCatalystDropTable
> = [
    {
        minChapter: 1,
        maxChapter: 2,
        dropChance: 0.75,
        entries: [
            { catalystId: CATALYST_DATA.LOW_GRADE_FORTUNE_STONE.id, weight: 45 },
            { catalystId: CATALYST_DATA.LOW_GRADE_ALCHEMY_FLAME.id, weight: 45 },
            { catalystId: CATALYST_DATA.MID_GRADE_FORTUNE_STONE.id, weight: 5 },
            { catalystId: CATALYST_DATA.MID_GRADE_ALCHEMY_FLAME.id, weight: 5 },
        ],
    },
    {
        minChapter: 3,
        maxChapter: 5,
        dropChance: 0.5,
        entries: [
            { catalystId: CATALYST_DATA.LOW_GRADE_FORTUNE_STONE.id, weight: 30 },
            { catalystId: CATALYST_DATA.LOW_GRADE_ALCHEMY_FLAME.id, weight: 30 },
            { catalystId: CATALYST_DATA.MID_GRADE_FORTUNE_STONE.id, weight: 17.5 },
            { catalystId: CATALYST_DATA.MID_GRADE_ALCHEMY_FLAME.id, weight: 17.5 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_FORTUNE_STONE.id, weight: 2.5 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_ALCHEMY_FLAME.id, weight: 2.5 },
        ],
    },
    {
        minChapter: 6,
        maxChapter: 9,
        dropChance: 0.6,
        entries: [
            { catalystId: CATALYST_DATA.LOW_GRADE_FORTUNE_STONE.id, weight: 15 },
            { catalystId: CATALYST_DATA.LOW_GRADE_ALCHEMY_FLAME.id, weight: 15 },
            { catalystId: CATALYST_DATA.MID_GRADE_FORTUNE_STONE.id, weight: 27 },
            { catalystId: CATALYST_DATA.MID_GRADE_ALCHEMY_FLAME.id, weight: 27 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_FORTUNE_STONE.id, weight: 7 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_ALCHEMY_FLAME.id, weight: 7 },
            { catalystId: CATALYST_DATA.HEAVENLY_FORTUNE_JADE.id, weight: 2 },
        ],
    },
    {
        minChapter: 10,
        maxChapter: Number.POSITIVE_INFINITY,
        dropChance: 0.7,
        entries: [
            { catalystId: CATALYST_DATA.MID_GRADE_FORTUNE_STONE.id, weight: 20 },
            { catalystId: CATALYST_DATA.MID_GRADE_ALCHEMY_FLAME.id, weight: 20 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_FORTUNE_STONE.id, weight: 27.5 },
            { catalystId: CATALYST_DATA.HIGH_GRADE_ALCHEMY_FLAME.id, weight: 27.5 },
            { catalystId: CATALYST_DATA.HEAVENLY_FORTUNE_JADE.id, weight: 5 },
        ],
    },
];
