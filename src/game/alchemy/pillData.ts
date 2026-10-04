import { CultivationRealm } from "../cultivation/CultivationRealm";
import { PillEffectType } from "./Pill";
import type { PillDefinition } from "./Pill";

export const PILL_DATA = {
    HEALING_PILL: {
        id: "healing_pill",
        name: "Hồi Huyết Đan",
        description: "Hồi phục một phần HP tối đa.",
        effectType: PillEffectType.RESTORE_HP,
        baseEffectValue: 0.2,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    SPIRIT_RESTORATION_PILL: {
        id: "spirit_restoration_pill",
        name: "Hồi Linh Đan",
        description: "Hồi phục một phần MP tối đa.",
        effectType: PillEffectType.RESTORE_MP,
        baseEffectValue: 0.25,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    QI_GATHERING_PILL: {
        id: "qi_gathering_pill",
        name: "Tụ Khí Đan",
        description: "Tạm thời tăng tốc độ tu luyện.",
        effectType: PillEffectType.CULTIVATION_SPEED,
        baseEffectValue: 0.25,
        duration: 60,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
} as const satisfies Record<string, PillDefinition>;

export const PILL_DEFINITIONS: ReadonlyArray<PillDefinition> =
    Object.values(PILL_DATA);
