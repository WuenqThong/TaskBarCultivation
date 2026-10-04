import { ItemRarity, ItemType } from "../items/Item";
import {
    CraftingCatalystType,
} from "./CraftingCatalyst";
import type { CraftingCatalystDefinition } from "./CraftingCatalyst";

export const CATALYST_DATA = {
    LOW_GRADE_FORTUNE_STONE: {
        id: "low_grade_fortune_stone",
        name: "Hạ Phẩm Tụ Vận Thạch",
        description: "Tăng nhẹ vận khí khi Luyện Khí.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.UNCOMMON,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.EQUIPMENT,
        rarityLuckBonus: 10,
    },
    MID_GRADE_FORTUNE_STONE: {
        id: "mid_grade_fortune_stone",
        name: "Trung Phẩm Tụ Vận Thạch",
        description: "Tăng đáng kể vận khí khi Luyện Khí.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.RARE,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.EQUIPMENT,
        rarityLuckBonus: 25,
    },
    HIGH_GRADE_FORTUNE_STONE: {
        id: "high_grade_fortune_stone",
        name: "Thượng Phẩm Tụ Vận Thạch",
        description: "Tăng mạnh vận khí khi Luyện Khí.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.EPIC,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.EQUIPMENT,
        rarityLuckBonus: 50,
    },
    LOW_GRADE_ALCHEMY_FLAME: {
        id: "low_grade_alchemy_flame",
        name: "Hạ Phẩm Đan Hỏa Tinh",
        description: "Tăng nhẹ vận khí khi Luyện Đan.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.UNCOMMON,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.ALCHEMY,
        rarityLuckBonus: 10,
    },
    MID_GRADE_ALCHEMY_FLAME: {
        id: "mid_grade_alchemy_flame",
        name: "Trung Phẩm Đan Hỏa Tinh",
        description: "Tăng đáng kể vận khí khi Luyện Đan.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.RARE,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.ALCHEMY,
        rarityLuckBonus: 25,
    },
    HIGH_GRADE_ALCHEMY_FLAME: {
        id: "high_grade_alchemy_flame",
        name: "Thượng Phẩm Đan Hỏa Tinh",
        description: "Tăng mạnh vận khí khi Luyện Đan.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.EPIC,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.ALCHEMY,
        rarityLuckBonus: 50,
    },
    HEAVENLY_FORTUNE_JADE: {
        id: "heavenly_fortune_jade",
        name: "Thiên Vận Ngọc",
        description: "Kỳ ngọc cực hiếm tăng vận khí cho mọi loại chế tạo.",
        type: ItemType.CATALYST,
        rarity: ItemRarity.LEGENDARY,
        stackable: true,
        maxStack: 99,
        catalystType: CraftingCatalystType.UNIVERSAL,
        rarityLuckBonus: 100,
    },
} as const satisfies Record<string, CraftingCatalystDefinition>;

export const CATALYST_DEFINITIONS: ReadonlyArray<
    CraftingCatalystDefinition
> = Object.values(CATALYST_DATA);
