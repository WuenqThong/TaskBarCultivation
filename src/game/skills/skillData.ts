import {
    SkillEffectType,
    SkillTargetType,
} from "./Skill";
import type { SkillDefinition } from "./Skill";

export const SKILL_IDS = {
    SWORD_QI: "sword_qi",
    TEN_THOUSAND_SWORDS: "ten_thousand_swords",
    ORIGIN_RECOVERY: "origin_recovery",
} as const;

export const SKILL_DATA: ReadonlyArray<SkillDefinition> = [
    {
        id: SKILL_IDS.SWORD_QI,
        name: "Kiếm Khí",
        description: "Gây 160.00% Công lên một mục tiêu.",
        mpCost: 10,
        baseCooldown: 4,
        targetType: SkillTargetType.SINGLE_ENEMY,
        effectType: SkillEffectType.DAMAGE,
        damageMultiplier: 1.6,
    },
    {
        id: SKILL_IDS.TEN_THOUSAND_SWORDS,
        name: "Vạn Kiếm Trận",
        description: "Gây 100.00% Công lên toàn bộ quái.",
        mpCost: 20,
        baseCooldown: 8,
        targetType: SkillTargetType.ALL_ENEMIES,
        effectType: SkillEffectType.DAMAGE,
        damageMultiplier: 1,
    },
    {
        id: SKILL_IDS.ORIGIN_RECOVERY,
        name: "Hồi Nguyên Thuật",
        description: "Hồi 20.00% HP tối đa.",
        mpCost: 15,
        baseCooldown: 12,
        targetType: SkillTargetType.SELF,
        effectType: SkillEffectType.HEAL,
        healPercent: 0.2,
    },
];
