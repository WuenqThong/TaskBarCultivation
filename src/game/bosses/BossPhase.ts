export interface BossSummonConfig {
    enemyId: string;
    count: number;
}

export interface BossPhaseDefinition {
    id: string;
    hpThreshold: number;
    attackMultiplier?: number;
    moveSpeedMultiplier?: number;
    attackSpeedMultiplier?: number;
    enabledSkillIds?: ReadonlyArray<string>;
    summonOnEnter?: BossSummonConfig;
}
