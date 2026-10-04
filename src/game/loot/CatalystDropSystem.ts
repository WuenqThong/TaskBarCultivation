import type { CraftingCatalystDefinition } from "../crafting/CraftingCatalyst";
import type { BossCatalystDropTable } from "./catalystDropConfig";

export interface CatalystDrop {
    catalyst: CraftingCatalystDefinition;
    amount: number;
}

export class CatalystDropSystem {
    private definitions: Map<string, CraftingCatalystDefinition>;
    private tables: ReadonlyArray<BossCatalystDropTable>;
    private random: () => number;

    constructor(
        definitions: ReadonlyArray<CraftingCatalystDefinition>,
        tables: ReadonlyArray<BossCatalystDropTable>,
        random: () => number = Math.random,
    ) {
        this.definitions = new Map(
            definitions.map((definition) => [definition.id, definition]),
        );
        this.tables = tables;
        this.random = random;
    }

    public rollDrop(chapter: number, isBoss: boolean): CatalystDrop | null {
        if (!isBoss) {
            return null;
        }

        const table = this.tables.find(
            (candidate) =>
                chapter >= candidate.minChapter &&
                chapter <= candidate.maxChapter,
        );

        if (!table || this.random() >= table.dropChance) {
            return null;
        }

        const validEntries = table.entries.filter(
            (entry) => entry.weight > 0 && this.definitions.has(entry.catalystId),
        );
        const totalWeight = validEntries.reduce(
            (total, entry) => total + entry.weight,
            0,
        );

        if (totalWeight <= 0) {
            return null;
        }

        let roll = this.random() * totalWeight;

        for (const entry of validEntries) {
            roll -= entry.weight;

            if (roll < 0) {
                const catalyst = this.definitions.get(entry.catalystId);

                return catalyst ? { catalyst, amount: 1 } : null;
            }
        }

        return null;
    }
}
