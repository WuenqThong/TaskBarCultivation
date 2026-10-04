import {
    StatModifierType,
} from "./StatModifier";
import type { StatModifier } from "./StatModifier";
import { StatType } from "./StatType";

const DEFAULT_BASE_STATS: ReadonlyArray<readonly [StatType, number]> = [
    [StatType.MAX_HP, 100],
    [StatType.MAX_MP, 50],
    [StatType.ATTACK, 10],
    [StatType.DEFENSE, 0],
    [StatType.CRIT_RATE, 0.05],
    [StatType.CRIT_DAMAGE, 1.5],
    [StatType.CULTIVATION_SPEED, 1],
    [StatType.SKILL_COOLDOWN_RECOVERY, 0],
    [StatType.HP_REGEN, 0],
    [StatType.MP_REGEN, 0],
];

export class PlayerStatSystem {
    private baseStats: Map<StatType, number>;
    private modifiers: Map<string, StatModifier>;

    constructor() {
        this.baseStats = new Map<StatType, number>(DEFAULT_BASE_STATS);
        this.modifiers = new Map<string, StatModifier>();
    }

    public getBaseStat(stat: StatType): number {
        return this.baseStats.get(stat) ?? 0;
    }

    public setBaseStat(
        stat: StatType,
        value: number,
    ): void {
        this.baseStats.set(stat, value);
    }

    public getFinalStat(stat: StatType): number {
        let totalFlat = 0;
        let totalPercent = 0;

        for (const modifier of this.modifiers.values()) {
            if (modifier.stat !== stat) {
                continue;
            }

            if (modifier.type === StatModifierType.FLAT) {
                totalFlat += modifier.value;
            } else {
                totalPercent += modifier.value;
            }
        }

        return (
            (this.getBaseStat(stat) + totalFlat) *
            (1 + totalPercent)
        );
    }

    public addModifier(modifier: StatModifier): void {
        this.modifiers.set(modifier.id, { ...modifier });
    }

    public removeModifier(modifierId: string): boolean {
        return this.modifiers.delete(modifierId);
    }

    public hasModifier(modifierId: string): boolean {
        return this.modifiers.has(modifierId);
    }

    public clearModifiers(): void {
        this.modifiers.clear();
    }

    public getModifiers(): StatModifier[] {
        return Array.from(
            this.modifiers.values(),
            (modifier) => ({ ...modifier }),
        );
    }

    public getModifiersForStat(stat: StatType): StatModifier[] {
        return this.getModifiers().filter(
            (modifier) => modifier.stat === stat,
        );
    }
}
