import type { EquipmentDefinition } from "./Equipment";
import {
    createEquipmentInstance,
} from "./EquipmentInstance";
import type { EquipmentInstance } from "./EquipmentInstance";
import type { EquipmentRarity } from "./EquipmentRarity";
import type { EquipmentStatRoller } from "./EquipmentStatRoller";

export class EquipmentFactory {
    private statRoller: EquipmentStatRoller;

    constructor(statRoller: EquipmentStatRoller) {
        this.statRoller = statRoller;
    }

    public create(
        definition: EquipmentDefinition,
        rarity: EquipmentRarity,
    ): EquipmentInstance {
        return createEquipmentInstance(
            definition,
            rarity,
            this.statRoller,
        );
    }
}
