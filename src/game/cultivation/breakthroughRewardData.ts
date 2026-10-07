import { CultivationRealm } from "./CultivationRealm";
import { CultivationStage } from "./CultivationStage";
import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import { SKILL_IDS } from "../skills/skillData";

export interface BreakthroughStatReward {
    kind: "stat";
    stat: StatType;
    type: StatModifierType;
    value: number;
}

export interface BreakthroughSkillUnlockReward {
    kind: "skill_unlock";
    skillId: string;
}

export interface BreakthroughCapacityReward {
    kind: "skill_slots" | "technique_slots" | "artifact_slots";
    value: number;
}

export interface BreakthroughPassiveReward {
    kind: "passive";
    id: string;
    name: string;
    description: string;
    modifiers: ReadonlyArray<BreakthroughStatReward>;
}

export type BreakthroughReward =
    | BreakthroughStatReward
    | BreakthroughSkillUnlockReward
    | BreakthroughCapacityReward
    | BreakthroughPassiveReward;

export interface BreakthroughMilestoneReward {
    id: string;
    realm: CultivationRealm;
    stage: CultivationStage;
    layer: number;
    rewards: ReadonlyArray<BreakthroughReward>;
}

// Every successful breakthrough grants this baseline growth. Special milestones
// below layer additional unlocks/passives on top of it.
export const EVERY_BREAKTHROUGH_REWARDS: ReadonlyArray<BreakthroughStatReward> = [
    { kind: "stat", stat: StatType.MAX_HP, type: StatModifierType.FLAT, value: 8 },
    { kind: "stat", stat: StatType.MAX_MP, type: StatModifierType.FLAT, value: 2 },
    { kind: "stat", stat: StatType.ATTACK, type: StatModifierType.FLAT, value: 1 },
    { kind: "stat", stat: StatType.DEFENSE, type: StatModifierType.FLAT, value: 0.4 },
];

export const BREAKTHROUGH_MILESTONE_REWARDS: ReadonlyArray<BreakthroughMilestoneReward> = [
    {
        id: "qi-early-2-sword-qi",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.EARLY,
        layer: 2,
        rewards: [
            { kind: "skill_slots", value: 2 },
            { kind: "skill_unlock", skillId: SKILL_IDS.SWORD_QI },
        ],
    },
    {
        id: "qi-early-5-technique-slot",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.EARLY,
        layer: 5,
        rewards: [{ kind: "technique_slots", value: 2 }],
    },
    {
        id: "qi-early-7-ten-thousand-swords",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.EARLY,
        layer: 7,
        rewards: [
            { kind: "skill_slots", value: 3 },
            { kind: "skill_unlock", skillId: SKILL_IDS.TEN_THOUSAND_SWORDS },
        ],
    },
    {
        id: "qi-early-10-artifact-slot",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.EARLY,
        layer: 10,
        rewards: [{ kind: "artifact_slots", value: 1 }],
    },
    {
        id: "qi-middle-1-origin-recovery",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.MIDDLE,
        layer: 1,
        rewards: [
            { kind: "skill_slots", value: 4 },
            { kind: "skill_unlock", skillId: SKILL_IDS.ORIGIN_RECOVERY },
            {
                kind: "passive",
                id: "meridian-flow",
                name: "Kinh Mạch Lưu Chuyển",
                description: "+10% tốc độ tu luyện, +0.5 hồi MP/giây.",
                modifiers: [
                    { kind: "stat", stat: StatType.CULTIVATION_SPEED, type: StatModifierType.PERCENT, value: 0.1 },
                    { kind: "stat", stat: StatType.MP_REGEN, type: StatModifierType.FLAT, value: 0.5 },
                ],
            },
        ],
    },
    {
        id: "qi-late-1-fifth-slot",
        realm: CultivationRealm.QI_REFINING,
        stage: CultivationStage.LATE,
        layer: 1,
        rewards: [
            { kind: "skill_slots", value: 5 },
            { kind: "technique_slots", value: 3 },
            { kind: "skill_unlock", skillId: SKILL_IDS.WIND_BLADE },
        ],
    },
    {
        id: "foundation-entry",
        realm: CultivationRealm.FOUNDATION_ESTABLISHMENT,
        stage: CultivationStage.EARLY,
        layer: 1,
        rewards: [
            { kind: "skill_unlock", skillId: SKILL_IDS.CHAIN_SLASH },
            {
                kind: "passive",
                id: "foundation-body",
                name: "Trúc Cơ Đạo Thể",
                description: "+15% HP tối đa, +10% Công, +5% bạo kích.",
                modifiers: [
                    { kind: "stat", stat: StatType.MAX_HP, type: StatModifierType.PERCENT, value: 0.15 },
                    { kind: "stat", stat: StatType.ATTACK, type: StatModifierType.PERCENT, value: 0.1 },
                    { kind: "stat", stat: StatType.CRIT_RATE, type: StatModifierType.FLAT, value: 0.05 },
                ],
            },
        ],
    },
    {
        id: "golden-core-entry",
        realm: CultivationRealm.GOLDEN_CORE,
        stage: CultivationStage.EARLY,
        layer: 1,
        rewards: [
            { kind: "technique_slots", value: 4 },
            { kind: "skill_unlock", skillId: SKILL_IDS.AZURE_SWORD_RAIN },
            {
                kind: "passive",
                id: "golden-core",
                name: "Kim Đan Ngưng Tụ",
                description: "+15% Công, +20% MP, +10% hồi kỹ năng.",
                modifiers: [
                    { kind: "stat", stat: StatType.ATTACK, type: StatModifierType.PERCENT, value: 0.15 },
                    { kind: "stat", stat: StatType.MAX_MP, type: StatModifierType.PERCENT, value: 0.2 },
                    { kind: "stat", stat: StatType.SKILL_COOLDOWN_RECOVERY, type: StatModifierType.FLAT, value: 0.1 },
                ],
            },
        ],
    },
    {
        id: "nascent-soul-entry",
        realm: CultivationRealm.NASCENT_SOUL,
        stage: CultivationStage.EARLY,
        layer: 1,
        rewards: [],
    },
];

export const INITIAL_PROGRESSION_CAPACITY = {
    skillSlots: 1,
    techniqueSlots: 1,
    artifactSlots: 0,
} as const;
