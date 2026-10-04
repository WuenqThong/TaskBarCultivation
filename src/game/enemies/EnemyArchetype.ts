export enum EnemyArchetype {
    BALANCED = "balanced",
    SWIFT = "swift",
    TANK = "tank",
    BERSERKER = "berserker",
}

export const ENEMY_ARCHETYPE_LABELS: Readonly<Record<EnemyArchetype, string>> = {
    [EnemyArchetype.BALANCED]: "Cân Bằng",
    [EnemyArchetype.SWIFT]: "Nhanh Nhẹn",
    [EnemyArchetype.TANK]: "Cứng Cáp",
    [EnemyArchetype.BERSERKER]: "Cuồng Bạo",
};
