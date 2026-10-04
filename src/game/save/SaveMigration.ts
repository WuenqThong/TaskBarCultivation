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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
