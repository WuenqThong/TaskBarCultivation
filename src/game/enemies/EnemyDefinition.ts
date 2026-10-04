import type { EnemyArchetype } from "./EnemyArchetype";

export interface ChapterAvailability {
    minChapter: number;
    maxChapter: number;
}

export interface EnemyDefinition {
    id: string;
    name: string;
    archetype: EnemyArchetype;
    baseHp: number;
    baseAttack: number;
    baseMoveSpeed: number;
    baseAttackInterval: number;
    attackRange: number;
    isBoss: boolean;
    lootTableId: string;
    chapterAvailability: ChapterAvailability;
}

export interface ChapterEnemyPool {
    chapter: number;
    enemies: ReadonlyArray<EnemyDefinition>;
    boss: EnemyDefinition;
}
