import type { CultivationRealm } from "../cultivation/CultivationRealm";
import type { EquipmentSlot } from "./EquipmentSlot";

export interface EquipmentDefinition {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    requiredRealm: CultivationRealm;
}
