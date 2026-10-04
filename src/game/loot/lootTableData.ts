import { MATERIAL_DATA } from "../materials/materialData";
import type { LootTable } from "./LootTable";

export const LOOT_TABLE_DATA: Readonly<Record<string, LootTable>> = {
    green_wind_wolf_loot: {
        id: "green_wind_wolf_loot",
        entries: [
            { itemId: MATERIAL_DATA.WOLF_FANG.id, chance: 0.7, minQuantity: 1, maxQuantity: 2 },
            { itemId: MATERIAL_DATA.MONSTER_CORE.id, chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        ],
    },
    fire_spirit_snake_loot: {
        id: "fire_spirit_snake_loot",
        entries: [
            { itemId: MATERIAL_DATA.BLOOD_SPIRIT_FLOWER.id, chance: 0.55, minQuantity: 1, maxQuantity: 2 },
            { itemId: MATERIAL_DATA.MONSTER_CORE.id, chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        ],
    },
    iron_shell_beetle_loot: {
        id: "iron_shell_beetle_loot",
        entries: [
            { itemId: MATERIAL_DATA.MYSTIC_IRON.id, chance: 0.6, minQuantity: 1, maxQuantity: 3 },
            { itemId: MATERIAL_DATA.SPIRIT_ESSENCE.id, chance: 0.15, minQuantity: 1, maxQuantity: 1 },
        ],
    },
    blood_frenzy_wolf_loot: {
        id: "blood_frenzy_wolf_loot",
        entries: [
            { itemId: MATERIAL_DATA.WOLF_FANG.id, chance: 0.7, minQuantity: 1, maxQuantity: 2 },
            { itemId: MATERIAL_DATA.MONSTER_CORE.id, chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        ],
    },
    green_wind_wolf_king_loot: {
        id: "green_wind_wolf_king_loot",
        entries: [
            { itemId: MATERIAL_DATA.WOLF_FANG.id, chance: 1, minQuantity: 5, maxQuantity: 10 },
            { itemId: MATERIAL_DATA.MONSTER_CORE.id, chance: 1, minQuantity: 2, maxQuantity: 5 },
            { itemId: MATERIAL_DATA.MONSTER_BLOOD_ESSENCE.id, chance: 0.6, minQuantity: 1, maxQuantity: 2 },
            { itemId: MATERIAL_DATA.MONSTER_KING_CORE.id, chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        ],
    },
};
