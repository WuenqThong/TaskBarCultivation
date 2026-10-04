import { CultivationRealm } from "./CultivationRealm";
import { CultivationStage } from "./CultivationStage";

export const CULTIVATION_LAYERS_PER_STAGE = 10;
export const BASE_CULTIVATION_PER_SECOND = 1;
export const CULTIVATION_LAYER_GROWTH = 1.12;

export const CULTIVATION_REALM_ORDER: ReadonlyArray<CultivationRealm> = [
    CultivationRealm.QI_REFINING,
    CultivationRealm.FOUNDATION_ESTABLISHMENT,
    CultivationRealm.GOLDEN_CORE,
    CultivationRealm.NASCENT_SOUL,
    CultivationRealm.SOUL_TRANSFORMATION,
    CultivationRealm.VOID_REFINING,
    CultivationRealm.BODY_INTEGRATION,
    CultivationRealm.MAHAYANA,
    CultivationRealm.TRIBULATION,
];

export const CULTIVATION_STAGE_ORDER: ReadonlyArray<CultivationStage> = [
    CultivationStage.EARLY,
    CultivationStage.MIDDLE,
    CultivationStage.LATE,
];

export const REALM_BASE_CULTIVATION: Readonly<
    Record<CultivationRealm, number>
> = {
    [CultivationRealm.QI_REFINING]: 100,
    [CultivationRealm.FOUNDATION_ESTABLISHMENT]: 500,
    [CultivationRealm.GOLDEN_CORE]: 2500,
    [CultivationRealm.NASCENT_SOUL]: 10000,
    [CultivationRealm.SOUL_TRANSFORMATION]: 50000,
    [CultivationRealm.VOID_REFINING]: 200000,
    [CultivationRealm.BODY_INTEGRATION]: 1000000,
    [CultivationRealm.MAHAYANA]: 5000000,
    [CultivationRealm.TRIBULATION]: 25000000,
};

export const CULTIVATION_STAGE_MULTIPLIER: Readonly<
    Record<CultivationStage, number>
> = {
    [CultivationStage.EARLY]: 1,
    [CultivationStage.MIDDLE]: 1.5,
    [CultivationStage.LATE]: 2.2,
};
