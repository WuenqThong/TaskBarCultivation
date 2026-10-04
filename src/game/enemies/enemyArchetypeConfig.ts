import { EnemyArchetype } from "./EnemyArchetype";

export interface EnemyArchetypeConfig {
    hpMultiplier: number;
    attackMultiplier: number;
    moveSpeedMultiplier: number;
    attackIntervalMultiplier: number;
}

export const ENEMY_ARCHETYPE_CONFIG: Readonly<
    Record<EnemyArchetype, EnemyArchetypeConfig>
> = {
    [EnemyArchetype.BALANCED]: {
        hpMultiplier: 1,
        attackMultiplier: 1,
        moveSpeedMultiplier: 1,
        attackIntervalMultiplier: 1,
    },
    [EnemyArchetype.SWIFT]: {
        hpMultiplier: 0.7,
        attackMultiplier: 0.85,
        moveSpeedMultiplier: 1.45,
        attackIntervalMultiplier: 0.75,
    },
    [EnemyArchetype.TANK]: {
        hpMultiplier: 1.8,
        attackMultiplier: 0.85,
        moveSpeedMultiplier: 0.7,
        attackIntervalMultiplier: 1.2,
    },
    [EnemyArchetype.BERSERKER]: {
        hpMultiplier: 1,
        attackMultiplier: 1,
        moveSpeedMultiplier: 1,
        attackIntervalMultiplier: 1,
    },
};

export const BERSERKER_ENRAGE_HP_RATIO = 0.4;
export const BERSERKER_ENRAGE_ATTACK_MULTIPLIER = 1.6;
export const BERSERKER_ENRAGE_ATTACK_SPEED_MULTIPLIER = 1.35;
export const BERSERKER_ENRAGE_MOVE_SPEED_MULTIPLIER = 1.15;
