import { CultivationRealm } from "../cultivation/CultivationRealm";
import type { EquipmentDefinition } from "./Equipment";
import { EquipmentSlot } from "./EquipmentSlot";

export const EQUIPMENT_DATA: Readonly<
    Record<string, EquipmentDefinition>
> = {
    IRON_SWORD: {
        id: "iron_sword",
        name: "Thiết Kiếm",
        description: "Thanh kiếm sắt cơ bản dành cho tu sĩ nhập môn.",
        slot: EquipmentSlot.WEAPON,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    AZURE_CLOUD_SWORD: {
        id: "azure_cloud_sword",
        name: "Thanh Vân Kiếm",
        description: "Linh kiếm mang khí tức Thanh Vân.",
        slot: EquipmentSlot.WEAPON,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    FROST_MOON_SWORD: {
        id: "frost_moon_sword",
        name: "Hàn Nguyệt Kiếm",
        description: "Linh kiếm lạnh như ánh trăng mùa đông.",
        slot: EquipmentSlot.WEAPON,
        requiredRealm: CultivationRealm.FOUNDATION_ESTABLISHMENT,
    },
    CLOTH_ROBE: {
        id: "cloth_robe",
        name: "Bố Y",
        description: "Áo vải đơn sơ của tu sĩ nhập môn.",
        slot: EquipmentSlot.ARMOR,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    AZURE_CLOUD_ROBE: {
        id: "azure_cloud_robe",
        name: "Thanh Vân Pháp Bào",
        description: "Pháp bào được dệt bằng linh ti Thanh Vân.",
        slot: EquipmentSlot.ARMOR,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    MYSTIC_ICE_ROBE: {
        id: "mystic_ice_robe",
        name: "Huyền Băng Pháp Bào",
        description: "Pháp bào ngưng tụ huyền băng hộ thể.",
        slot: EquipmentSlot.ARMOR,
        requiredRealm: CultivationRealm.FOUNDATION_ESTABLISHMENT,
    },
    WOOD_SPIRIT_BRACELET: {
        id: "wood_spirit_bracelet",
        name: "Mộc Linh Hoàn",
        description: "Vòng tay bằng linh mộc giúp tích trữ linh lực.",
        slot: EquipmentSlot.BRACELET,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    AZURE_SPIRIT_BRACELET: {
        id: "azure_spirit_bracelet",
        name: "Thanh Linh Hoàn",
        description: "Vòng tay điều hòa linh lực.",
        slot: EquipmentSlot.BRACELET,
        requiredRealm: CultivationRealm.QI_REFINING,
    },
    SPIRIT_GATHERING_BRACELET: {
        id: "spirit_gathering_bracelet",
        name: "Tụ Linh Hoàn",
        description: "Vòng tay hội tụ linh khí quanh người sử dụng.",
        slot: EquipmentSlot.BRACELET,
        requiredRealm: CultivationRealm.FOUNDATION_ESTABLISHMENT,
    },
};
