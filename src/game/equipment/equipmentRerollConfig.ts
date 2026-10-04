import {
    CultivationRealm,
    getCultivationRealmRank,
} from "../cultivation/CultivationRealm";
import { EquipmentRarity } from "./EquipmentRarity";

export interface EquipmentRerollCost {
    essence: number;
    spiritStone: number;
}

export const EQUIPMENT_REROLL_BASE_COST: Readonly<
    Record<EquipmentRarity, EquipmentRerollCost>
> = {
    [EquipmentRarity.WHITE]: { essence: 1, spiritStone: 20 },
    [EquipmentRarity.GREEN]: { essence: 2, spiritStone: 40 },
    [EquipmentRarity.BLUE]: { essence: 4, spiritStone: 80 },
    [EquipmentRarity.PURPLE]: { essence: 7, spiritStone: 150 },
    [EquipmentRarity.GOLD]: { essence: 12, spiritStone: 300 },
    [EquipmentRarity.RED]: { essence: 20, spiritStone: 600 },
};

export const EQUIPMENT_REROLL_LOCK_COST_MULTIPLIER: Readonly<
    Record<number, number>
> = {
    0: 1,
    1: 2,
    2: 4,
};

export const EQUIPMENT_REROLL_REALM_COST_MULTIPLIER: Readonly<
    Record<CultivationRealm, number>
> = {
    [CultivationRealm.QI_REFINING]: getCultivationRealmRank(CultivationRealm.QI_REFINING),
    [CultivationRealm.FOUNDATION_ESTABLISHMENT]: getCultivationRealmRank(CultivationRealm.FOUNDATION_ESTABLISHMENT),
    [CultivationRealm.GOLDEN_CORE]: getCultivationRealmRank(CultivationRealm.GOLDEN_CORE),
    [CultivationRealm.NASCENT_SOUL]: getCultivationRealmRank(CultivationRealm.NASCENT_SOUL),
    [CultivationRealm.SOUL_TRANSFORMATION]: getCultivationRealmRank(CultivationRealm.SOUL_TRANSFORMATION),
    [CultivationRealm.VOID_REFINING]: getCultivationRealmRank(CultivationRealm.VOID_REFINING),
    [CultivationRealm.BODY_INTEGRATION]: getCultivationRealmRank(CultivationRealm.BODY_INTEGRATION),
    [CultivationRealm.MAHAYANA]: getCultivationRealmRank(CultivationRealm.MAHAYANA),
    [CultivationRealm.TRIBULATION]: getCultivationRealmRank(CultivationRealm.TRIBULATION),
};
