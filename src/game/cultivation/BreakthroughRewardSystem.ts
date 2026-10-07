import type { Player } from "../entities/Player";
import type { SkillManager } from "../skills/SkillManager";
import { SKILL_IDS } from "../skills/skillData";
import type { ArtifactManager } from "../artifacts/ArtifactManager";
import type { TechniqueManager } from "../techniques/TechniqueManager";
import type { BreakthroughReward, BreakthroughStatReward } from "./breakthroughRewardData";
import {
    BREAKTHROUGH_MILESTONE_REWARDS,
    EVERY_BREAKTHROUGH_REWARDS,
    INITIAL_PROGRESSION_CAPACITY,
} from "./breakthroughRewardData";
import type { CultivationSystem } from "./CultivationSystem";
import {
    CULTIVATION_LAYERS_PER_STAGE,
    CULTIVATION_REALM_ORDER,
    CULTIVATION_STAGE_ORDER,
} from "./cultivationConfig";
import { CULTIVATION_REALM_LABELS } from "./CultivationRealm";
import { CULTIVATION_STAGE_LABELS } from "./CultivationStage";

export class BreakthroughRewardSystem {
    private static readonly MODIFIER_PREFIX = "breakthrough:";
    private readonly cultivationSystem: CultivationSystem;
    private readonly player: Player;
    private readonly skillManager: SkillManager;
    private readonly artifactManager: ArtifactManager;
    private readonly techniqueManager: TechniqueManager;
    private skillSlots: number = INITIAL_PROGRESSION_CAPACITY.skillSlots;
    private techniqueSlots: number = INITIAL_PROGRESSION_CAPACITY.techniqueSlots;
    private artifactSlots: number = INITIAL_PROGRESSION_CAPACITY.artifactSlots;
    private passiveNames: string[] = [];
    private appliedProgressIndex = -1;

    public constructor(
        cultivationSystem: CultivationSystem,
        player: Player,
        skillManager: SkillManager,
        artifactManager: ArtifactManager,
        techniqueManager: TechniqueManager,
    ) {
        this.cultivationSystem = cultivationSystem;
        this.player = player;
        this.skillManager = skillManager;
        this.artifactManager = artifactManager;
        this.techniqueManager = techniqueManager;
        this.reconcile(true);
    }

    public reconcile(force = false): void {
        const currentIndex = this.getCurrentProgressIndex();
        if (!force && currentIndex === this.appliedProgressIndex) return;

        this.removeAppliedStatModifiers();
        this.skillSlots = INITIAL_PROGRESSION_CAPACITY.skillSlots;
        this.techniqueSlots = INITIAL_PROGRESSION_CAPACITY.techniqueSlots;
        this.artifactSlots = INITIAL_PROGRESSION_CAPACITY.artifactSlots;
        this.passiveNames = [];
        const unlockedSkills = new Set<string>([SKILL_IDS.NORMAL_SLASH]);

        for (let progressIndex = 1; progressIndex <= currentIndex; progressIndex += 1) {
            EVERY_BREAKTHROUGH_REWARDS.forEach((reward, rewardIndex) => {
                this.applyStatReward(reward, `layer:${progressIndex}:${rewardIndex}`);
            });
        }

        for (const milestone of BREAKTHROUGH_MILESTONE_REWARDS) {
            if (this.getMilestoneProgressIndex(milestone.realm, milestone.stage, milestone.layer) > currentIndex) {
                continue;
            }
            milestone.rewards.forEach((reward, rewardIndex) => {
                this.applyReward(reward, milestone.id, rewardIndex, unlockedSkills);
            });
        }

        this.skillManager.setProgressionUnlockedSkills(unlockedSkills);
        this.skillManager.setProgressionSlotCount(this.skillSlots);
        this.techniqueManager.setProgressionSlotLimit(this.techniqueSlots);
        this.artifactManager.setProgressionSlotLimit(this.artifactSlots);
        this.player.syncCurrentResourcesWithMaxStats();
        this.appliedProgressIndex = currentIndex;
    }

    public getSkillSlotCount(): number { return this.skillSlots; }
    public getTechniqueSlotCount(): number { return this.techniqueSlots; }
    public getArtifactSlotCount(): number { return this.artifactSlots; }
    public getUnlockedPassives(): string[] { return [...this.passiveNames]; }

    public getNextRewardSummary(): string {
        const currentIndex = this.getCurrentProgressIndex();
        const nextIndex = currentIndex + 1;
        const location = this.getLocationForProgressIndex(nextIndex);
        if (!location) return "Đã nhận toàn bộ phần thưởng đột phá hiện có.";

        const special = BREAKTHROUGH_MILESTONE_REWARDS.find((milestone) =>
            this.getMilestoneProgressIndex(milestone.realm, milestone.stage, milestone.layer) === nextIndex,
        );
        const base = "+8 HP · +2 MP · +1 Công · +0.4 Thủ";
        const extra = special ? ` · ${this.describeRewards(special.rewards)}` : "";
        return `Mốc kế: ${CULTIVATION_REALM_LABELS[location.realm]} ${CULTIVATION_STAGE_LABELS[location.stage]} Tầng ${location.layer}: ${base}${extra}`;
    }

    private applyReward(
        reward: BreakthroughReward,
        milestoneId: string,
        rewardIndex: number,
        unlockedSkills: Set<string>,
    ): void {
        if (reward.kind === "stat") {
            this.applyStatReward(reward, `milestone:${milestoneId}:${rewardIndex}`);
        } else if (reward.kind === "skill_unlock") {
            unlockedSkills.add(reward.skillId);
        } else if (reward.kind === "skill_slots") {
            this.skillSlots = Math.max(this.skillSlots, reward.value);
        } else if (reward.kind === "technique_slots") {
            this.techniqueSlots = Math.max(this.techniqueSlots, reward.value);
        } else if (reward.kind === "artifact_slots") {
            this.artifactSlots = Math.max(this.artifactSlots, reward.value);
        } else if (reward.kind === "passive") {
            this.passiveNames.push(reward.name);
            reward.modifiers.forEach((modifier, modifierIndex) => {
                this.applyStatReward(modifier, `passive:${reward.id}:${modifierIndex}`);
            });
        }
    }

    private applyStatReward(reward: BreakthroughStatReward, suffix: string): void {
        this.player.getStatSystem().addModifier({
            id: `${BreakthroughRewardSystem.MODIFIER_PREFIX}${suffix}`,
            stat: reward.stat,
            type: reward.type,
            value: reward.value,
            source: BreakthroughRewardSystem.MODIFIER_PREFIX.slice(0, -1),
        });
    }

    private removeAppliedStatModifiers(): void {
        for (const modifier of this.player.getStatSystem().getModifiers()) {
            if (modifier.id.startsWith(BreakthroughRewardSystem.MODIFIER_PREFIX)) {
                this.player.getStatSystem().removeModifier(modifier.id);
            }
        }
    }

    private getCurrentProgressIndex(): number {
        return this.getMilestoneProgressIndex(
            this.cultivationSystem.getRealm(),
            this.cultivationSystem.getStage(),
            this.cultivationSystem.getLayer(),
        );
    }

    private getMilestoneProgressIndex(realm: typeof CULTIVATION_REALM_ORDER[number], stage: typeof CULTIVATION_STAGE_ORDER[number], layer: number): number {
        const realmIndex = CULTIVATION_REALM_ORDER.indexOf(realm);
        const stageIndex = CULTIVATION_STAGE_ORDER.indexOf(stage);
        return realmIndex * CULTIVATION_STAGE_ORDER.length * CULTIVATION_LAYERS_PER_STAGE
            + stageIndex * CULTIVATION_LAYERS_PER_STAGE
            + Math.max(1, layer) - 1;
    }

    private getLocationForProgressIndex(progressIndex: number) {
        const perRealm = CULTIVATION_STAGE_ORDER.length * CULTIVATION_LAYERS_PER_STAGE;
        const realmIndex = Math.floor(progressIndex / perRealm);
        const withinRealm = progressIndex % perRealm;
        const stageIndex = Math.floor(withinRealm / CULTIVATION_LAYERS_PER_STAGE);
        const layer = withinRealm % CULTIVATION_LAYERS_PER_STAGE + 1;
        const realm = CULTIVATION_REALM_ORDER[realmIndex];
        const stage = CULTIVATION_STAGE_ORDER[stageIndex];
        return realm && stage ? { realm, stage, layer } : null;
    }

    private describeRewards(rewards: ReadonlyArray<BreakthroughReward>): string {
        return rewards.map((reward) => {
            if (reward.kind === "skill_unlock") return `mở kỹ năng ${reward.skillId}`;
            if (reward.kind === "skill_slots") return `mở ${reward.value} ô kỹ năng`;
            if (reward.kind === "technique_slots") return `${reward.value} ô công pháp`;
            if (reward.kind === "artifact_slots") return `${reward.value} ô pháp bảo`;
            if (reward.kind === "passive") return `nội tại ${reward.name}`;
            return "thưởng chỉ số";
        }).join(" · ");
    }
}
