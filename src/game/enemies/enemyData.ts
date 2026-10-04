import type {
    ChapterEnemyPool,
    EnemyDefinition,
} from "./EnemyDefinition";
import { EnemyArchetype } from "./EnemyArchetype";

const CHAPTER_ONE_AVAILABILITY = {
    minChapter: 1,
    maxChapter: Number.POSITIVE_INFINITY,
} as const;

export const ENEMY_DATA = {
    GREEN_WIND_WOLF: {
        id: "green_wind_wolf",
        name: "Thanh Phong Lang",
        archetype: EnemyArchetype.SWIFT,
        baseHp: 30,
        baseAttack: 4,
        baseMoveSpeed: 1.5,
        baseAttackInterval: 1.2,
        attackRange: 170,
        isBoss: false,
        lootTableId: "green_wind_wolf_loot",
        chapterAvailability: CHAPTER_ONE_AVAILABILITY,
    },
    FIRE_SPIRIT_SNAKE: {
        id: "fire_spirit_snake",
        name: "Hỏa Linh Xà",
        archetype: EnemyArchetype.BALANCED,
        baseHp: 30,
        baseAttack: 4,
        baseMoveSpeed: 1.5,
        baseAttackInterval: 1.2,
        attackRange: 170,
        isBoss: false,
        lootTableId: "fire_spirit_snake_loot",
        chapterAvailability: CHAPTER_ONE_AVAILABILITY,
    },
    IRON_SHELL_BEETLE: {
        id: "iron_shell_beetle",
        name: "Thiết Giáp Trùng",
        archetype: EnemyArchetype.TANK,
        baseHp: 30,
        baseAttack: 4,
        baseMoveSpeed: 1.5,
        baseAttackInterval: 1.2,
        attackRange: 170,
        isBoss: false,
        lootTableId: "iron_shell_beetle_loot",
        chapterAvailability: CHAPTER_ONE_AVAILABILITY,
    },
    BLOOD_FRENZY_WOLF: {
        id: "blood_frenzy_wolf",
        name: "Cuồng Huyết Lang",
        archetype: EnemyArchetype.BERSERKER,
        baseHp: 30,
        baseAttack: 4,
        baseMoveSpeed: 1.5,
        baseAttackInterval: 1.2,
        attackRange: 170,
        isBoss: false,
        lootTableId: "blood_frenzy_wolf_loot",
        chapterAvailability: CHAPTER_ONE_AVAILABILITY,
    },
    GREEN_WIND_WOLF_KING: {
        id: "green_wind_wolf_king",
        name: "Thanh Phong Lang Vương",
        archetype: EnemyArchetype.BALANCED,
        baseHp: 1000,
        baseAttack: 30,
        baseMoveSpeed: 1,
        baseAttackInterval: 1.2,
        attackRange: 170,
        isBoss: true,
        lootTableId: "green_wind_wolf_king_loot",
        chapterAvailability: CHAPTER_ONE_AVAILABILITY,
    },
} as const satisfies Record<string, EnemyDefinition>;

export const CHAPTER_ENEMY_POOLS: ReadonlyArray<ChapterEnemyPool> = [
    {
        chapter: 1,
        enemies: [
            ENEMY_DATA.GREEN_WIND_WOLF,
            ENEMY_DATA.FIRE_SPIRIT_SNAKE,
            ENEMY_DATA.IRON_SHELL_BEETLE,
            ENEMY_DATA.BLOOD_FRENZY_WOLF,
        ],
        boss: ENEMY_DATA.GREEN_WIND_WOLF_KING,
    },
];

export function getChapterEnemyPool(chapter: number): ChapterEnemyPool {
    const exactPool = CHAPTER_ENEMY_POOLS.find(
        (pool) => pool.chapter === chapter,
    );

    return exactPool ?? CHAPTER_ENEMY_POOLS[CHAPTER_ENEMY_POOLS.length - 1];
}

export function getEnemyDefinitionById(
    enemyId: string,
): EnemyDefinition | undefined {
    return Object.values(ENEMY_DATA).find(
        (definition) => definition.id === enemyId,
    );
}
