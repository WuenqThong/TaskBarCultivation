import { Container, Graphics, Text } from "pixi.js";
import type { CultivationSystem } from "../cultivation/CultivationSystem";
import {
    CULTIVATION_REALM_LABELS,
} from "../cultivation/CultivationRealm";
import {
    CULTIVATION_STAGE_LABELS,
} from "../cultivation/CultivationStage";
import type { Player } from "../entities/Player";
import type { EquipmentManager } from "../equipment/EquipmentManager";
import { EQUIPMENT_SLOT_LABELS } from "../equipment/EquipmentSlot";
import type { ArtifactManager } from "../artifacts/ArtifactManager";
import type { TechniqueManager } from "../techniques/TechniqueManager";
import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import type { StageSystem } from "../systems/StageSystem";

type SourceKind = "equipment" | "technique" | "artifact";

const STAT_ROWS: ReadonlyArray<readonly [StatType, string, "number" | "percent"]> = [
    [StatType.MAX_HP, "HP tối đa", "number"],
    [StatType.MAX_MP, "MP tối đa", "number"],
    [StatType.ATTACK, "Công", "number"],
    [StatType.DEFENSE, "Thủ", "number"],
    [StatType.CRIT_RATE, "Tỷ lệ bạo kích", "percent"],
    [StatType.CRIT_DAMAGE, "Sát thương bạo kích", "percent"],
    [StatType.HP_REGEN, "Hồi HP / giây", "number"],
    [StatType.MP_REGEN, "Hồi MP / giây", "number"],
    [StatType.CULTIVATION_SPEED, "Tốc độ tu luyện", "percent"],
    [StatType.SKILL_COOLDOWN_RECOVERY, "Hồi kỹ năng", "percent"],
];

const SOURCE_LABELS: Readonly<Record<SourceKind, string>> = {
    equipment: "Trang bị",
    technique: "Công pháp",
    artifact: "Pháp bảo",
};

export class CharacterProgressionPanel {
    private readonly container = new Container();
    private readonly player: Player;
    private readonly cultivationSystem: CultivationSystem;
    private readonly stageSystem: StageSystem;
    private readonly equipmentManager: EquipmentManager;
    private readonly techniqueManager: TechniqueManager;
    private readonly artifactManager: ArtifactManager;
    private readonly getSpiritStone: () => number;

    private readonly primaryText: Text;
    private readonly secondaryText: Text;
    private readonly buildText: Text;

    public constructor(options: {
        player: Player;
        cultivationSystem: CultivationSystem;
        stageSystem: StageSystem;
        equipmentManager: EquipmentManager;
        techniqueManager: TechniqueManager;
        artifactManager: ArtifactManager;
        getSpiritStone: () => number;
    }) {
        this.player = options.player;
        this.cultivationSystem = options.cultivationSystem;
        this.stageSystem = options.stageSystem;
        this.equipmentManager = options.equipmentManager;
        this.techniqueManager = options.techniqueManager;
        this.artifactManager = options.artifactManager;
        this.getSpiritStone = options.getSpiritStone;

        const title = this.createText("NHÂN VẬT", 0, 0, 24, "#ffffff");
        const statCard = this.createCard(0, 34, 380, 138);
        const utilityCard = this.createCard(392, 34, 350, 138);
        const buildCard = this.createCard(754, 34, 486, 138);

        this.primaryText = this.createText("", 14, 45, 14, "#ffffff");
        this.secondaryText = this.createText("", 406, 45, 14, "#ffffff");
        this.buildText = this.createText("", 768, 45, 11, "#ffffff");
        this.buildText.style.wordWrap = true;
        this.buildText.style.wordWrapWidth = 458;
        this.buildText.style.lineHeight = 15;

        this.container.addChild(
            title,
            statCard,
            utilityCard,
            buildCard,
            this.primaryText,
            this.secondaryText,
            this.buildText,
        );
        this.refresh();
    }

    public getView(): Container {
        return this.container;
    }

    public refresh(): void {
        this.primaryText.text = [
            `HP  ${this.formatNumber(this.player.getHp())} / ${this.formatNumber(this.player.getMaxHp())}`,
            `MP  ${this.formatNumber(this.player.getMp())} / ${this.formatNumber(this.player.getMaxMp())}`,
            `Công  ${this.formatNumber(this.player.getAttack())}`,
            `Thủ  ${this.formatNumber(this.player.getDefense())}`,
            `Bạo kích  ${this.formatPercent(this.player.getCritRate())}`,
        ].join("\n");

        this.secondaryText.text = [
            `ST bạo kích  ${this.formatPercent(this.player.getCritDamage())}`,
            `Hồi HP  ${this.formatNumber(this.player.getHpRegen())}/s`,
            `Hồi MP  ${this.formatNumber(this.player.getMpRegen())}/s`,
            `Tốc tu luyện  ${this.formatPercent(this.player.getCultivationSpeed())}`,
            `Hồi kỹ năng  ${this.formatPercent(this.player.getSkillCooldownRecovery())}`,
        ].join("\n");

        const realm = CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()];
        const stage = CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()];
        const equipped = this.equipmentManager.getAllEquippedItems();
        const equipmentNames = equipped.length > 0
            ? equipped
                .map((item) => `${EQUIPMENT_SLOT_LABELS[item.definition.slot]}: ${item.definition.name}`)
                .join(" · ")
            : "Chưa trang bị";
        const learnedTechniques = this.techniqueManager.getAllTechniques()
            .filter((entry) => entry.state.learned)
            .map((entry) => `${entry.definition.name} Lv.${entry.state.level}`);
        const artifact = this.artifactManager.getEquippedArtifact();

        this.buildText.text = [
            `${realm} · ${stage} · Tầng ${this.cultivationSystem.getLayer()}    Chương ${this.stageSystem.getChapter()} - Ải ${this.stageSystem.getStage()}`,
            `Linh Thạch: ${this.getSpiritStone()}`,
            `Trang bị: ${equipmentNames}`,
            `Công pháp: ${learnedTechniques.length > 0 ? learnedTechniques.join(", ") : "Chưa học"}`,
            `Pháp bảo: ${artifact?.name ?? "Chưa trang bị"}`,
            this.getSourceSummary("equipment"),
            this.getSourceSummary("technique"),
            this.getSourceSummary("artifact"),
        ].join("\n");
    }

    private getSourceSummary(sourceKind: SourceKind): string {
        const prefix = `${sourceKind}:`;
        const statSystem = this.player.getStatSystem();
        const parts: string[] = [];

        for (const [stat, label, format] of STAT_ROWS) {
            const modifiers = statSystem
                .getModifiersForStat(stat)
                .filter((modifier) => modifier.source?.startsWith(prefix));
            if (modifiers.length === 0) {
                continue;
            }

            const flat = modifiers
                .filter((modifier) => modifier.type === StatModifierType.FLAT)
                .reduce((sum, modifier) => sum + modifier.value, 0);
            const percent = modifiers
                .filter((modifier) => modifier.type === StatModifierType.PERCENT)
                .reduce((sum, modifier) => sum + modifier.value, 0);
            const values: string[] = [];

            if (Math.abs(flat) > 0.0001) {
                values.push(format === "percent"
                    ? this.formatSignedPercent(flat)
                    : this.formatSignedNumber(flat));
            }
            if (Math.abs(percent) > 0.0001) {
                values.push(this.formatSignedPercent(percent));
            }
            if (values.length > 0) {
                parts.push(`${label} ${values.join(" + ")}`);
            }
        }

        return `${SOURCE_LABELS[sourceKind]}: ${parts.length > 0 ? parts.join(" · ") : "không có cộng chỉ số"}`;
    }

    private createCard(x: number, y: number, width: number, height: number): Graphics {
        const card = new Graphics()
            .roundRect(x, y, width, height, 5)
            .fill({ color: "#171720", alpha: 0.86 })
            .stroke({ color: "#555566", width: 1 });
        return card;
    }

    private createText(
        value: string,
        x: number,
        y: number,
        fontSize: number,
        fill: string,
    ): Text {
        const text = new Text({
            text: value,
            style: {
                fill,
                fontSize,
                fontWeight: "bold",
                lineHeight: fontSize + 7,
            },
        });
        text.position.set(x, y);
        return text;
    }

    private formatSignedNumber(value: number): string {
        return `${value >= 0 ? "+" : ""}${this.formatNumber(value)}`;
    }

    private formatSignedPercent(value: number): string {
        return `${value >= 0 ? "+" : ""}${this.formatNumber(value * 100)}%`;
    }

    private formatPercent(value: number): string {
        return `${this.formatNumber(value * 100)}%`;
    }

    private formatNumber(value: number): string {
        const rounded = Math.round(value * 100) / 100;
        return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
    }
}
