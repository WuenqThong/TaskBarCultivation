export enum CultivationRealm {
    QI_REFINING = "qi_refining",
    FOUNDATION_ESTABLISHMENT = "foundation_establishment",
    GOLDEN_CORE = "golden_core",
    NASCENT_SOUL = "nascent_soul",
    SOUL_TRANSFORMATION = "soul_transformation",
    VOID_REFINING = "void_refining",
    BODY_INTEGRATION = "body_integration",
    MAHAYANA = "mahayana",
    TRIBULATION = "tribulation",
}

export const CULTIVATION_REALM_LABELS: Readonly<
    Record<CultivationRealm, string>
> = {
    [CultivationRealm.QI_REFINING]: "Luyện Khí",
    [CultivationRealm.FOUNDATION_ESTABLISHMENT]: "Trúc Cơ",
    [CultivationRealm.GOLDEN_CORE]: "Kim Đan",
    [CultivationRealm.NASCENT_SOUL]: "Nguyên Anh",
    [CultivationRealm.SOUL_TRANSFORMATION]: "Hóa Thần",
    [CultivationRealm.VOID_REFINING]: "Luyện Hư",
    [CultivationRealm.BODY_INTEGRATION]: "Hợp Thể",
    [CultivationRealm.MAHAYANA]: "Đại Thừa",
    [CultivationRealm.TRIBULATION]: "Độ Kiếp",
};

const CULTIVATION_REALM_RANKS: Readonly<
    Record<CultivationRealm, number>
> = {
    [CultivationRealm.QI_REFINING]: 1,
    [CultivationRealm.FOUNDATION_ESTABLISHMENT]: 2,
    [CultivationRealm.GOLDEN_CORE]: 3,
    [CultivationRealm.NASCENT_SOUL]: 4,
    [CultivationRealm.SOUL_TRANSFORMATION]: 5,
    [CultivationRealm.VOID_REFINING]: 6,
    [CultivationRealm.BODY_INTEGRATION]: 7,
    [CultivationRealm.MAHAYANA]: 8,
    [CultivationRealm.TRIBULATION]: 9,
};

export function getCultivationRealmRank(
    realm: CultivationRealm,
): number {
    return CULTIVATION_REALM_RANKS[realm];
}
