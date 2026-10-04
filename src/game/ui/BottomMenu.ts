import {
    Application,
    Container,
    Graphics,
    Text,
} from "pixi.js";
import { ArtifactManager } from "../artifacts/ArtifactManager";
import type { AlchemyManager } from "../alchemy/AlchemyManager";
import { PillEffectType } from "../alchemy/Pill";
import type { PillCraftResult } from "../alchemy/PillCraftResult";
import type { BuffManager } from "../buffs/BuffManager";
import {
    ARTIFACT_RARITY_COLORS,
    ARTIFACT_RARITY_LABELS,
} from "../artifacts/ArtifactRarity";
import { ARTIFACT_FRAGMENTS_REQUIRED } from "../artifacts/artifactConfig";
import {
    CRAFTING_CATALYST_TYPE_LABELS,
    isCraftingCatalyst,
} from "../crafting/CraftingCatalyst";
import {
    CULTIVATION_REALM_LABELS,
    CultivationRealm,
} from "../cultivation/CultivationRealm";
import {
    CULTIVATION_STAGE_LABELS,
    CultivationStage,
} from "../cultivation/CultivationStage";
import { CultivationSystem } from "../cultivation/CultivationSystem";
import { CULTIVATION_LAYERS_PER_STAGE } from "../cultivation/cultivationConfig";
import { Player } from "../entities/Player";
import type { EquipmentInstance } from "../equipment/EquipmentInstance";
import { EquipmentManager } from "../equipment/EquipmentManager";
import {
    EQUIPMENT_RARITY_COLORS,
    EQUIPMENT_RARITY_LABELS,
    EquipmentRarity,
} from "../equipment/EquipmentRarity";
import {
    EQUIPMENT_SLOT_LABELS,
    EquipmentSlot,
} from "../equipment/EquipmentSlot";
import { Inventory } from "../inventory/Inventory";
import { ItemRarity, ItemType } from "../items/Item";
import { ITEM_DATA } from "../items/itemData";
import { isMaterialDefinition } from "../materials/Material";
import { MATERIAL_CATEGORY_LABELS } from "../materials/MaterialCategory";
import { MATERIAL_DEFINITIONS } from "../materials/materialData";
import type { SkillCombatSystem } from "../skills/SkillCombatSystem";
import type { SkillDefinition } from "../skills/Skill";
import type { SkillManager } from "../skills/SkillManager";
import type { SkillState } from "../skills/SkillState";
import type { CraftingManager } from "../crafting/CraftingManager";
import { CraftFailReason } from "../crafting/CraftingResult";
import type { EquipmentCraftResult } from "../refining/EquipmentCraftResult";
import type { RefiningManager } from "../refining/RefiningManager";
import type { SaveManager } from "../save/SaveManager";
import { CURRENT_SAVE_VERSION } from "../save/SaveVersion";
import { StatModifierType } from "../stats/StatModifier";
import type { StatModifier } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import { StageSystem } from "../systems/StageSystem";
import { TechniqueManager } from "../techniques/TechniqueManager";
import { MenuTab } from "./MenuTab";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 240;
const MENU_HEIGHT = 300;
const OPEN_HEIGHT = GAME_HEIGHT + MENU_HEIGHT;
const TAB_BUTTON_WIDTH = 119;
const TAB_BUTTON_HEIGHT = 36;
const TAB_BUTTON_GAP = 5;
const TAB_NORMAL_COLOR = "#2a2a35";
const TAB_ACTIVE_COLOR = "#4a4a65";
const CHARACTER_REFRESH_INTERVAL = 250;
const REFINING_RARITY_ORDER: ReadonlyArray<EquipmentRarity> = [
    EquipmentRarity.WHITE,
    EquipmentRarity.GREEN,
    EquipmentRarity.BLUE,
    EquipmentRarity.PURPLE,
    EquipmentRarity.GOLD,
    EquipmentRarity.RED,
];

const TAB_LABELS: ReadonlyArray<readonly [MenuTab, string]> = [
    [MenuTab.CHARACTER, "Nhân Vật"],
    [MenuTab.EQUIPMENT, "Trang Bị"],
    [MenuTab.REFINING, "Luyện Khí"],
    [MenuTab.ALCHEMY, "Luyện Đan"],
    [MenuTab.INVENTORY, "Túi Đồ"],
    [MenuTab.SKILLS, "Kỹ Năng"],
    [MenuTab.CULTIVATION, "Tu Luyện"],
    [MenuTab.TECHNIQUES, "Công Pháp"],
    [MenuTab.ARTIFACTS, "Pháp Bảo"],
    [MenuTab.SETTINGS, "Cài Đặt"],
];

const TAB_PLACEHOLDERS: Readonly<Record<MenuTab, string>> = {
    [MenuTab.CHARACTER]: "NHÂN VẬT",
    [MenuTab.EQUIPMENT]: "TRANG BỊ",
    [MenuTab.REFINING]: "LUYỆN KHÍ",
    [MenuTab.ALCHEMY]: "LUYỆN ĐAN",
    [MenuTab.INVENTORY]: "TÚI ĐỒ",
    [MenuTab.SKILLS]: "KỸ NĂNG",
    [MenuTab.CULTIVATION]: "TU LUYỆN",
    [MenuTab.TECHNIQUES]: "CÔNG PHÁP",
    [MenuTab.ARTIFACTS]: "PHÁP BẢO",
    [MenuTab.SETTINGS]: "CÀI ĐẶT",
};

const ITEM_TYPE_LABELS: Readonly<Record<ItemType, string>> = {
    [ItemType.EQUIPMENT]: "Trang Bị",
    [ItemType.MATERIAL]: "Nguyên Liệu",
    [ItemType.CONSUMABLE]: "Tiêu Hao",
    [ItemType.TECHNIQUE]: "Công Pháp",
    [ItemType.ARTIFACT]: "Pháp Bảo",
    [ItemType.CATALYST]: "Chất Xúc Tác",
};

const ITEM_RARITY_LABELS: Readonly<Record<ItemRarity, string>> = {
    [ItemRarity.COMMON]: "Thường",
    [ItemRarity.UNCOMMON]: "Tốt",
    [ItemRarity.RARE]: "Hiếm",
    [ItemRarity.EPIC]: "Sử Thi",
    [ItemRarity.LEGENDARY]: "Huyền Thoại",
};

const EQUIPMENT_SLOTS: ReadonlyArray<EquipmentSlot> = [
    EquipmentSlot.WEAPON,
    EquipmentSlot.ARMOR,
    EquipmentSlot.BRACELET,
];

const STAT_LABELS: Readonly<Record<StatType, string>> = {
    [StatType.MAX_HP]: "HP",
    [StatType.MAX_MP]: "MP",
    [StatType.ATTACK]: "Công",
    [StatType.DEFENSE]: "Thủ",
    [StatType.CRIT_RATE]: "Bạo Kích",
    [StatType.CRIT_DAMAGE]: "ST Bạo Kích",
    [StatType.CULTIVATION_SPEED]: "Tốc Tu Luyện",
    [StatType.SKILL_COOLDOWN_RECOVERY]: "Hồi Kỹ Năng",
    [StatType.HP_REGEN]: "Hồi HP",
    [StatType.MP_REGEN]: "Hồi MP",
};

const RATIO_STATS = new Set<StatType>([
    StatType.CRIT_RATE,
    StatType.CRIT_DAMAGE,
    StatType.CULTIVATION_SPEED,
    StatType.SKILL_COOLDOWN_RECOVERY,
]);

export class BottomMenu {
    private app: Application;
    private player: Player;
    private stageSystem: StageSystem;
    private cultivationSystem: CultivationSystem;
    private inventory: Inventory;
    private equipmentManager: EquipmentManager;
    private artifactManager: ArtifactManager;
    private techniqueManager: TechniqueManager;
    private skillManager: SkillManager;
    private skillCombatSystem: SkillCombatSystem;
    private refiningManager: RefiningManager;
    private craftingManager: CraftingManager;
    private alchemyManager: AlchemyManager;
    private buffManager: BuffManager;
    private getSpiritStone: () => number;
    private saveManager: SaveManager;
    private onPersistentStateChanged: () => void;
    private container: Container;
    private panel: Container;
    private toggleButton: Container;
    private toggleButtonText: Text;
    private tabContainer: Container;
    private tabButtonBackgrounds: Map<MenuTab, Graphics>;
    private activeTab: MenuTab;
    private openState: boolean;
    private refreshTimer: number;
    private renderedInventoryVersion: number;
    private renderedEquipmentVersion: number;
    private renderedArtifactVersion: number;
    private renderedTechniqueVersion: number;
    private equipmentStatusMessage: string;
    private artifactStatusMessage: string;
    private techniqueStatusMessage: string;
    private selectedRefiningCatalysts: Map<string, string | undefined>;
    private lastEquipmentCraftResult: EquipmentCraftResult | null;
    private selectedAlchemyCatalysts: Map<string, string | undefined>;
    private lastPillCraftResult: PillCraftResult | null;
    private saveStatusMessage: string;

    private characterPrimaryStatsText: Text | null;
    private characterSecondaryStatsText: Text | null;
    private characterProgressText: Text | null;
    private cultivationDetailsText: Text | null;
    private cultivationProgressText: Text | null;
    private cultivationStatusText: Text | null;

    constructor(
        app: Application,
        player: Player,
        stageSystem: StageSystem,
        cultivationSystem: CultivationSystem,
        inventory: Inventory,
        equipmentManager: EquipmentManager,
        artifactManager: ArtifactManager,
        techniqueManager: TechniqueManager,
        skillManager: SkillManager,
        skillCombatSystem: SkillCombatSystem,
        refiningManager: RefiningManager,
        craftingManager: CraftingManager,
        alchemyManager: AlchemyManager,
        buffManager: BuffManager,
        getSpiritStone: () => number,
        saveManager: SaveManager,
        onPersistentStateChanged: () => void,
    ) {
        this.app = app;
        this.player = player;
        this.stageSystem = stageSystem;
        this.cultivationSystem = cultivationSystem;
        this.inventory = inventory;
        this.equipmentManager = equipmentManager;
        this.artifactManager = artifactManager;
        this.techniqueManager = techniqueManager;
        this.skillManager = skillManager;
        this.skillCombatSystem = skillCombatSystem;
        this.refiningManager = refiningManager;
        this.craftingManager = craftingManager;
        this.alchemyManager = alchemyManager;
        this.buffManager = buffManager;
        this.getSpiritStone = getSpiritStone;
        this.saveManager = saveManager;
        this.onPersistentStateChanged = onPersistentStateChanged;
        this.container = new Container();
        this.tabContainer = new Container();
        this.tabButtonBackgrounds = new Map<MenuTab, Graphics>();
        this.activeTab = MenuTab.CHARACTER;
        this.panel = this.createPanel();
        this.toggleButtonText = new Text({
            text: "MENU",
            style: {
                fill: "#ffffff",
                fontSize: 14,
                fontWeight: "bold",
            },
        });
        this.toggleButton = this.createToggleButton();
        this.openState = false;
        this.refreshTimer = 0;
        this.renderedInventoryVersion = -1;
        this.renderedEquipmentVersion = -1;
        this.renderedArtifactVersion = -1;
        this.renderedTechniqueVersion = -1;
        this.equipmentStatusMessage = "";
        this.artifactStatusMessage = "";
        this.techniqueStatusMessage = "";
        this.selectedRefiningCatalysts = new Map();
        this.lastEquipmentCraftResult = null;
        this.selectedAlchemyCatalysts = new Map();
        this.lastPillCraftResult = null;
        this.saveStatusMessage = "";

        this.characterPrimaryStatsText = null;
        this.characterSecondaryStatsText = null;
        this.characterProgressText = null;
        this.cultivationDetailsText = null;
        this.cultivationProgressText = null;
        this.cultivationStatusText = null;

        this.container.addChild(this.panel);
        this.container.addChild(this.toggleButton);

        this.renderActiveTab();

        this.app.ticker.add((ticker) => {
            this.update(ticker.deltaMS);
        });
    }

    public getView(): Container {
        return this.container;
    }

    public open(): void {
        if (this.openState) {
            return;
        }

        this.openState = true;
        this.panel.visible = true;
        this.toggleButtonText.text = "CLOSE";
        this.app.renderer.resize(GAME_WIDTH, OPEN_HEIGHT);

        this.refreshTimer = 0;
        if (this.activeTab === MenuTab.CHARACTER) {
            this.updateCharacterTexts();
        }

        if (this.activeTab === MenuTab.INVENTORY) {
            this.refreshInventoryTab();
        }

        if (this.activeTab === MenuTab.EQUIPMENT) {
            this.refreshEquipmentTab();
        }

        if (this.activeTab === MenuTab.ARTIFACTS) {
            this.refreshArtifactTab();
        }

        if (this.activeTab === MenuTab.TECHNIQUES) {
            this.refreshTechniqueTab();
        }

        if (this.activeTab === MenuTab.SKILLS) {
            this.renderSkillTab();
        }

        if (this.activeTab === MenuTab.REFINING) {
            this.renderRefiningTab();
        }

        if (this.activeTab === MenuTab.ALCHEMY) {
            this.renderAlchemyTab();
        }

        if (this.activeTab === MenuTab.CULTIVATION) {
            this.updateCultivationTexts();
        }
    }

    public close(): void {
        if (!this.openState) {
            return;
        }

        this.openState = false;
        this.panel.visible = false;
        this.toggleButtonText.text = "MENU";
        this.app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
    }

    public toggle(): void {
        if (this.openState) {
            this.close();
            return;
        }

        this.open();
    }

    public isOpen(): boolean {
        return this.openState;
    }

    private createPanel(): Container {
        const panel = new Container();
        const background = new Graphics()
            .rect(0, 0, GAME_WIDTH, MENU_HEIGHT)
            .fill({ color: "#20202a" })
            .stroke({ color: "#555566", width: 1 });
        const title = new Text({
            text: "MENU",
            style: {
                fill: "#ffffff",
                fontSize: 22,
                fontWeight: "bold",
            },
        });
        const tabNavigation = new Container();

        panel.y = GAME_HEIGHT;
        panel.visible = false;

        title.x = 20;
        title.y = 18;
        tabNavigation.x = 20;
        tabNavigation.y = 55;
        this.tabContainer.x = 20;
        this.tabContainer.y = 120;

        TAB_LABELS.forEach(([tab, label], index) => {
            const button = this.createTabButton(label, tab);

            button.x = index * (TAB_BUTTON_WIDTH + TAB_BUTTON_GAP);
            tabNavigation.addChild(button);
        });

        panel.addChild(background);
        panel.addChild(title);
        panel.addChild(tabNavigation);
        panel.addChild(this.tabContainer);

        return panel;
    }

    private createTabButton(
        label: string,
        tab: MenuTab,
    ): Container {
        const button = new Container();
        const background = new Graphics();
        const text = new Text({
            text: label,
            style: {
                fill: "#ffffff",
                fontSize: 14,
                fontWeight: "bold",
            },
        });

        button.eventMode = "static";
        button.cursor = "pointer";

        text.anchor.set(0.5);
        text.x = TAB_BUTTON_WIDTH / 2;
        text.y = TAB_BUTTON_HEIGHT / 2;

        button.addChild(background);
        button.addChild(text);
        button.on("pointertap", () => {
            this.switchTab(tab);
        });

        this.tabButtonBackgrounds.set(tab, background);
        this.drawTabButton(background, tab === this.activeTab);

        return button;
    }

    private switchTab(tab: MenuTab): void {
        if (tab === this.activeTab) {
            return;
        }

        this.activeTab = tab;
        this.refreshTimer = 0;
        this.renderActiveTab();
        this.updateTabButtonStyles();
    }

    private renderActiveTab(): void {
        this.tabContainer.removeChildren();

        this.characterPrimaryStatsText = null;
        this.characterSecondaryStatsText = null;
        this.characterProgressText = null;
        this.cultivationDetailsText = null;
        this.cultivationProgressText = null;
        this.cultivationStatusText = null;

        if (this.activeTab === MenuTab.CHARACTER) {
            this.renderCharacterTab();
            return;
        }

        if (this.activeTab === MenuTab.INVENTORY) {
            this.renderInventoryTab();
            return;
        }

        if (this.activeTab === MenuTab.EQUIPMENT) {
            this.renderEquipmentTab();
            return;
        }

        if (this.activeTab === MenuTab.ARTIFACTS) {
            this.renderArtifactTab();
            return;
        }

        if (this.activeTab === MenuTab.TECHNIQUES) {
            this.renderTechniqueTab();
            return;
        }

        if (this.activeTab === MenuTab.CULTIVATION) {
            this.renderCultivationTab();
            return;
        }

        if (this.activeTab === MenuTab.SKILLS) {
            this.renderSkillTab();
            return;
        }

        if (this.activeTab === MenuTab.REFINING) {
            this.renderRefiningTab();
            return;
        }

        if (this.activeTab === MenuTab.ALCHEMY) {
            this.renderAlchemyTab();
            return;
        }

        if (this.activeTab === MenuTab.SETTINGS) {
            this.renderSettingsTab();
            return;
        }

        const content = new Text({
            text: TAB_PLACEHOLDERS[this.activeTab],
            style: {
                fill: "#ffffff",
                fontSize: 24,
                fontWeight: "bold",
            },
        });

        this.tabContainer.addChild(content);
    }

    private renderSettingsTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.SETTINGS],
            0,
            24,
        );
        const lastSavedAt = this.saveManager.getLastSavedAt();
        const info = this.createContentText(
            [
                `Save Version: ${CURRENT_SAVE_VERSION}`,
                `Last Save: ${lastSavedAt
                    ? new Date(lastSavedAt).toLocaleTimeString("vi-VN")
                    : "Chưa có"}`,
                this.saveStatusMessage,
            ].filter(Boolean).join("\n"),
            38,
            15,
        );
        const saveButton = this.createMenuActionButton(
            "LƯU GAME",
            150,
            34,
            () => {
                this.saveStatusMessage = this.saveManager.save()
                    ? "Đã lưu game"
                    : "Lưu game thất bại";
                this.renderSettingsTab();
            },
        );
        const loadButton = this.createMenuActionButton(
            "TẢI GAME",
            150,
            34,
            () => {
                const result = this.saveManager.load();

                this.saveStatusMessage = result.success
                    ? `Đã tải save v${result.version}`
                    : `Tải thất bại: ${result.reason ?? "Không rõ"}`;

                if (result.success) {
                    this.onPersistentStateChanged();
                }

                this.renderSettingsTab();
            },
        );
        const deleteButton = this.createMenuActionButton(
            "XÓA SAVE",
            150,
            34,
            () => {
                this.saveManager.deleteSave();
                this.saveStatusMessage = "Đã xóa save; runtime được giữ nguyên";
                this.renderSettingsTab();
            },
            "#fca5a5",
        );
        const resetButton = this.createMenuActionButton(
            "RESET GAME",
            150,
            34,
            () => {
                this.saveManager.resetPersistentProgress();
                this.onPersistentStateChanged();
                this.saveStatusMessage = "Đã reset permanent progress";
                this.renderSettingsTab();
            },
            "#fbbf24",
        );

        saveButton.position.set(0, 115);
        loadButton.position.set(170, 115);
        deleteButton.position.set(340, 115);
        resetButton.position.set(510, 115);
        this.tabContainer.addChild(
            title,
            info,
            saveButton,
            loadButton,
            deleteButton,
            resetButton,
        );
    }

    private renderCharacterTab(): void {
        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.CHARACTER],
            0,
            24,
        );

        this.characterPrimaryStatsText = this.createContentText("", 36, 16);
        this.characterSecondaryStatsText = this.createContentText("", 36, 16);
        this.characterProgressText = this.createContentText("", 36, 16);

        this.characterSecondaryStatsText.x = 300;
        this.characterProgressText.x = 720;

        this.tabContainer.addChild(
            title,
            this.characterPrimaryStatsText,
            this.characterSecondaryStatsText,
            this.characterProgressText,
        );

        this.updateCharacterTexts();
    }

    private renderCultivationTab(): void {
        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.CULTIVATION],
            0,
            24,
        );

        this.cultivationDetailsText = this.createContentText("", 38, 17);
        this.cultivationProgressText = this.createContentText("", 38, 17);
        this.cultivationStatusText = this.createContentText("", 126, 14);
        this.cultivationProgressText.x = 350;
        this.cultivationStatusText.x = 350;
        this.cultivationStatusText.style.fill = "#facc15";

        this.tabContainer.addChild(
            title,
            this.cultivationDetailsText,
            this.cultivationProgressText,
            this.cultivationStatusText,
        );

        if (!this.cultivationSystem.isMaxCultivation()) {
            const breakthroughButton = this.createMenuActionButton(
                "ĐỘT PHÁ",
                120,
                30,
                () => {
                    if (this.cultivationSystem.breakthrough()) {
                        this.renderActiveTab();
                    } else if (this.cultivationStatusText) {
                        this.cultivationStatusText.text = "Chưa đủ Tu Vi";
                    }
                },
                "#ffffff",
                13,
            );

            breakthroughButton.position.set(350, 88);
            this.tabContainer.addChild(breakthroughButton);
        }

        this.updateCultivationTexts();
    }

    private updateCultivationTexts(): void {
        if (
            !this.cultivationDetailsText ||
            !this.cultivationProgressText ||
            !this.cultivationStatusText
        ) {
            return;
        }

        this.cultivationDetailsText.text = [
            `Cảnh giới: ${CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()]}`,
            `Giai đoạn: ${CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()]}`,
            `Tầng: ${this.cultivationSystem.getLayer()} / ${CULTIVATION_LAYERS_PER_STAGE}`,
        ].join("\n");
        this.cultivationProgressText.text = [
            `Tu Vi: ${this.formatNumber(this.cultivationSystem.getCultivation())} / ${this.formatNumber(this.cultivationSystem.getRequiredCultivation())}`,
            `Tốc độ tu luyện: ${this.formatNumber(this.cultivationSystem.getCultivationPerSecond())} / giây`,
        ].join("\n");

        if (this.cultivationSystem.isMaxCultivation()) {
            this.cultivationStatusText.text = "Đã đạt cảnh giới tối đa";
        }
    }

    private createContentText(
        value: string,
        y: number,
        fontSize = 18,
    ): Text {
        const text = new Text({
            text: value,
            style: {
                fill: "#ffffff",
                fontSize,
                fontWeight: "bold",
            },
        });

        text.y = y;

        return text;
    }

    private renderSkillTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.SKILLS],
            0,
            24,
        );

        this.tabContainer.addChild(title);

        this.skillManager.getAllSkills().forEach(({ definition, state }, index) => {
            this.renderSkillCard(definition, state, index * 400);
        });
    }

    private renderSkillCard(
        definition: SkillDefinition,
        state: SkillState,
        x: number,
    ): void {
        const nameText = this.createContentText(definition.name, 35, 18);
        const detailsText = this.createContentText(
            [
                `Cấp: ${state.level}`,
                `MP: ${this.formatNumber(definition.mpCost)}`,
                `CD: ${this.formatNumber(this.skillManager.getEffectiveCooldown(definition.id))}s ` +
                    `(gốc ${this.formatNumber(definition.baseCooldown)}s)`,
                definition.description,
                `CD còn: ${this.formatNumber(state.remainingCooldown)}s`,
            ].join("\n"),
            59,
            13,
        );
        const autoButton = this.createMenuActionButton(
            `TỰ ĐỘNG: ${state.autoCastEnabled ? "BẬT" : "TẮT"}`,
            145,
            28,
            () => {
                this.skillManager.setAutoCast(
                    definition.id,
                    !state.autoCastEnabled,
                );
                this.renderSkillTab();
            },
            state.autoCastEnabled ? "#86efac" : "#fca5a5",
            12,
        );
        const castButton = this.createMenuActionButton(
            "DÙNG",
            90,
            28,
            () => {
                this.skillCombatSystem.cast(definition.id);
                this.renderSkillTab();
            },
            "#ffffff",
            12,
        );

        nameText.x = x;
        detailsText.x = x;
        autoButton.position.set(x, 158);
        castButton.position.set(x + 155, 158);

        this.tabContainer.addChild(
            nameText,
            detailsText,
            autoButton,
            castButton,
        );
    }

    private renderRefiningTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.REFINING],
            0,
            24,
        );

        this.tabContainer.addChild(title);
        this.renderLastEquipmentCraftResult();

        this.refiningManager.getEquipmentRecipes().forEach((recipe, index) => {
            this.renderRefiningRecipe(recipe.id, index * 410);
        });
    }

    private renderRefiningRecipe(recipeId: string, x: number): void {
        const availableCatalysts = this.craftingManager
            .getCompatibleCatalysts(recipeId, true);
        let selectedCatalystId = this.selectedRefiningCatalysts.get(recipeId);

        if (
            selectedCatalystId &&
            !availableCatalysts.some((catalyst) => catalyst.id === selectedCatalystId)
        ) {
            selectedCatalystId = undefined;
            this.selectedRefiningCatalysts.set(recipeId, undefined);
        }

        const preview = this.refiningManager.getPreview(
            recipeId,
            selectedCatalystId,
        );
        const definition = this.refiningManager.getEquipmentDefinition(recipeId);

        if (!preview || !definition) {
            return;
        }

        const materialLines = preview.materials.map((material) => {
            const materialName = MATERIAL_DEFINITIONS.find(
                (candidate) => candidate.id === material.itemId,
            )?.name ?? material.itemId;

            return `${material.enough ? "✓" : "✗"} ${materialName} ` +
                `${material.owned} / ${material.required}`;
        });
        const selectedCatalyst = availableCatalysts.find(
            (catalyst) => catalyst.id === selectedCatalystId,
        );
        const nameText = this.createContentText(preview.recipe.name, 34, 17);
        const requirementText = this.createContentText(
            `${EQUIPMENT_SLOT_LABELS[definition.slot]} | ` +
                `Yêu cầu: ${preview.recipe.requiredRealm
                    ? CULTIVATION_REALM_LABELS[preview.recipe.requiredRealm]
                    : "Không"}`,
            55,
            11,
        );
        const materialsText = this.createContentText(
            materialLines.join("\n"),
            72,
            11,
        );
        const resourceText = this.createContentText(
            `Linh Thạch: ${this.getSpiritStone()} / ${preview.spiritStoneCost}\n` +
                `Catalyst: ${selectedCatalyst
                    ? `${selectedCatalyst.name} x${this.inventory.getQuantity(selectedCatalyst.id)}`
                    : "Không sử dụng"}`,
            112,
            11,
        );
        const distributionText = this.createContentText(
            [
                "TỶ LỆ PHẨM CHẤT",
                ...REFINING_RARITY_ORDER.map((rarity) =>
                    `${EQUIPMENT_RARITY_LABELS[rarity]}: ` +
                    this.formatPercent(preview.rarityDistribution[rarity]),
                ),
            ].join("\n"),
            34,
            10,
        );
        const reasonText = this.createContentText(
            preview.canCraft
                ? "Sẵn sàng"
                : this.getCraftFailureLabel(preview.check.reason),
            143,
            10,
        );
        const catalystButton = this.createMenuActionButton(
            "CHỌN CATALYST",
            135,
            25,
            () => {
                const options: Array<string | undefined> = [
                    undefined,
                    ...this.craftingManager
                        .getCompatibleCatalysts(recipeId, true)
                        .map((catalyst) => catalyst.id),
                ];
                const currentIndex = options.indexOf(selectedCatalystId);
                const nextIndex = (currentIndex + 1) % options.length;

                this.selectedRefiningCatalysts.set(recipeId, options[nextIndex]);
                this.renderRefiningTab();
            },
            "#ffffff",
            10,
        );
        const craftButton = this.createMenuActionButton(
            "LUYỆN",
            80,
            25,
            () => {
                this.lastEquipmentCraftResult =
                    this.refiningManager.craftEquipment(
                        recipeId,
                        selectedCatalystId,
                    );

                if (
                    selectedCatalystId &&
                    !this.inventory.hasItem(selectedCatalystId)
                ) {
                    this.selectedRefiningCatalysts.set(recipeId, undefined);
                }

                this.renderRefiningTab();
            },
            "#ffffff",
            11,
        );

        nameText.x = x;
        requirementText.x = x;
        materialsText.x = x;
        resourceText.x = x;
        reasonText.x = x;
        reasonText.style.fill = preview.canCraft ? "#86efac" : "#fca5a5";
        distributionText.x = x + 250;
        catalystButton.position.set(x, 158);
        craftButton.position.set(x + 145, 158);

        if (!preview.canCraft) {
            craftButton.eventMode = "none";
            craftButton.alpha = 0.5;
        }

        this.tabContainer.addChild(
            nameText,
            requirementText,
            materialsText,
            resourceText,
            distributionText,
            reasonText,
            catalystButton,
            craftButton,
        );
    }

    private renderLastEquipmentCraftResult(): void {
        const result = this.lastEquipmentCraftResult;

        if (!result) {
            return;
        }

        const value = result.success && result.equipment && result.rarity
            ? `LUYỆN THÀNH CÔNG: ${result.equipment.definition.name} ` +
                `[${EQUIPMENT_RARITY_LABELS[result.rarity]}] | ` +
                result.equipment.rolledStats
                    .map((modifier) => this.formatStatModifier(modifier))
                    .join(" | ")
            : `Luyện thất bại: ${this.getCraftFailureLabel(result.failureReason)}`;
        const resultText = this.createContentText(value, 5, 11);

        resultText.x = 160;
        resultText.style.fill = result.success && result.rarity
            ? EQUIPMENT_RARITY_COLORS[result.rarity]
            : "#fca5a5";
        this.tabContainer.addChild(resultText);
    }

    private getCraftFailureLabel(reason?: CraftFailReason): string {
        const labels: Readonly<Record<CraftFailReason, string>> = {
            [CraftFailReason.RECIPE_NOT_FOUND]: "Không tìm thấy công thức",
            [CraftFailReason.MISSING_MATERIAL]: "Thiếu nguyên liệu",
            [CraftFailReason.NOT_ENOUGH_SPIRIT_STONE]: "Không đủ Linh Thạch",
            [CraftFailReason.REALM_TOO_LOW]: "Cảnh giới chưa đủ",
            [CraftFailReason.INVALID_CATALYST]: "Catalyst không hợp lệ",
            [CraftFailReason.INVALID_RECIPE_TYPE]: "Sai loại công thức",
            [CraftFailReason.OUTPUT_NOT_FOUND]: "Không tìm thấy trang bị đầu ra",
            [CraftFailReason.OUTPUT_CREATION_FAILED]: "Không thể tạo trang bị",
        };

        return reason ? labels[reason] : "Không thể Luyện Khí";
    }

    private renderAlchemyTab(): void {
        this.tabContainer.removeChildren();
        this.tabContainer.addChild(
            this.createContentText(TAB_PLACEHOLDERS[MenuTab.ALCHEMY], 0, 24),
        );
        this.renderLastPillCraftResult();
        this.renderActivePillBuff();

        this.alchemyManager.getPillRecipes().forEach((recipe, index) => {
            this.renderAlchemyRecipe(recipe.id, index * 410);
        });
    }

    private renderAlchemyRecipe(recipeId: string, x: number): void {
        const catalysts = this.craftingManager.getCompatibleCatalysts(recipeId, true);
        let selectedId = this.selectedAlchemyCatalysts.get(recipeId);

        if (selectedId && !catalysts.some((item) => item.id === selectedId)) {
            selectedId = undefined;
            this.selectedAlchemyCatalysts.set(recipeId, undefined);
        }

        const preview = this.alchemyManager.getPreview(recipeId, selectedId);

        if (!preview) {
            return;
        }

        const definition = this.alchemyManager.getPillDefinition(
            preview.recipe.outputId,
        );

        if (!definition) {
            return;
        }

        const selected = catalysts.find((item) => item.id === selectedId);
        const materials = preview.materials.map((material) => {
            const name = MATERIAL_DEFINITIONS.find(
                (item) => item.id === material.itemId,
            )?.name ?? material.itemId;
            return `${material.enough ? "✓" : "✗"} ${name} ${material.owned} / ${material.required}`;
        });
        const nameText = this.createContentText(definition.name, 34, 17);
        const materialsText = this.createContentText(materials.join("\n"), 57, 11);
        const resourcesText = this.createContentText(
            `Linh Thạch: ${this.getSpiritStone()} / ${preview.spiritStoneCost}\n` +
                `Catalyst: ${selected
                    ? `${selected.name} x${this.inventory.getQuantity(selected.id)}`
                    : "Không sử dụng"}`,
            97,
            11,
        );
        const distributionText = this.createContentText(
            [
                "TỶ LỆ PHẨM CHẤT",
                ...REFINING_RARITY_ORDER.map((rarity) =>
                    `${EQUIPMENT_RARITY_LABELS[rarity]}: ${this.formatPercent(preview.rarityDistribution[rarity])}`,
                ),
            ].join("\n"),
            34,
            10,
        );
        const effectText = this.createContentText(
            this.formatPillEffect(
                definition.effectType,
                definition.baseEffectValue,
            ),
            127,
            10,
        );
        const reasonText = this.createContentText(
            preview.canCraft ? "Sẵn sàng" : this.getCraftFailureLabel(preview.check.reason),
            143,
            10,
        );
        const catalystButton = this.createMenuActionButton(
            "CHỌN CATALYST",
            135,
            25,
            () => {
                const options: Array<string | undefined> = [
                    undefined,
                    ...this.craftingManager
                        .getCompatibleCatalysts(recipeId, true)
                        .map((item) => item.id),
                ];
                const next = (options.indexOf(selectedId) + 1) % options.length;
                this.selectedAlchemyCatalysts.set(recipeId, options[next]);
                this.renderAlchemyTab();
            },
            "#ffffff",
            10,
        );
        const craftButton = this.createMenuActionButton(
            "LUYỆN",
            80,
            25,
            () => {
                this.lastPillCraftResult = this.alchemyManager.craftPill(
                    recipeId,
                    selectedId,
                );
                if (selectedId && !this.inventory.hasItem(selectedId)) {
                    this.selectedAlchemyCatalysts.set(recipeId, undefined);
                }
                this.renderAlchemyTab();
            },
            "#ffffff",
            11,
        );

        nameText.x = x;
        materialsText.x = x;
        resourcesText.x = x;
        effectText.x = x;
        reasonText.x = x;
        reasonText.style.fill = preview.canCraft ? "#86efac" : "#fca5a5";
        distributionText.x = x + 250;
        catalystButton.position.set(x, 158);
        craftButton.position.set(x + 145, 158);
        if (!preview.canCraft) {
            craftButton.eventMode = "none";
            craftButton.alpha = 0.5;
        }
        this.tabContainer.addChild(
            nameText,
            materialsText,
            resourcesText,
            effectText,
            reasonText,
            distributionText,
            catalystButton,
            craftButton,
        );
    }

    private renderLastPillCraftResult(): void {
        const result = this.lastPillCraftResult;

        if (!result) {
            return;
        }

        const definition = result.pillId
            ? this.alchemyManager.getPillDefinition(result.pillId)
            : null;
        const effect = result.pillId && result.rarity
            ? this.alchemyManager.getPillEffectPreview(result.pillId, result.rarity)
            : null;
        const value = result.success && definition && result.rarity && effect
            ? `LUYỆN ĐAN THÀNH CÔNG: ${definition.name} ` +
                `[${EQUIPMENT_RARITY_LABELS[result.rarity]}] | ` +
                this.formatPillEffect(effect.effectType, effect.effectValue)
            : `Luyện Đan thất bại: ${this.getCraftFailureLabel(result.failureReason)}`;
        const text = this.createContentText(value, 5, 11);

        text.x = 150;
        text.style.fill = result.success && result.rarity
            ? EQUIPMENT_RARITY_COLORS[result.rarity]
            : "#fca5a5";
        this.tabContainer.addChild(text);
    }

    private renderActivePillBuff(): void {
        const buff = this.buffManager.getActiveBuffs().find(
            (item) => item.sourceId === "pill:qi_gathering_pill",
        );

        if (!buff) {
            return;
        }

        const text = this.createContentText(
            `BUFF Tụ Khí Đan | Còn: ${this.formatNumber(buff.remainingDuration)}s`,
            5,
            10,
        );
        text.x = 900;
        text.style.fill = "#86efac";
        this.tabContainer.addChild(text);
    }

    private formatPillEffect(
        effectType: PillEffectType,
        effectValue: number,
    ): string {
        if (effectType === PillEffectType.RESTORE_HP) {
            return `Hồi ${this.formatPercent(effectValue)} HP tối đa`;
        }
        if (effectType === PillEffectType.RESTORE_MP) {
            return `Hồi ${this.formatPercent(effectValue)} MP tối đa`;
        }
        return `Tốc độ Tu Luyện +${this.formatPercent(effectValue)}`;
    }

    private renderEquipmentTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.EQUIPMENT],
            0,
            24,
        );
        const realmText = this.createContentText(
            `Cảnh giới: ${CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()]}`,
            5,
            15,
        );
        const statusText = this.createContentText(
            this.equipmentStatusMessage,
            5,
            14,
        );

        realmText.x = 150;
        statusText.x = 350;
        statusText.style.fill = "#fca5a5";
        this.tabContainer.addChild(title, realmText, statusText);

        EQUIPMENT_SLOTS.forEach((slot, index) => {
            this.renderEquipmentSlot(slot, index * 210);
        });

        this.renderOwnedEquipment();
        this.renderDebugRealmButtons();
        this.renderedEquipmentVersion = this.equipmentManager.getVersion();
    }

    private renderEquipmentSlot(
        slot: EquipmentSlot,
        x: number,
    ): void {
        const slotLabel = this.createContentText(
            `${EQUIPMENT_SLOT_LABELS[slot]}:`,
            34,
            15,
        );
        const equipment = this.equipmentManager.getEquippedItem(slot);

        slotLabel.x = x;
        this.tabContainer.addChild(slotLabel);

        if (!equipment) {
            const emptyText = this.createContentText("Trống", 56, 14);

            emptyText.x = x;
            emptyText.style.fill = "#aaaabb";
            this.tabContainer.addChild(emptyText);
            return;
        }

        const definition = equipment.definition;
        const nameText = this.createContentText(definition.name, 55, 14);
        const requirementText = this.createContentText(
            `${EQUIPMENT_RARITY_LABELS[equipment.rarity]} | Yêu cầu: ${CULTIVATION_REALM_LABELS[definition.requiredRealm]}`,
            75,
            11,
        );
        const modifierText = this.createContentText(
            equipment.rolledStats.map((modifier) =>
                this.formatStatModifier(modifier),
            ).join("\n"),
            92,
            11,
        );
        const unequipButton = this.createMenuActionButton(
            "Tháo",
            80,
            26,
            () => {
                if (this.equipmentManager.unequip(slot)) {
                    this.equipmentStatusMessage =
                        `Đã tháo ${definition.name}`;
                    this.renderEquipmentTab();
                }
            },
        );

        nameText.x = x;
        nameText.style.fill =
            EQUIPMENT_RARITY_COLORS[equipment.rarity];
        requirementText.x = x;
        requirementText.style.fill = "#aaaabb";
        modifierText.x = x;
        unequipButton.position.set(x, 142);

        this.tabContainer.addChild(
            nameText,
            requirementText,
            modifierText,
            unequipButton,
        );
    }

    private renderOwnedEquipment(): void {
        const ownedTitle = this.createContentText(
            "TRANG BỊ SỞ HỮU",
            2,
            15,
        );
        const ownedEquipment = this.inventory.getEquipmentInstances();

        ownedTitle.x = 650;
        this.tabContainer.addChild(ownedTitle);

        ownedEquipment.forEach((equipment, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);
            const equippedLabel = this.equipmentManager.isEquipped(
                equipment.instanceId,
            )
                ? " [Đang dùng]"
                : "";
            const shortId = equipment.instanceId.slice(-4);
            const stats = equipment.rolledStats
                .map((modifier) => this.formatStatModifier(modifier))
                .join(", ");
            const button = this.createMenuActionButton(
                `${equipment.definition.name} #${shortId}${equippedLabel}\n${stats}`,
                185,
                32,
                () => {
                    this.attemptEquip(equipment);
                },
                EQUIPMENT_RARITY_COLORS[equipment.rarity],
                9,
            );

            button.position.set(
                650 + column * 195,
                28 + row * 36,
            );
            this.tabContainer.addChild(button);
        });
    }

    private renderDebugRealmButtons(): void {
        const qiRefiningButton = this.createMenuActionButton(
            "Debug: Luyện Khí",
            160,
            26,
            () => {
                this.cultivationSystem.setProgressForDebug(
                    CultivationRealm.QI_REFINING,
                    CultivationStage.EARLY,
                    1,
                );
                this.equipmentStatusMessage = "Đã đặt cảnh giới: Luyện Khí";
                this.renderEquipmentTab();
            },
            "#ffffff",
            12,
        );
        const foundationButton = this.createMenuActionButton(
            "Debug: Trúc Cơ",
            160,
            26,
            () => {
                this.cultivationSystem.setProgressForDebug(
                    CultivationRealm.FOUNDATION_ESTABLISHMENT,
                    CultivationStage.EARLY,
                    1,
                );
                this.equipmentStatusMessage = "Đã đặt cảnh giới: Trúc Cơ";
                this.renderEquipmentTab();
            },
            "#ffffff",
            12,
        );

        qiRefiningButton.position.set(650, 142);
        foundationButton.position.set(820, 142);
        this.tabContainer.addChild(qiRefiningButton, foundationButton);
    }

    private attemptEquip(equipment: EquipmentInstance): void {
        if (this.equipmentManager.equip(equipment)) {
            this.equipmentStatusMessage =
                `Đã trang bị ${equipment.definition.name}`;
        } else {
            this.equipmentStatusMessage =
                `Yêu cầu cảnh giới: ${CULTIVATION_REALM_LABELS[equipment.definition.requiredRealm]}`;
        }

        this.renderEquipmentTab();
    }

    private formatStatModifier(modifier: StatModifier): string {
        const usePercent =
            modifier.type === StatModifierType.PERCENT ||
            RATIO_STATS.has(modifier.stat);
        const value = usePercent
            ? this.formatPercent(modifier.value)
            : this.formatNumber(modifier.value);
        const suffix =
            modifier.stat === StatType.HP_REGEN ||
            modifier.stat === StatType.MP_REGEN
                ? "/s"
                : "";

        return `${STAT_LABELS[modifier.stat]} +${value}${suffix}`;
    }

    private renderTechniqueTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.TECHNIQUES],
            0,
            24,
        );
        const statusText = this.createContentText(
            this.techniqueStatusMessage,
            5,
            14,
        );

        statusText.x = 165;
        statusText.style.fill = "#a7f3d0";
        this.tabContainer.addChild(title, statusText);

        this.techniqueManager
            .getAllTechniques()
            .forEach(({ definition, state }, index) => {
                const x = index * 400;
                const nameText = this.createContentText(
                    definition.name,
                    36,
                    17,
                );
                const levelText = this.createContentText(
                    state.learned
                        ? `Cấp: ${state.level} / ${definition.maxLevel}`
                        : "Chưa học",
                    58,
                    13,
                );
                const milestoneText = this.createContentText(
                    definition.milestones
                        .map((milestone) => {
                            const unlocked =
                                state.learned &&
                                state.level >= milestone.requiredLevel;
                            const description =
                                milestone.description ??
                                milestone.modifiers
                                    .map((modifier) =>
                                        this.formatStatModifier(modifier),
                                    )
                                    .join(", ");

                            return (
                                `${unlocked ? "✓" : "○"} ` +
                                `Cấp ${milestone.requiredLevel}: ${description}`
                            );
                        })
                        .join("\n"),
                    79,
                    11,
                );

                nameText.x = x;
                levelText.x = x;
                milestoneText.x = x;
                levelText.style.fill = state.learned
                    ? "#ffffff"
                    : "#aaaabb";
                this.tabContainer.addChild(
                    nameText,
                    levelText,
                    milestoneText,
                );

                if (!state.learned || state.level < definition.maxLevel) {
                    const actionButton = this.createMenuActionButton(
                        state.learned ? "NÂNG CẤP" : "HỌC",
                        120,
                        28,
                        () => {
                            this.handleTechniqueAction(
                                definition.id,
                                state.learned,
                            );
                        },
                        "#ffffff",
                        12,
                    );

                    actionButton.position.set(x, 142);
                    this.tabContainer.addChild(actionButton);
                } else {
                    const maxLevelText = this.createContentText(
                        "ĐÃ ĐẠT CẤP TỐI ĐA",
                        148,
                        12,
                    );

                    maxLevelText.x = x;
                    maxLevelText.style.fill = "#facc15";
                    this.tabContainer.addChild(maxLevelText);
                }
            });

        this.renderedTechniqueVersion = this.techniqueManager.getVersion();
    }

    private handleTechniqueAction(
        techniqueId: string,
        learned: boolean,
    ): void {
        const definition = this.techniqueManager.getTechniqueDefinition(
            techniqueId,
        );
        const changed = learned
            ? this.techniqueManager.upgradeTechnique(techniqueId)
            : this.techniqueManager.learnTechnique(techniqueId);

        if (changed && definition) {
            this.techniqueStatusMessage = learned
                ? `Đã nâng cấp ${definition.name}`
                : `Đã học ${definition.name}`;
            this.renderTechniqueTab();
        }
    }

    private renderArtifactTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.ARTIFACTS],
            0,
            24,
        );
        const statusText = this.createContentText(
            this.artifactStatusMessage,
            5,
            14,
        );

        statusText.x = 150;
        statusText.style.fill = "#fca5a5";
        this.tabContainer.addChild(title, statusText);

        this.artifactManager
            .getAllArtifactDefinitions()
            .forEach((definition, index) => {
                const state = this.artifactManager.getArtifactState(
                    definition.id,
                );
                const x = index * 400;
                const nameText = this.createContentText(
                    definition.name,
                    36,
                    17,
                );
                const rarityText = this.createContentText(
                    ARTIFACT_RARITY_LABELS[definition.rarity],
                    58,
                    12,
                );
                const ownershipText = this.createContentText(
                    state.owned
                        ? state.equipped
                            ? "Đã sở hữu | ĐANG TRANG BỊ"
                            : "Đã sở hữu"
                        : `Mảnh: ${state.fragmentCount} / ${ARTIFACT_FRAGMENTS_REQUIRED}`,
                    76,
                    13,
                );
                const modifierText = this.createContentText(
                    definition.baseModifiers
                        .map((modifier) => this.formatStatModifier(modifier))
                        .join("\n"),
                    96,
                    12,
                );

                nameText.x = x;
                rarityText.x = x;
                ownershipText.x = x;
                modifierText.x = x;
                nameText.style.fill =
                    ARTIFACT_RARITY_COLORS[definition.rarity];
                rarityText.style.fill = "#aaaabb";

                this.tabContainer.addChild(
                    nameText,
                    rarityText,
                    ownershipText,
                    modifierText,
                );

                this.renderArtifactActions(definition.id, state.owned, state.equipped, x);
            });

        this.renderedArtifactVersion = this.artifactManager.getVersion();
    }

    private renderArtifactActions(
        artifactId: string,
        owned: boolean,
        equipped: boolean,
        x: number,
    ): void {
        const debugButton = this.createMenuActionButton(
            "+10 Mảnh",
            105,
            28,
            () => {
                this.artifactManager.addFragments(artifactId, 10);
                this.artifactStatusMessage = "Đã thêm 10 mảnh debug";
                this.renderArtifactTab();
            },
            "#ffffff",
            12,
        );

        debugButton.position.set(x, 142);
        this.tabContainer.addChild(debugButton);

        if (!owned) {
            if (this.artifactManager.canCraft(artifactId)) {
                const craftButton = this.createMenuActionButton(
                    "GHÉP",
                    105,
                    28,
                    () => {
                        if (this.artifactManager.craft(artifactId)) {
                            this.artifactStatusMessage = "Ghép Pháp Bảo thành công";
                            this.renderArtifactTab();
                        }
                    },
                    "#ffffff",
                    12,
                );

                craftButton.position.set(x + 115, 142);
                this.tabContainer.addChild(craftButton);
            } else {
                const insufficientText = this.createContentText(
                    "Chưa đủ mảnh",
                    148,
                    12,
                );

                insufficientText.x = x + 115;
                insufficientText.style.fill = "#aaaabb";
                this.tabContainer.addChild(insufficientText);
            }

            return;
        }

        const actionButton = this.createMenuActionButton(
            equipped ? "THÁO" : "TRANG BỊ",
            105,
            28,
            () => {
                const changed = equipped
                    ? this.artifactManager.unequip()
                    : this.artifactManager.equip(artifactId);

                if (changed) {
                    this.artifactStatusMessage = equipped
                        ? "Đã tháo Pháp Bảo"
                        : "Đã trang bị Pháp Bảo";
                    this.renderArtifactTab();
                }
            },
            "#ffffff",
            12,
        );

        actionButton.position.set(x + 115, 142);
        this.tabContainer.addChild(actionButton);
    }

    private renderInventoryTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_PLACEHOLDERS[MenuTab.INVENTORY],
            0,
            24,
        );
        const inventoryItems = this.inventory.getItems();
        const pillStacks = this.inventory.getPillStacks();
        const equipmentInstances = this.inventory.getEquipmentInstances();
        let displayIndex = 0;

        this.tabContainer.addChild(title);

        if (
            inventoryItems.length === 0 &&
            pillStacks.length === 0 &&
            equipmentInstances.length === 0
        ) {
            this.tabContainer.addChild(
                this.createContentText("Túi đồ đang trống.", 38, 16),
            );
        } else {
            inventoryItems.forEach((inventoryItem) => {
                const { x, y } = this.getInventoryCellPosition(displayIndex);
                const nameText = this.createContentText(
                    `${inventoryItem.item.name} x${inventoryItem.quantity}`,
                    y,
                    14,
                );
                const detailsText = this.createContentText(
                    isMaterialDefinition(inventoryItem.item)
                        ? `${MATERIAL_CATEGORY_LABELS[inventoryItem.item.materialCategory]} | Tier ${inventoryItem.item.tier}`
                        : `${ITEM_TYPE_LABELS[inventoryItem.item.type]} | ${ITEM_RARITY_LABELS[inventoryItem.item.rarity]}`,
                    y + 17,
                    11,
                );

                nameText.x = x;
                detailsText.x = x;
                detailsText.style.fill = "#aaaabb";
                this.tabContainer.addChild(nameText, detailsText);

                if (isCraftingCatalyst(inventoryItem.item)) {
                    const catalystText = this.createContentText(
                        `Loại: ${CRAFTING_CATALYST_TYPE_LABELS[inventoryItem.item.catalystType]} | ` +
                            `Rarity Luck: +${this.formatNumber(inventoryItem.item.rarityLuckBonus)}`,
                        y + 31,
                        10,
                    );

                    catalystText.x = x;
                    catalystText.style.fill = "#f0abfc";
                    this.tabContainer.addChild(catalystText);
                }

                displayIndex += 1;
            });

            pillStacks.forEach((stack) => {
                const definition = this.alchemyManager.getPillDefinition(
                    stack.definitionId,
                );
                const preview = this.alchemyManager.getPillEffectPreview(
                    stack.definitionId,
                    stack.rarity,
                );

                if (!definition || !preview) {
                    return;
                }

                const { x, y } = this.getInventoryCellPosition(displayIndex);
                const nameText = this.createContentText(
                    `${definition.name} [${EQUIPMENT_RARITY_LABELS[stack.rarity]}] x${stack.quantity}`,
                    y,
                    13,
                );
                const effectText = this.createContentText(
                    this.formatPillEffect(preview.effectType, preview.effectValue),
                    y + 17,
                    10,
                );
                const useButton = this.createMenuActionButton(
                    "DÙNG",
                    65,
                    22,
                    () => {
                        this.alchemyManager.usePill(
                            stack.definitionId,
                            stack.rarity,
                        );
                        this.renderInventoryTab();
                    },
                    "#ffffff",
                    10,
                );

                nameText.x = x;
                nameText.style.fill = EQUIPMENT_RARITY_COLORS[stack.rarity];
                effectText.x = x;
                useButton.position.set(x + 210, y + 8);
                this.tabContainer.addChild(nameText, effectText, useButton);
                displayIndex += 1;
            });

            equipmentInstances.forEach((equipment) => {
                const { x, y } = this.getInventoryCellPosition(displayIndex);
                const definition = equipment.definition;
                const equippedLabel = this.equipmentManager.isEquipped(
                    equipment.instanceId,
                )
                    ? " | Đang Trang Bị"
                    : "";
                const nameText = this.createContentText(
                    `${definition.name} #${equipment.instanceId.slice(-4)}`,
                    y,
                    13,
                );
                const detailsText = this.createContentText(
                    `${EQUIPMENT_RARITY_LABELS[equipment.rarity]} | ${CULTIVATION_REALM_LABELS[definition.requiredRealm]}${equippedLabel}`,
                    y + 15,
                    10,
                );
                const statsText = this.createContentText(
                    equipment.rolledStats
                        .map((modifier) => this.formatStatModifier(modifier))
                        .join(" | "),
                    y + 29,
                    10,
                );

                nameText.x = x;
                detailsText.x = x;
                statsText.x = x;
                nameText.style.fill =
                    EQUIPMENT_RARITY_COLORS[equipment.rarity];
                detailsText.style.fill = "#aaaabb";
                this.tabContainer.addChild(
                    nameText,
                    detailsText,
                    statsText,
                );
                displayIndex += 1;
            });
        }

        const addButton = this.createInventoryDebugButton(
            "+ Linh Thảo",
            () => {
                this.inventory.addItem(ITEM_DATA.SPIRIT_HERB);
            },
        );
        const removeButton = this.createInventoryDebugButton(
            "- Linh Thảo",
            () => {
                this.inventory.removeItem(ITEM_DATA.SPIRIT_HERB.id);
            },
        );

        addButton.position.set(940, 0);
        removeButton.position.set(1090, 0);
        this.tabContainer.addChild(addButton, removeButton);

        this.renderedInventoryVersion = this.inventory.getVersion();
    }

    private getInventoryCellPosition(index: number): {
        x: number;
        y: number;
    } {
        return {
            x: (index % 4) * 300,
            y: 32 + Math.floor(index / 4) * 64,
        };
    }

    private createInventoryDebugButton(
        label: string,
        action: () => void,
    ): Container {
        return this.createMenuActionButton(
            label,
            140,
            34,
            action,
        );
    }

    private createMenuActionButton(
        label: string,
        width: number,
        height: number,
        action: () => void,
        textColor = "#ffffff",
        fontSize = 14,
    ): Container {
        const button = new Container();
        const background = new Graphics()
            .roundRect(0, 0, width, height, 4)
            .fill({ color: "#3c3c4d" })
            .stroke({ color: "#77778c", width: 1 });
        const text = new Text({
            text: label,
            style: {
                fill: textColor,
                fontSize,
                fontWeight: "bold",
            },
        });

        button.eventMode = "static";
        button.cursor = "pointer";
        text.anchor.set(0.5);
        text.position.set(width / 2, height / 2);

        button.addChild(background, text);
        button.on("pointertap", action);

        return button;
    }

    private update(deltaMS: number): void {
        if (!this.openState) {
            return;
        }

        if (this.activeTab === MenuTab.INVENTORY) {
            this.refreshInventoryTab();
            return;
        }

        if (this.activeTab === MenuTab.EQUIPMENT) {
            this.refreshEquipmentTab();
            return;
        }

        if (this.activeTab === MenuTab.ARTIFACTS) {
            this.refreshArtifactTab();
            return;
        }

        if (this.activeTab === MenuTab.TECHNIQUES) {
            this.refreshTechniqueTab();
            return;
        }

        if (this.activeTab === MenuTab.SKILLS) {
            this.refreshTimer += deltaMS;

            if (this.refreshTimer >= CHARACTER_REFRESH_INTERVAL) {
                this.refreshTimer = 0;
                this.renderSkillTab();
            }

            return;
        }

        if (this.activeTab === MenuTab.REFINING) {
            this.refreshTimer += deltaMS;

            if (this.refreshTimer >= CHARACTER_REFRESH_INTERVAL) {
                this.refreshTimer = 0;
                this.renderRefiningTab();
            }

            return;
        }

        if (this.activeTab === MenuTab.ALCHEMY) {
            this.refreshTimer += deltaMS;

            if (this.refreshTimer >= CHARACTER_REFRESH_INTERVAL) {
                this.refreshTimer = 0;
                this.renderAlchemyTab();
            }

            return;
        }

        if (
            this.activeTab !== MenuTab.CHARACTER &&
            this.activeTab !== MenuTab.CULTIVATION
        ) {
            return;
        }

        this.refreshTimer += deltaMS;

        if (this.refreshTimer < CHARACTER_REFRESH_INTERVAL) {
            return;
        }

        this.refreshTimer = 0;
        if (this.activeTab === MenuTab.CHARACTER) {
            this.updateCharacterTexts();
        } else {
            this.updateCultivationTexts();
        }
    }

    private refreshInventoryTab(): void {
        if (this.renderedInventoryVersion === this.inventory.getVersion()) {
            return;
        }

        this.renderInventoryTab();
    }

    private refreshEquipmentTab(): void {
        if (this.renderedEquipmentVersion === this.equipmentManager.getVersion()) {
            return;
        }

        this.renderEquipmentTab();
    }

    private refreshArtifactTab(): void {
        if (this.renderedArtifactVersion === this.artifactManager.getVersion()) {
            return;
        }

        this.renderArtifactTab();
    }

    private refreshTechniqueTab(): void {
        if (
            this.renderedTechniqueVersion ===
            this.techniqueManager.getVersion()
        ) {
            return;
        }

        this.renderTechniqueTab();
    }

    private updateCharacterTexts(): void {
        if (
            !this.characterPrimaryStatsText ||
            !this.characterSecondaryStatsText ||
            !this.characterProgressText
        ) {
            return;
        }

        this.characterPrimaryStatsText.text = [
            `HP: ${this.formatNumber(this.player.getHp())} / ${this.formatNumber(this.player.getMaxHp())}`,
            `MP: ${this.formatNumber(this.player.getMp())} / ${this.formatNumber(this.player.getMaxMp())}`,
            `Công: ${this.formatNumber(this.player.getAttack())}`,
            `Thủ: ${this.formatNumber(this.player.getDefense())}`,
        ].join("\n");

        this.characterSecondaryStatsText.text = [
            `Tỷ lệ bạo kích: ${this.formatPercent(this.player.getCritRate())}`,
            `Sát thương bạo kích: ${this.formatPercent(this.player.getCritDamage())}`,
            `Tốc độ tu luyện: ${this.formatPercent(this.player.getCultivationSpeed())}`,
            `Hồi kỹ năng: ${this.formatPercent(this.player.getSkillCooldownRecovery())}`,
        ].join("\n");

        this.characterProgressText.text = [
            `Cảnh giới: ${CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()]} - ${CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()]} - Tầng ${this.cultivationSystem.getLayer()}`,
            `Hồi HP: ${this.formatNumber(this.player.getHpRegen())} / giây`,
            `Hồi MP: ${this.formatNumber(this.player.getMpRegen())} / giây`,
            `Chương: ${this.stageSystem.getChapter()}`,
            `Ải: ${this.stageSystem.getStage()}`,
            `Linh Thạch: ${this.getSpiritStone()}`,
        ].join("\n");
    }

    private formatPercent(value: number): string {
        return `${this.formatNumber(value * 100)}%`;
    }

    private formatNumber(value: number): string {
        return value.toFixed(2);
    }

    private updateTabButtonStyles(): void {
        for (const [tab, background] of this.tabButtonBackgrounds) {
            this.drawTabButton(background, tab === this.activeTab);
        }
    }

    private drawTabButton(
        background: Graphics,
        active: boolean,
    ): void {
        background
            .clear()
            .roundRect(0, 0, TAB_BUTTON_WIDTH, TAB_BUTTON_HEIGHT, 4)
            .fill({
                color: active ? TAB_ACTIVE_COLOR : TAB_NORMAL_COLOR,
            })
            .stroke({
                color: active ? "#9999cc" : "#555566",
                width: 1,
            });
    }

    private createToggleButton(): Container {
        const button = new Container();
        const background = new Graphics()
            .roundRect(0, 0, 100, 32, 4)
            .fill({ color: "#3c3c4d" })
            .stroke({ color: "#77778c", width: 1 });

        button.x = GAME_WIDTH - 120;
        button.y = GAME_HEIGHT - 42;
        button.eventMode = "static";
        button.cursor = "pointer";

        this.toggleButtonText.anchor.set(0.5);
        this.toggleButtonText.x = 50;
        this.toggleButtonText.y = 16;

        button.addChild(background);
        button.addChild(this.toggleButtonText);
        button.on("pointertap", () => {
            this.toggle();
        });

        return button;
    }
}
