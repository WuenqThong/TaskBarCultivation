import type { Player } from "../entities/Player";
import { StatModifierType, type StatModifier } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import {
    BASE_STAT_ROLL_RANGES,
    RARITY_STAT_MULTIPLIER,
    REALM_STAT_MULTIPLIER,
    SLOT_STAT_POOLS,
} from "./equipmentConfig";
import type { EquipmentInstance } from "./EquipmentInstance";
import type { EquipmentManager } from "./EquipmentManager";

export type EquipmentComparisonGrade = "upgrade" | "sidegrade" | "downgrade" | "equipped";

export interface EquipmentStatDelta {
    stat: StatType;
    current: number;
    projected: number;
    delta: number;
}

export interface EquipmentBuildScores {
    offense: number;
    defense: number;
    utility: number;
}

export interface EquipmentComparison {
    candidate: EquipmentInstance;
    current: EquipmentInstance | null;
    grade: EquipmentComparisonGrade;
    currentEstimatedDps: number;
    projectedEstimatedDps: number;
    dpsDelta: number;
    dpsDeltaPercent: number;
    statDeltas: EquipmentStatDelta[];
    currentScores: EquipmentBuildScores;
    projectedScores: EquipmentBuildScores;
    averageRollQuality: number;
    buildTags: string[];
    affixPool: ReadonlyArray<StatType>;
}

const ALL_STATS: ReadonlyArray<StatType> = Object.values(StatType);

const OFFENSE_STATS = new Set<StatType>([
    StatType.ATTACK,
    StatType.CRIT_RATE,
    StatType.CRIT_DAMAGE,
]);

const DEFENSE_STATS = new Set<StatType>([
    StatType.MAX_HP,
    StatType.DEFENSE,
    StatType.HP_REGEN,
]);

const UTILITY_STATS = new Set<StatType>([
    StatType.MAX_MP,
    StatType.MP_REGEN,
    StatType.CULTIVATION_SPEED,
    StatType.SKILL_COOLDOWN_RECOVERY,
]);

export class EquipmentComparisonService {
    public compare(
        player: Player,
        equipmentManager: EquipmentManager,
        candidate: EquipmentInstance,
    ): EquipmentComparison {
        const current = equipmentManager.getEquippedItem(candidate.definition.slot);
        const currentStats = this.snapshotStats(player);
        const projectedStats = current?.instanceId === candidate.instanceId
            ? currentStats
            : this.projectStats(player, current, candidate);
        const currentEstimatedDps = this.estimateDps(currentStats);
        const projectedEstimatedDps = this.estimateDps(projectedStats);
        const dpsDelta = projectedEstimatedDps - currentEstimatedDps;
        const dpsDeltaPercent = currentEstimatedDps > 0
            ? dpsDelta / currentEstimatedDps
            : 0;
        const statDeltas = ALL_STATS.map((stat) => ({
            stat,
            current: currentStats.get(stat) ?? 0,
            projected: projectedStats.get(stat) ?? 0,
            delta: (projectedStats.get(stat) ?? 0) - (currentStats.get(stat) ?? 0),
        })).filter((entry) => Math.abs(entry.delta) > 0.000001);
        const currentScores = this.calculateBuildScores(currentStats);
        const projectedScores = this.calculateBuildScores(projectedStats);

        return {
            candidate,
            current,
            grade: this.resolveGrade(
                current,
                candidate,
                currentScores,
                projectedScores,
                dpsDeltaPercent,
            ),
            currentEstimatedDps,
            projectedEstimatedDps,
            dpsDelta,
            dpsDeltaPercent,
            statDeltas,
            currentScores,
            projectedScores,
            averageRollQuality: this.getAverageRollQuality(candidate),
            buildTags: this.getBuildTags(candidate),
            affixPool: SLOT_STAT_POOLS[candidate.definition.slot],
        };
    }

    private snapshotStats(player: Player): Map<StatType, number> {
        const statSystem = player.getStatSystem();

        return new Map(ALL_STATS.map((stat) => [
            stat,
            statSystem.getFinalStat(stat),
        ]));
    }

    private projectStats(
        player: Player,
        current: EquipmentInstance | null,
        candidate: EquipmentInstance,
    ): Map<StatType, number> {
        const statSystem = player.getStatSystem();
        const currentSource = current ? `equipment:${current.instanceId}` : null;
        const remainingModifiers = statSystem.getModifiers().filter(
            (modifier) => modifier.source !== currentSource,
        );
        const candidateModifiers = candidate.rolledStats.map((modifier) => ({
            ...modifier,
            source: `equipment:${candidate.instanceId}`,
        }));
        const allModifiers = [...remainingModifiers, ...candidateModifiers];

        return new Map(ALL_STATS.map((stat) => [
            stat,
            this.resolveFinalStat(statSystem.getBaseStat(stat), stat, allModifiers),
        ]));
    }

    private resolveFinalStat(
        base: number,
        stat: StatType,
        modifiers: ReadonlyArray<StatModifier>,
    ): number {
        let flat = 0;
        let percent = 0;

        for (const modifier of modifiers) {
            if (modifier.stat !== stat) {
                continue;
            }

            if (modifier.type === StatModifierType.FLAT) {
                flat += modifier.value;
            } else {
                percent += modifier.value;
            }
        }

        return (base + flat) * (1 + percent);
    }

    private estimateDps(stats: ReadonlyMap<StatType, number>): number {
        const attack = Math.max(0, stats.get(StatType.ATTACK) ?? 0);
        const critRate = Math.min(1, Math.max(0, stats.get(StatType.CRIT_RATE) ?? 0));
        const critDamage = Math.max(1, stats.get(StatType.CRIT_DAMAGE) ?? 1);

        // Normalized to one basic attack per second so comparison follows Player.calculateDamage.
        return attack * (1 + critRate * (critDamage - 1));
    }

    private calculateBuildScores(
        stats: ReadonlyMap<StatType, number>,
    ): EquipmentBuildScores {
        return {
            offense: this.estimateDps(stats),
            defense:
                (stats.get(StatType.MAX_HP) ?? 0) +
                (stats.get(StatType.DEFENSE) ?? 0) * 8 +
                (stats.get(StatType.HP_REGEN) ?? 0) * 12,
            utility:
                (stats.get(StatType.MAX_MP) ?? 0) * 0.5 +
                (stats.get(StatType.MP_REGEN) ?? 0) * 15 +
                (stats.get(StatType.CULTIVATION_SPEED) ?? 0) * 100 +
                (stats.get(StatType.SKILL_COOLDOWN_RECOVERY) ?? 0) * 120,
        };
    }

    private resolveGrade(
        current: EquipmentInstance | null,
        candidate: EquipmentInstance,
        currentScores: EquipmentBuildScores,
        projectedScores: EquipmentBuildScores,
        dpsDeltaPercent: number,
    ): EquipmentComparisonGrade {
        if (current?.instanceId === candidate.instanceId) {
            return "equipped";
        }

        if (!current) {
            return "upgrade";
        }

        const offenseDelta = dpsDeltaPercent;
        const defenseDelta = this.relativeDelta(currentScores.defense, projectedScores.defense);
        const utilityDelta = this.relativeDelta(currentScores.utility, projectedScores.utility);
        const bestDelta = Math.max(offenseDelta, defenseDelta, utilityDelta);
        const worstDelta = Math.min(offenseDelta, defenseDelta, utilityDelta);

        if (bestDelta >= 0.03 && worstDelta > -0.08) {
            return "upgrade";
        }
        if (worstDelta <= -0.08 && bestDelta < 0.03) {
            return "downgrade";
        }
        return "sidegrade";
    }

    private relativeDelta(current: number, projected: number): number {
        if (Math.abs(current) < 0.000001) {
            return projected > current ? 1 : projected < current ? -1 : 0;
        }
        return (projected - current) / Math.abs(current);
    }

    private getAverageRollQuality(equipment: EquipmentInstance): number {
        if (equipment.rolledStats.length === 0) {
            return 0;
        }

        const multiplier =
            RARITY_STAT_MULTIPLIER[equipment.rarity] *
            REALM_STAT_MULTIPLIER[equipment.definition.requiredRealm];
        const qualitySum = equipment.rolledStats.reduce((sum, modifier) => {
            const range = BASE_STAT_ROLL_RANGES[modifier.stat];
            if (!range) {
                return sum;
            }
            const min = range.min * multiplier;
            const max = range.max * multiplier;
            const spread = max - min;
            const quality = spread <= 0 ? 1 : (modifier.value - min) / spread;
            return sum + Math.min(1, Math.max(0, quality));
        }, 0);

        return qualitySum / equipment.rolledStats.length;
    }

    private getBuildTags(equipment: EquipmentInstance): string[] {
        const stats = new Set(equipment.rolledStats.map((modifier) => modifier.stat));
        const tags: string[] = [];
        if ([...stats].some((stat) => OFFENSE_STATS.has(stat))) tags.push("Công");
        if ([...stats].some((stat) => DEFENSE_STATS.has(stat))) tags.push("Thủ");
        if ([...stats].some((stat) => UTILITY_STATS.has(stat))) tags.push("Tiện ích");
        return tags;
    }
}
