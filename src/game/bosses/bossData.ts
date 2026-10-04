import { ENEMY_DATA } from "../enemies/enemyData";
import type { BossDefinition } from "./BossDefinition";
import { BossSkillType } from "./BossSkill";

export const BOSS_SKILL_IDS = {
    RAGE_CLAW: "rage_claw",
    WOLF_KING_ROAR: "wolf_king_roar",
} as const;

export const BOSS_DATA = {
    GREEN_WIND_WOLF_KING: {
        enemy: ENEMY_DATA.GREEN_WIND_WOLF_KING,
        minimumSkillGap: 1,
        phases: [
            {
                id: "phase_1",
                hpThreshold: 1,
                attackMultiplier: 1,
                moveSpeedMultiplier: 1,
                attackSpeedMultiplier: 1,
                enabledSkillIds: [BOSS_SKILL_IDS.RAGE_CLAW],
            },
            {
                id: "phase_2",
                hpThreshold: 0.7,
                attackMultiplier: 1.2,
                moveSpeedMultiplier: 1.1,
                attackSpeedMultiplier: 1.15,
                enabledSkillIds: [
                    BOSS_SKILL_IDS.RAGE_CLAW,
                    BOSS_SKILL_IDS.WOLF_KING_ROAR,
                ],
            },
            {
                id: "phase_3",
                hpThreshold: 0.35,
                attackMultiplier: 1.4,
                moveSpeedMultiplier: 1.15,
                attackSpeedMultiplier: 1.35,
                enabledSkillIds: [
                    BOSS_SKILL_IDS.RAGE_CLAW,
                    BOSS_SKILL_IDS.WOLF_KING_ROAR,
                ],
                summonOnEnter: {
                    enemyId: ENEMY_DATA.GREEN_WIND_WOLF.id,
                    count: 2,
                },
            },
        ],
        skills: [
            {
                id: BOSS_SKILL_IDS.RAGE_CLAW,
                name: "Nộ Trảo",
                type: BossSkillType.HEAVY_ATTACK,
                cooldown: 6,
                initialCooldown: 3,
                damageMultiplier: 1.8,
                enabledFromPhase: "phase_1",
                priority: 50,
            },
            {
                id: BOSS_SKILL_IDS.WOLF_KING_ROAR,
                name: "Lang Vương Hống",
                type: BossSkillType.SELF_BUFF,
                cooldown: 10,
                initialCooldown: 3,
                enabledFromPhase: "phase_2",
                priority: 80,
                buffAttackMultiplier: 1.2,
                buffDuration: 5,
            },
        ],
    },
} as const satisfies Record<string, BossDefinition>;

const BOSS_BY_CHAPTER: ReadonlyMap<number, BossDefinition> = new Map([
    [1, BOSS_DATA.GREEN_WIND_WOLF_KING],
]);

export function getBossForChapter(chapter: number): BossDefinition {
    const exactBoss = BOSS_BY_CHAPTER.get(chapter);

    if (exactBoss) {
        return exactBoss;
    }

    const configuredChapters = [...BOSS_BY_CHAPTER.keys()]
        .filter((configuredChapter) => configuredChapter <= chapter)
        .sort((left, right) => right - left);
    const fallbackChapter = configuredChapters[0] ?? 1;
    const fallbackBoss = BOSS_BY_CHAPTER.get(fallbackChapter) ??
        BOSS_DATA.GREEN_WIND_WOLF_KING;

    console.warn(
        `Chưa có Boss cho Chương ${chapter}; dùng Boss Chương ${fallbackChapter}.`,
    );

    return fallbackBoss;
}
