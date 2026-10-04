import type { GameSaveData, SaveLoadResult } from "./SaveData";
import { CURRENT_SAVE_VERSION } from "./SaveVersion";

export type SaveMigrationResult = SaveLoadResult & {
    data?: GameSaveData;
};

export function migrateSaveData(rawData: unknown): SaveMigrationResult {
    if (!isRecord(rawData) || !Number.isInteger(rawData.version)) {
        return { success: false, reason: "Invalid save structure" };
    }

    const version = rawData.version as number;

    if (version > CURRENT_SAVE_VERSION) {
        return {
            success: false,
            reason: `Unsupported future save version: ${version}`,
            version,
        };
    }

    if (version === 1) {
        return migrateVersionOne(rawData);
    }

    if (version !== CURRENT_SAVE_VERSION) {
        return {
            success: false,
            reason: `No migration path for save version: ${version}`,
            version,
        };
    }

    return {
        success: true,
        version: CURRENT_SAVE_VERSION,
        data: rawData as unknown as GameSaveData,
    };
}

function migrateVersionOne(
    rawData: Record<string, unknown>,
): SaveMigrationResult {
    const inventory = isRecord(rawData.inventory)
        ? rawData.inventory
        : null;
    const instances = inventory && Array.isArray(inventory.equipmentInstances)
        ? inventory.equipmentInstances
        : null;

    if (!inventory || !instances) {
        return {
            success: false,
            reason: "Invalid version 1 equipment data",
            version: 1,
        };
    }

    const migratedInstances = instances.map((instance) => {
        if (!isRecord(instance)) {
            return instance;
        }

        return {
            ...instance,
            lockedStatIndices: [],
        };
    });
    const migrated = {
        ...rawData,
        version: CURRENT_SAVE_VERSION,
        inventory: {
            ...inventory,
            equipmentInstances: migratedInstances,
        },
    };

    return {
        success: true,
        version: CURRENT_SAVE_VERSION,
        data: migrated as unknown as GameSaveData,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
