export enum EquipmentSlot {
    WEAPON = "weapon",
    ARMOR = "armor",
    BRACELET = "bracelet",
}

export const EQUIPMENT_SLOT_LABELS: Readonly<
    Record<EquipmentSlot, string>
> = {
    [EquipmentSlot.WEAPON]: "Vũ Khí",
    [EquipmentSlot.ARMOR]: "Áo Giáp",
    [EquipmentSlot.BRACELET]: "Vòng Tay",
};
