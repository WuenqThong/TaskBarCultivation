import { Assets, Container, Sprite, Text, Texture } from "pixi.js";
import type { CultivationSystem } from "../cultivation/CultivationSystem";
import { CULTIVATION_REALM_LABELS } from "../cultivation/CultivationRealm";
import { CULTIVATION_STAGE_LABELS } from "../cultivation/CultivationStage";
import type { Player } from "../entities/Player";
import type { EquipmentManager } from "../equipment/EquipmentManager";
import { EQUIPMENT_SLOT_LABELS } from "../equipment/EquipmentSlot";
import type { ArtifactManager } from "../artifacts/ArtifactManager";
import type { TechniqueManager } from "../techniques/TechniqueManager";
import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import type { StageSystem } from "../systems/StageSystem";
import { ALL_MENU_TEXTURE_PATHS, MENU_ASSETS } from "./menu/MenuAssets";
import { MENU_COLORS } from "./menu/MenuTheme";

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

const CARD_WIDTH = 158;
const CARD_HEIGHT = 218;
const CARD_GAP = 16;
const CARD_Y = 24;

interface CardView {
    root: Container;
    value: Text;
}

export class CharacterProgressionPanel {
    private readonly container = new Container();
    private readonly player: Player;
    private readonly cultivationSystem: CultivationSystem;
    private readonly stageSystem: StageSystem;
    private readonly equipmentManager: EquipmentManager;
    private readonly techniqueManager: TechniqueManager;
    private readonly artifactManager: ArtifactManager;
    private readonly getSpiritStone: () => number;
    private readonly cards: CardView[] = [];

    public static async loadAssets(): Promise<void> {
        const textures = await Promise.all(
            ALL_MENU_TEXTURE_PATHS.map((path) => Assets.load<Texture>(path)),
        );
        textures.forEach((texture) => {
            texture.source.scaleMode = "nearest";
        });
    }

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

        const title = this.createText(
            "NHÂN VẬT · TỔNG QUAN BUILD",
            0,
            0,
            17,
            MENU_COLORS.bronzeBright,
        );
        this.container.addChild(title);

        const cardSpecs = [
            [MENU_ASSETS.cards.neutral, "CẢNH GIỚI"],
            [MENU_ASSETS.cards.health, "SINH MỆNH"],
            [MENU_ASSETS.cards.attack, "CÔNG KÍCH"],
            [MENU_ASSETS.cards.defense, "PHÒNG THỦ"],
            [MENU_ASSETS.cards.speed, "NHỊP CHIẾN"],
            [MENU_ASSETS.cards.special, "BUILD"],
            [MENU_ASSETS.cards.cultivation, "TU LUYỆN"],
        ] as const;

        cardSpecs.forEach(([asset, label], index) => {
            const card = this.createCard(asset, label, index);
            this.cards.push(card);
            this.container.addChild(card.root);
        });

        this.refresh();
    }

    public getView(): Container {
        return this.container;
    }

    public refresh(): void {
        const realm = CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()];
        const stage = CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()];
        const equipped = this.equipmentManager.getAllEquippedItems();
        const equipmentNames = equipped.length > 0
            ? equipped
                .map((item) => `${EQUIPMENT_SLOT_LABELS[item.definition.slot]}: ${item.definition.name}`)
                .join("\n")
            : "Chưa trang bị";
        const learnedTechniques = this.techniqueManager.getAllTechniques()
            .filter((entry) => entry.state.learned)
            .map((entry) => `${entry.definition.name} Lv.${entry.state.level}`);
        const artifact = this.artifactManager.getEquippedArtifact();

        this.cards[0].value.text = [
            realm,
            `${stage} · Tầng ${this.cultivationSystem.getLayer()}`,
            `Chương ${this.stageSystem.getChapter()} · Ải ${this.stageSystem.getStage()}`,
        ].join("\n");
        this.cards[1].value.text = [
            `HP ${this.formatNumber(this.player.getHp())}/${this.formatNumber(this.player.getMaxHp())}`,
            `MP ${this.formatNumber(this.player.getMp())}/${this.formatNumber(this.player.getMaxMp())}`,
            `Hồi HP ${this.formatNumber(this.player.getHpRegen())}/s`,
            `Hồi MP ${this.formatNumber(this.player.getMpRegen())}/s`,
        ].join("\n");
        this.cards[2].value.text = [
            `ATK ${this.formatNumber(this.player.getAttack())}`,
            `Crit DMG ${this.formatPercent(this.player.getCritDamage())}`,
            this.getSourceSummary("equipment", StatType.ATTACK),
        ].filter(Boolean).join("\n");
        this.cards[3].value.text = [
            `DEF ${this.formatNumber(this.player.getDefense())}`,
            this.getSourceSummary("equipment", StatType.DEFENSE),
        ].filter(Boolean).join("\n");
        this.cards[4].value.text = [
            `Crit ${this.formatPercent(this.player.getCritRate())}`,
            `Hồi CD ${this.formatPercent(this.player.getSkillCooldownRecovery())}`,
            this.getSourceSummary("technique"),
        ].filter(Boolean).join("\n");
        this.cards[5].value.text = [
            equipmentNames,
            `Công pháp: ${learnedTechniques.length > 0 ? learnedTechniques.join(", ") : "Chưa học"}`,
            `Pháp bảo: ${artifact?.name ?? "Chưa trang bị"}`,
            this.getSourceSummary("artifact"),
        ].filter(Boolean).join("\n");
        this.cards[6].value.text = [
            `Tốc tu luyện ${this.formatPercent(this.player.getCultivationSpeed())}`,
            `Linh Thạch ${this.formatNumber(this.getSpiritStone())}`,
            this.getSourceSummary("technique", StatType.CULTIVATION_SPEED),
        ].filter(Boolean).join("\n");
    }

    private createCard(asset: string, label: string, index: number): CardView {
        const root = new Container();
        root.position.set(index * (CARD_WIDTH + CARD_GAP), CARD_Y);

        const texture = Assets.get<Texture>(asset);
        const frame = new Sprite(texture ?? Texture.EMPTY);
        frame.width = CARD_WIDTH;
        frame.height = CARD_HEIGHT;
        frame.roundPixels = true;

        const title = this.createText(label, CARD_WIDTH / 2, 44, 11, MENU_COLORS.bronzeBright);
        title.anchor.set(0.5, 0);
        const value = this.createText("", 17, 74, 10, MENU_COLORS.text);
        value.style.wordWrap = true;
        value.style.wordWrapWidth = CARD_WIDTH - 34;
        value.style.lineHeight = 15;

        root.addChild(frame, title, value);
        return { root, value };
    }

    private getSourceSummary(sourceKind: SourceKind, onlyStat?: StatType): string {
        const prefix = `${sourceKind}:`;
        const parts: string[] = [];

        for (const [stat, label, format] of STAT_ROWS) {
            if (onlyStat !== undefined && stat !== onlyStat) continue;
            const modifiers = this.player.getStatSystem()
                .getModifiersForStat(stat)
                .filter((modifier) => modifier.source?.startsWith(prefix));
            if (modifiers.length === 0) continue;

            const flat = modifiers
                .filter((modifier) => modifier.type === StatModifierType.FLAT)
                .reduce((sum, modifier) => sum + modifier.value, 0);
            const percent = modifiers
                .filter((modifier) => modifier.type === StatModifierType.PERCENT)
                .reduce((sum, modifier) => sum + modifier.value, 0);
            const values: string[] = [];

            if (Math.abs(flat) > 0.0001) {
                values.push(
                    format === "percent"
                        ? this.formatSignedPercent(flat)
                        : this.formatSignedNumber(flat),
                );
            }
            if (Math.abs(percent) > 0.0001) values.push(this.formatSignedPercent(percent));
            if (values.length > 0) parts.push(`${label} ${values.join(" + ")}`);
        }

        return parts.length > 0
            ? `${SOURCE_LABELS[sourceKind]}: ${parts.join(" · ")}`
            : "";
    }

    private createText(
        value: string,
        x: number,
        y: number,
        fontSize: number,
        fill: number,
    ): Text {
        const text = new Text({
            text: value,
            style: {
                fill,
                fontSize,
                fontWeight: "bold",
                lineHeight: fontSize + 5,
            },
        });
        text.position.set(Math.round(x), Math.round(y));
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
