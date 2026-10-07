import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import type { ArtifactDefinition } from "./Artifact";
import { ArtifactRarity } from "./ArtifactRarity";

export const ARTIFACT_DATA: ReadonlyArray<ArtifactDefinition> = [
    {
        id: "primordial_pearl",
        name: "Hỗn Nguyên Châu",
        description: "Bảo châu lưu chuyển hỗn nguyên chi khí.",
        rarity: ArtifactRarity.GREEN,
        unlockChapter: 1,
        baseModifiers: [
            {
                id: "primordial_pearl_max_hp",
                stat: StatType.MAX_HP,
                type: StatModifierType.FLAT,
                value: 30,
                source: "artifact:primordial_pearl",
            },
            {
                id: "primordial_pearl_mp_regen",
                stat: StatType.MP_REGEN,
                type: StatModifierType.FLAT,
                value: 0.5,
                source: "artifact:primordial_pearl",
            },
        ],
    },
    {
        id: "azure_spirit_sword_embryo",
        name: "Thanh Linh Kiếm Thai",
        description: "Kiếm thai nuôi dưỡng một tia kiếm ý thanh linh.",
        rarity: ArtifactRarity.BLUE,
        unlockChapter: 2,
        baseModifiers: [
            {
                id: "azure_spirit_sword_embryo_attack",
                stat: StatType.ATTACK,
                type: StatModifierType.FLAT,
                value: 10,
                source: "artifact:azure_spirit_sword_embryo",
            },
            {
                id: "azure_spirit_sword_embryo_crit_rate",
                stat: StatType.CRIT_RATE,
                type: StatModifierType.FLAT,
                value: 0.02,
                source: "artifact:azure_spirit_sword_embryo",
            },
        ],
    },
    {
        id: "nine_heavens_jade",
        name: "Cửu Thiên Ngọc",
        description: "Cổ ngọc hấp thu linh khí từ cửu thiên.",
        rarity: ArtifactRarity.PURPLE,
        unlockChapter: 3,
        baseModifiers: [
            {
                id: "nine_heavens_jade_cultivation_speed",
                stat: StatType.CULTIVATION_SPEED,
                type: StatModifierType.FLAT,
                value: 0.15,
                source: "artifact:nine_heavens_jade",
            },
            {
                id: "nine_heavens_jade_max_mp",
                stat: StatType.MAX_MP,
                type: StatModifierType.FLAT,
                value: 30,
                source: "artifact:nine_heavens_jade",
            },
        ],
    },
];
