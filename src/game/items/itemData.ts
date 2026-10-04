import {
    ItemRarity,
    ItemType,
} from "./Item";
import type { ItemDefinition } from "./Item";
import { MATERIAL_DATA } from "../materials/materialData";

export const ITEM_DATA = {
    SPIRIT_HERB: MATERIAL_DATA.SPIRIT_HERB,
    HEALING_PILL: {
        id: "healing_pill",
        name: "Hồi Huyết Đan",
        description: "Đan dược dùng để hồi phục khí huyết.",
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        stackable: true,
        maxStack: 20,
    },
    CLEAR_HEART_TECHNIQUE: {
        id: "clear_heart_technique",
        name: "Thanh Tâm Quyết",
        description: "Công pháp giúp tâm cảnh thanh tịnh.",
        type: ItemType.TECHNIQUE,
        rarity: ItemRarity.RARE,
        stackable: false,
        maxStack: 1,
    },
    MYSTIC_JADE: {
        id: "mystic_jade",
        name: "Huyền Ngọc",
        description: "Ngọc thạch hiếm dùng trong luyện khí.",
        type: ItemType.MATERIAL,
        rarity: ItemRarity.RARE,
        stackable: true,
        maxStack: 99,
    },
} as const satisfies Record<string, ItemDefinition>;
