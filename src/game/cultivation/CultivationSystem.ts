import { CultivationRealm } from "./CultivationRealm";
import { CultivationStage } from "./CultivationStage";
import {
    BASE_CULTIVATION_PER_SECOND,
    CULTIVATION_LAYER_GROWTH,
    CULTIVATION_LAYERS_PER_STAGE,
    CULTIVATION_REALM_ORDER,
    CULTIVATION_STAGE_MULTIPLIER,
    CULTIVATION_STAGE_ORDER,
    REALM_BASE_CULTIVATION,
} from "./cultivationConfig";

export class CultivationSystem {
    private currentRealm: CultivationRealm;
    private currentStage: CultivationStage;
    private layer: number;
    private cultivation: number;
    private requiredCultivation: number;
    private baseCultivationPerSecond: number;
    private getCultivationSpeed: () => number;
    private version: number;

    constructor(getCultivationSpeed: () => number) {
        this.currentRealm = CultivationRealm.QI_REFINING;
        this.currentStage = CultivationStage.EARLY;
        this.layer = 1;
        this.cultivation = 0;
        this.baseCultivationPerSecond = BASE_CULTIVATION_PER_SECOND;
        this.getCultivationSpeed = getCultivationSpeed;
        this.requiredCultivation = this.calculateRequiredCultivation();
        this.version = 0;
    }

    public getRealm(): CultivationRealm {
        return this.currentRealm;
    }

    public getStage(): CultivationStage {
        return this.currentStage;
    }

    public getLayer(): number {
        return this.layer;
    }

    public getCultivation(): number {
        return this.cultivation;
    }

    public getRequiredCultivation(): number {
        return this.requiredCultivation;
    }

    public getCultivationPerSecond(): number {
        return (
            this.baseCultivationPerSecond *
            Math.max(0, this.getCultivationSpeed())
        );
    }

    public canBreakthrough(): boolean {
        return (
            !this.isMaxCultivation() &&
            this.cultivation >= this.requiredCultivation
        );
    }

    public breakthrough(): boolean {
        if (!this.canBreakthrough()) {
            return false;
        }

        if (this.layer < CULTIVATION_LAYERS_PER_STAGE) {
            this.layer += 1;
        } else {
            const stageIndex = CULTIVATION_STAGE_ORDER.indexOf(
                this.currentStage,
            );
            const nextStage = CULTIVATION_STAGE_ORDER[stageIndex + 1];

            if (nextStage) {
                this.currentStage = nextStage;
                this.layer = 1;
            } else {
                const realmIndex = CULTIVATION_REALM_ORDER.indexOf(
                    this.currentRealm,
                );
                const nextRealm = CULTIVATION_REALM_ORDER[realmIndex + 1];

                if (!nextRealm) {
                    return false;
                }

                this.currentRealm = nextRealm;
                this.currentStage = CULTIVATION_STAGE_ORDER[0];
                this.layer = 1;
            }
        }

        this.cultivation = 0;
        this.requiredCultivation = this.calculateRequiredCultivation();
        this.version += 1;

        return true;
    }

    public update(deltaSeconds: number): void {
        if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
            return;
        }

        const previousCultivation = this.cultivation;

        this.cultivation = Math.min(
            this.cultivation +
                this.getCultivationPerSecond() * deltaSeconds,
            this.requiredCultivation,
        );

        if (this.cultivation !== previousCultivation) {
            this.version += 1;
        }
    }

    public isMaxCultivation(): boolean {
        return (
            this.currentRealm ===
                CULTIVATION_REALM_ORDER[
                    CULTIVATION_REALM_ORDER.length - 1
                ] &&
            this.currentStage ===
                CULTIVATION_STAGE_ORDER[
                    CULTIVATION_STAGE_ORDER.length - 1
                ] &&
            this.layer === CULTIVATION_LAYERS_PER_STAGE
        );
    }

    public getVersion(): number {
        return this.version;
    }

    public setProgressForDebug(
        realm: CultivationRealm,
        stage: CultivationStage,
        layer: number,
        cultivation = 0,
    ): void {
        if (
            !CULTIVATION_REALM_ORDER.includes(realm) ||
            !CULTIVATION_STAGE_ORDER.includes(stage)
        ) {
            return;
        }

        this.currentRealm = realm;
        this.currentStage = stage;
        this.layer = Math.min(
            Math.max(Math.floor(layer), 1),
            CULTIVATION_LAYERS_PER_STAGE,
        );
        this.requiredCultivation = this.calculateRequiredCultivation();
        this.cultivation = Math.min(
            Math.max(cultivation, 0),
            this.requiredCultivation,
        );
        this.version += 1;
    }

    public restoreProgress(
        realm: CultivationRealm,
        stage: CultivationStage,
        layer: number,
        cultivation: number,
    ): boolean {
        if (
            !CULTIVATION_REALM_ORDER.includes(realm) ||
            !CULTIVATION_STAGE_ORDER.includes(stage) ||
            !Number.isFinite(layer) ||
            !Number.isFinite(cultivation)
        ) {
            return false;
        }

        this.currentRealm = realm;
        this.currentStage = stage;
        this.layer = Math.min(
            Math.max(Math.floor(layer), 1),
            CULTIVATION_LAYERS_PER_STAGE,
        );
        this.requiredCultivation = this.calculateRequiredCultivation();
        this.cultivation = Math.min(
            Math.max(cultivation, 0),
            this.requiredCultivation,
        );
        this.version += 1;
        return true;
    }

    public reset(): void {
        this.restoreProgress(
            CultivationRealm.QI_REFINING,
            CultivationStage.EARLY,
            1,
            0,
        );
    }

    private calculateRequiredCultivation(): number {
        const requirement =
            REALM_BASE_CULTIVATION[this.currentRealm] *
            CULTIVATION_STAGE_MULTIPLIER[this.currentStage] *
            Math.pow(CULTIVATION_LAYER_GROWTH, this.layer - 1);

        return Math.round(requirement * 100) / 100;
    }
}
