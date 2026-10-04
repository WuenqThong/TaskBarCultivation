import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import type { TechniqueDefinition } from "./Technique";

export const TECHNIQUE_DATA: ReadonlyArray<TechniqueDefinition> = [
    {
        id: "clear_heart_art",
        name: "Thanh Tâm Quyết",
        description: "Công pháp chú trọng sinh tồn và hồi phục khí huyết.",
        maxLevel: 20,
        milestones: [
            {
                requiredLevel: 1,
                description: "HP +10",
                modifiers: [
                    {
                        id: "clear_heart_level_1_max_hp",
                        stat: StatType.MAX_HP,
                        type: StatModifierType.FLAT,
                        value: 10,
                    },
                ],
            },
            {
                requiredLevel: 5,
                description: "Hồi HP +1/s",
                modifiers: [
                    {
                        id: "clear_heart_level_5_hp_regen",
                        stat: StatType.HP_REGEN,
                        type: StatModifierType.FLAT,
                        value: 1,
                    },
                ],
            },
            {
                requiredLevel: 10,
                description: "HP +10%",
                modifiers: [
                    {
                        id: "clear_heart_level_10_max_hp_percent",
                        stat: StatType.MAX_HP,
                        type: StatModifierType.PERCENT,
                        value: 0.1,
                    },
                ],
            },
            {
                requiredLevel: 20,
                description: "Hồi HP +2/s",
                modifiers: [
                    {
                        id: "clear_heart_level_20_hp_regen",
                        stat: StatType.HP_REGEN,
                        type: StatModifierType.FLAT,
                        value: 2,
                    },
                ],
            },
        ],
    },
    {
        id: "great_void_art",
        name: "Thái Hư Quyết",
        description: "Công pháp mở rộng linh lực và tăng tốc tu luyện.",
        maxLevel: 20,
        milestones: [
            {
                requiredLevel: 1,
                description: "MP +10",
                modifiers: [
                    {
                        id: "great_void_level_1_max_mp",
                        stat: StatType.MAX_MP,
                        type: StatModifierType.FLAT,
                        value: 10,
                    },
                ],
            },
            {
                requiredLevel: 5,
                description: "Hồi MP +1/s",
                modifiers: [
                    {
                        id: "great_void_level_5_mp_regen",
                        stat: StatType.MP_REGEN,
                        type: StatModifierType.FLAT,
                        value: 1,
                    },
                ],
            },
            {
                requiredLevel: 10,
                description: "Tốc độ tu luyện +10%",
                modifiers: [
                    {
                        id: "great_void_level_10_cultivation_speed",
                        stat: StatType.CULTIVATION_SPEED,
                        type: StatModifierType.FLAT,
                        value: 0.1,
                    },
                ],
            },
            {
                requiredLevel: 20,
                description: "MP +20%",
                modifiers: [
                    {
                        id: "great_void_level_20_max_mp_percent",
                        stat: StatType.MAX_MP,
                        type: StatModifierType.PERCENT,
                        value: 0.2,
                    },
                ],
            },
        ],
    },
    {
        id: "heavenly_sword_art",
        name: "Thiên Kiếm Quyết",
        description: "Công pháp kiếm đạo tăng công kích và bạo kích.",
        maxLevel: 20,
        milestones: [
            {
                requiredLevel: 1,
                description: "Công +5",
                modifiers: [
                    {
                        id: "heavenly_sword_level_1_attack",
                        stat: StatType.ATTACK,
                        type: StatModifierType.FLAT,
                        value: 5,
                    },
                ],
            },
            {
                requiredLevel: 5,
                description: "Bạo kích +2%",
                modifiers: [
                    {
                        id: "heavenly_sword_level_5_crit_rate",
                        stat: StatType.CRIT_RATE,
                        type: StatModifierType.FLAT,
                        value: 0.02,
                    },
                ],
            },
            {
                requiredLevel: 10,
                description: "ST Bạo +10%",
                modifiers: [
                    {
                        id: "heavenly_sword_level_10_crit_damage",
                        stat: StatType.CRIT_DAMAGE,
                        type: StatModifierType.FLAT,
                        value: 0.1,
                    },
                ],
            },
            {
                requiredLevel: 20,
                description: "Công +15%",
                modifiers: [
                    {
                        id: "heavenly_sword_level_20_attack_percent",
                        stat: StatType.ATTACK,
                        type: StatModifierType.PERCENT,
                        value: 0.15,
                    },
                ],
            },
        ],
    },
];
