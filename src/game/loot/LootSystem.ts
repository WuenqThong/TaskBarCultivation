import type { ArtifactDropSystem } from "../artifacts/ArtifactDropSystem";
import type { ArtifactFragmentDrop } from "../artifacts/ArtifactDropSystem";
import type { EnemyDefinition } from "../enemies/EnemyDefinition";
import type { MaterialDefinition } from "../materials/Material";
import type { CatalystDrop } from "./CatalystDropSystem";
import type { CatalystDropSystem } from "./CatalystDropSystem";
import type { LootContext, LootTable } from "./LootTable";
import {
    BOSS_MATERIAL_MULTIPLIER,
    getChapterOneRewardBand,
    MATERIAL_DROP_MULTIPLIER,
    SPIRIT_STONE_DROP,
} from "./lootConfig";

export interface ItemDrop {
    item: MaterialDefinition;
    amount: number;
}

export interface LootResult {
    materials: ItemDrop[];
    artifactFragments: ArtifactFragmentDrop[];
    catalysts: CatalystDrop[];
    spiritStone: number;
}

export class LootSystem {
    private artifactDropSystem: ArtifactDropSystem;
    private catalystDropSystem: CatalystDropSystem;
    private materials: Map<string, MaterialDefinition>;
    private lootTables: Readonly<Record<string, LootTable>>;
    private random: () => number;

    constructor(
        artifactDropSystem: ArtifactDropSystem,
        catalystDropSystem: CatalystDropSystem,
        materials: ReadonlyArray<MaterialDefinition>,
        lootTables: Readonly<Record<string, LootTable>>,
        random: () => number = Math.random,
    ) {
        this.artifactDropSystem = artifactDropSystem;
        this.catalystDropSystem = catalystDropSystem;
        this.materials = new Map(
            materials.map((material) => [material.id, material]),
        );
        this.lootTables = lootTables;
        this.random = random;
    }

    public rollLoot(
        enemyDefinition: EnemyDefinition,
        context: LootContext,
    ): LootResult {
        const artifactDrop = this.artifactDropSystem.rollDrop(
            context.chapter,
            context.stage,
            context.isBoss,
        );
        const catalystDrop = this.catalystDropSystem.rollDrop(
            context.chapter,
            context.stage,
            context.isBoss,
        );
        const rewardBand = context.chapter === 1
            ? getChapterOneRewardBand(context.stage)
            : null;

        return {
            materials: this.rollMaterials(enemyDefinition, context),
            artifactFragments: artifactDrop ? [artifactDrop] : [],
            catalysts: catalystDrop ? [catalystDrop] : [],
            spiritStone: context.isBoss
                ? SPIRIT_STONE_DROP.boss
                : rewardBand?.spiritStonePerEnemy ?? 5,
        };
    }

    private rollMaterials(
        enemyDefinition: EnemyDefinition,
        context: LootContext,
    ): ItemDrop[] {
        const table = this.lootTables[enemyDefinition.lootTableId];

        if (!table) {
            return [];
        }

        const quantityMultiplier = MATERIAL_DROP_MULTIPLIER *
            (context.isBoss ? BOSS_MATERIAL_MULTIPLIER : 1);
        const chanceMultiplier = context.chapter === 1
            ? getChapterOneRewardBand(context.stage).materialChanceMultiplier
            : 1;
        const drops: ItemDrop[] = [];

        for (const entry of table.entries) {
            const effectiveChance = Math.min(
                1,
                Math.max(0, entry.chance * chanceMultiplier),
            );

            if (this.random() >= effectiveChance) {
                continue;
            }

            const material = this.materials.get(entry.itemId);

            if (!material) {
                continue;
            }

            const minQuantity = Math.max(0, Math.floor(entry.minQuantity));
            const maxQuantity = Math.max(
                minQuantity,
                Math.floor(entry.maxQuantity),
            );
            const quantityRange = maxQuantity - minQuantity + 1;
            const rolledQuantity = minQuantity +
                Math.floor(this.random() * quantityRange);
            const amount = Math.max(
                1,
                Math.floor(rolledQuantity * quantityMultiplier),
            );

            drops.push({ item: material, amount });
        }

        return drops;
    }
}
