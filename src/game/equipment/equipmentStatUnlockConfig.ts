import {
    CultivationRealm,
    getCultivationRealmRank,
} from "../cultivation/CultivationRealm";
import { EquipmentRarity } from "./EquipmentRarity";

export interface EquipmentStatUnlockCost {
    essence: number;
    spiritStone: number;
}

const LINE_THREE_BASE_COST: Readonly<
    Record<EquipmentRarity, EquipmentStatUnlockCost>
> = {
    [EquipmentRarity.WHITE]: { essence: 3, spiritStone: 50 },
    [EquipmentRarity.GREEN]: { essence: 5, spiritStone: 100 },
    [EquipmentRarity.BLUE]: { essence: 8, spiritStone: 200 },
    [EquipmentRarity.PURPLE]: { essence: 12, spiritStone: 400 },
    [EquipmentRarity.GOLD]: { essence: 20, spiritStone: 800 },
    [EquipmentRarity.RED]: { essence: 32, spiritStone: 1600 },
};

export const EQUIPMENT_STAT_UNLOCK_BASE_COST_BY_TARGET_LINE: Readonly<
    Record<number, Readonly<Record<EquipmentRarity, EquipmentStatUnlockCost>>>
> = {
    3: LINE_THREE_BASE_COST,
};

export const EQUIPMENT_STAT_UNLOCK_REALM_COST_MULTIPLIER: Readonly<
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
