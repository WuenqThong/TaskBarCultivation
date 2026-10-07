import {
    Application,
    Assets,
    Container,
    Graphics,
    Sprite,
    Text,
    Texture,
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
} from "../cultivation/CultivationRealm";
import { CultivationSystem } from "../cultivation/CultivationSystem";
import type { BreakthroughRewardSystem } from "../cultivation/BreakthroughRewardSystem";
import { Player } from "../entities/Player";
import type { EquipmentInstance } from "../equipment/EquipmentInstance";
import {
    EquipmentComparisonService,
    type EquipmentComparison,
} from "../equipment/EquipmentComparisonService";
import { EquipmentManager } from "../equipment/EquipmentManager";
import type { EquipmentSalvageManager } from "../equipment/EquipmentSalvageManager";
import { EquipmentSalvageFailReason } from "../equipment/EquipmentSalvageManager";
import type { EquipmentStatUnlockManager } from "../equipment/EquipmentStatUnlockManager";
import { EquipmentStatUnlockFailReason } from "../equipment/EquipmentStatUnlockManager";
import type { EquipmentRerollManager } from "../equipment/EquipmentRerollManager";
import { EquipmentRerollFailReason } from "../equipment/EquipmentRerollManager";
import { CURRENT_MAX_STAT_LINE_COUNT } from "../equipment/equipmentConfig";
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
import { isMaterialDefinition } from "../materials/Material";
import { MATERIAL_CATEGORY_LABELS } from "../materials/MaterialCategory";
import { MATERIAL_DEFINITIONS } from "../materials/materialData";
import type { SkillManager } from "../skills/SkillManager";
import type { CraftingManager } from "../crafting/CraftingManager";
import { CraftFailReason } from "../crafting/CraftingResult";
import type { EquipmentCraftResult } from "../refining/EquipmentCraftResult";
import type { RefiningManager } from "../refining/RefiningManager";
import type { SaveManager } from "../save/SaveManager";
import { StatModifierType } from "../stats/StatModifier";
import type { StatModifier } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import { StageSystem } from "../systems/StageSystem";
import { TechniqueManager } from "../techniques/TechniqueManager";
import { MenuTab } from "./MenuTab";
import {
    createMenuActionButton as createThemedMenuActionButton,
    drawMenuPanelBackground,
} from "./menu/MenuComponents";
import { MENU_COLORS, MENU_FONT, MENU_LAYOUT } from "./menu/MenuTheme";
import { MENU_ASSETS } from "./menu/MenuAssets";
import { UI_ASSETS } from "../../ui/core/UIAssetRegistry";
import { CultivationPanel } from "./menu/panels/CultivationPanel";
import { SettingsPanel } from "./menu/panels/SettingsPanel";
import { SkillsPanel } from "./menu/panels/SkillsPanel";

const GAME_WIDTH = MENU_LAYOUT.gameWidth;
const GAME_HEIGHT = MENU_LAYOUT.gameplayHeight;
const MENU_HEIGHT = MENU_LAYOUT.menuHeight;
const OPEN_HEIGHT = MENU_LAYOUT.openHeight;
const TAB_BUTTON_WIDTH = 146;
const TAB_BUTTON_HEIGHT = MENU_LAYOUT.tabHeight;
const TAB_BUTTON_GAP = 4;
const CHARACTER_REFRESH_INTERVAL = 250;
const INVENTORY_PAGE_SIZE = 8;
const EQUIPMENT_PAGE_SIZE = 6;
const UNIFIED_LOADOUT_PAGE_SIZE = 20;
const UNIFIED_LOADOUT_WIDTH = 800;
const UNIFIED_LOADOUT_HEIGHT = 600;
const REFINING_RARITY_ORDER: ReadonlyArray<EquipmentRarity> = [
    EquipmentRarity.WHITE,
    EquipmentRarity.GREEN,
    EquipmentRarity.BLUE,
    EquipmentRarity.PURPLE,
    EquipmentRarity.GOLD,
    EquipmentRarity.RED,
];

const TAB_LABELS: ReadonlyArray<readonly [MenuTab, string]> = [
    [MenuTab.CHARACTER, "Nhân Vật & Hành Trang"],
    [MenuTab.REFINING, "Luyện Khí"],
    [MenuTab.ALCHEMY, "Luyện Đan"],
    [MenuTab.SKILLS, "Kỹ Năng"],
    [MenuTab.CULTIVATION, "Tu Luyện"],
    [MenuTab.TECHNIQUES, "Công Pháp"],
    [MenuTab.ARTIFACTS, "Pháp Bảo"],
    [MenuTab.SETTINGS, "Cài Đặt"],
];

const TAB_TITLES: Readonly<Record<MenuTab, string>> = {
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
    private equipmentSalvageManager: EquipmentSalvageManager;
    private equipmentStatUnlockManager: EquipmentStatUnlockManager;
    private equipmentRerollManager: EquipmentRerollManager;
    private equipmentComparisonService = new EquipmentComparisonService();
    private artifactManager: ArtifactManager;
    private techniqueManager: TechniqueManager;
    private skillManager: SkillManager;
    private breakthroughRewardSystem: BreakthroughRewardSystem;
    private refiningManager: RefiningManager;
    private craftingManager: CraftingManager;
    private alchemyManager: AlchemyManager;
    private buffManager: BuffManager;
    private getSpiritStone: () => number;
    private spendSpiritStone: (amount: number) => boolean;
    private saveManager: SaveManager;
    private onPersistentStateChanged: () => void;
    private container: Container;
    private panel: Container;
    private menuChromeContainer: Container;
    private tabNavigationContainer: Container;
    private contentHostContainer: Container;
    private overlayContainer: Container;
    private toggleButton: Container;
    private toggleButtonText: Text;
    private tabContainer: Container;
    private tabButtonBackgrounds: Map<MenuTab, Graphics>;
    private activeTab: MenuTab;
    private openState: boolean;
    private refreshTimer: number;
    private renderedInventoryVersion: number;
    private renderedEquipmentVersion: number;
    private renderedEquipmentInventoryVersion: number;
    private renderedArtifactVersion: number;
    private renderedTechniqueVersion: number;
    private equipmentStatusMessage: string;
    private inventoryStatusMessage: string;
    private inventoryPage: number;
    private equipmentPage: number;
    private pendingSalvageInstanceId: string | null;
    private pendingStatUnlockInstanceId: string | null;
    private selectedRerollInstanceId: string | null;
    private pendingRerollInstanceId: string | null;
    private artifactStatusMessage: string;
    private techniqueStatusMessage: string;
    private selectedRefiningCatalysts: Map<string, string | undefined>;
    private lastEquipmentCraftResult: EquipmentCraftResult | null;
    private selectedAlchemyCatalysts: Map<string, string | undefined>;
    private lastPillCraftResult: PillCraftResult | null;
    private cultivationPanel: CultivationPanel | null;
    private skillsPanel: SkillsPanel | null;

    constructor(
        app: Application,
        player: Player,
        stageSystem: StageSystem,
        cultivationSystem: CultivationSystem,
        inventory: Inventory,
        equipmentManager: EquipmentManager,
        equipmentSalvageManager: EquipmentSalvageManager,
        equipmentStatUnlockManager: EquipmentStatUnlockManager,
        equipmentRerollManager: EquipmentRerollManager,
        artifactManager: ArtifactManager,
        techniqueManager: TechniqueManager,
        skillManager: SkillManager,
        breakthroughRewardSystem: BreakthroughRewardSystem,
        refiningManager: RefiningManager,
        craftingManager: CraftingManager,
        alchemyManager: AlchemyManager,
        buffManager: BuffManager,
        getSpiritStone: () => number,
        spendSpiritStone: (amount: number) => boolean,
        saveManager: SaveManager,
        onPersistentStateChanged: () => void,
    ) {
        this.app = app;
        this.player = player;
        this.stageSystem = stageSystem;
        this.cultivationSystem = cultivationSystem;
        this.inventory = inventory;
        this.equipmentManager = equipmentManager;
        this.equipmentSalvageManager = equipmentSalvageManager;
        this.equipmentStatUnlockManager = equipmentStatUnlockManager;
        this.equipmentRerollManager = equipmentRerollManager;
        this.artifactManager = artifactManager;
        this.techniqueManager = techniqueManager;
        this.skillManager = skillManager;
        this.breakthroughRewardSystem = breakthroughRewardSystem;
        this.refiningManager = refiningManager;
        this.craftingManager = craftingManager;
        this.alchemyManager = alchemyManager;
        this.buffManager = buffManager;
        this.getSpiritStone = getSpiritStone;
        this.spendSpiritStone = spendSpiritStone;
        this.saveManager = saveManager;
        this.onPersistentStateChanged = onPersistentStateChanged;
        this.container = new Container();
        this.container.label = "bottom-menu-root";
        this.menuChromeContainer = new Container();
        this.menuChromeContainer.label = "bottom-menu-chrome";
        this.tabNavigationContainer = new Container();
        this.tabNavigationContainer.label = "bottom-menu-navigation";
        this.contentHostContainer = new Container();
        this.contentHostContainer.label = "bottom-menu-content-host";
        this.overlayContainer = new Container();
        this.overlayContainer.label = "bottom-menu-overlays";
        this.tabContainer = new Container();
        this.tabContainer.label = "menu-tab-character";
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
        this.renderedEquipmentInventoryVersion = -1;
        this.renderedArtifactVersion = -1;
        this.renderedTechniqueVersion = -1;
        this.equipmentStatusMessage = "";
        this.inventoryStatusMessage = "";
        this.inventoryPage = 0;
        this.equipmentPage = 0;
        this.pendingSalvageInstanceId = null;
        this.pendingStatUnlockInstanceId = null;
        this.selectedRerollInstanceId = null;
        this.pendingRerollInstanceId = null;
        this.artifactStatusMessage = "";
        this.techniqueStatusMessage = "";
        this.selectedRefiningCatalysts = new Map();
        this.lastEquipmentCraftResult = null;
        this.selectedAlchemyCatalysts = new Map();
        this.lastPillCraftResult = null;
        this.cultivationPanel = null;
        this.skillsPanel = null;

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
            this.renderUnifiedLoadoutTab();
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
            this.skillsPanel?.refresh();
        }

        if (this.activeTab === MenuTab.REFINING) {
            this.renderRefiningTab();
        }

        if (this.activeTab === MenuTab.ALCHEMY) {
            this.renderAlchemyTab();
        }

        if (this.activeTab === MenuTab.CULTIVATION) {
            this.cultivationPanel?.refresh();
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

    public openTab(tab: MenuTab): void {
        const normalizedTab = this.normalizeLoadoutTab(tab);
        this.activeTab = normalizedTab;
        this.open();
        this.switchTab(normalizedTab);
    }

    public setLegacyToggleVisible(visible: boolean): void {
        this.toggleButton.visible = visible;
    }

    private createPanel(): Container {
        const panel = new Container();
        const background = new Graphics();
        drawMenuPanelBackground(background, GAME_WIDTH, MENU_HEIGHT);
        const title = new Text({
            text: "TIÊN LỘ · HỆ THỐNG",
            style: {
                fill: MENU_COLORS.bronzeBright,
                fontSize: MENU_FONT.title,
                fontWeight: "bold",
            },
        });
        panel.label = "bottom-menu-panel";

        panel.y = GAME_HEIGHT;
        panel.visible = false;

        title.x = 20;
        title.y = 14;
        this.tabNavigationContainer.x = 20;
        this.tabNavigationContainer.y = 45;
        this.contentHostContainer.x = 20;
        this.contentHostContainer.y = MENU_LAYOUT.contentTop;

        TAB_LABELS.forEach(([tab, label], index) => {
            const button = this.createTabButton(label, tab);

            button.x = index * (TAB_BUTTON_WIDTH + TAB_BUTTON_GAP);
            this.tabNavigationContainer.addChild(button);
        });

        this.menuChromeContainer.addChild(background, title, this.tabNavigationContainer);
        this.contentHostContainer.addChild(this.tabContainer);
        panel.addChild(
            this.menuChromeContainer,
            this.contentHostContainer,
            this.overlayContainer,
        );

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
                fill: MENU_COLORS.text,
                fontSize: MENU_FONT.tab,
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
        tab = this.normalizeLoadoutTab(tab);
        if (tab === this.activeTab) {
            if (tab === MenuTab.CHARACTER) this.renderUnifiedLoadoutTab();
            return;
        }

        this.activeTab = tab;
        this.refreshTimer = 0;
        this.renderActiveTab();
        this.updateTabButtonStyles();
    }

    private renderActiveTab(): void {
        this.contentHostContainer.removeChildren();
        this.tabContainer = new Container();
        this.tabContainer.label = `menu-tab-${this.activeTab}`;
        this.contentHostContainer.addChild(this.tabContainer);

        this.cultivationPanel = null;
        this.skillsPanel = null;

        if (this.activeTab === MenuTab.CHARACTER) {
            this.renderUnifiedLoadoutTab();
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
            text: TAB_TITLES[this.activeTab],
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
        const panel = new SettingsPanel(
            this.saveManager,
            this.onPersistentStateChanged,
        );
        this.tabContainer.addChild(panel.getView());
    }

    private normalizeLoadoutTab(tab: MenuTab): MenuTab {
        return tab === MenuTab.EQUIPMENT || tab === MenuTab.INVENTORY
            ? MenuTab.CHARACTER
            : tab;
    }

    private renderUnifiedLoadoutTab(): void {
        this.tabContainer.removeChildren();

        const backgroundX = Math.round((GAME_WIDTH - 40 - UNIFIED_LOADOUT_WIDTH) / 2);
        const backgroundTexture = Assets.get<Texture>(MENU_ASSETS.loadout.main) ?? Texture.EMPTY;
        backgroundTexture.source.scaleMode = "nearest";
        const background = new Sprite(backgroundTexture);
        background.position.set(backgroundX, 0);
        background.width = UNIFIED_LOADOUT_WIDTH;
        background.height = UNIFIED_LOADOUT_HEIGHT;
        background.roundPixels = true;
        this.tabContainer.addChild(background);

        const sx = UNIFIED_LOADOUT_WIDTH / 1448;
        const sy = UNIFIED_LOADOUT_HEIGHT / 1086;
        const px = (originalX: number) => Math.round(backgroundX + originalX * sx);
        const py = (originalY: number) => Math.round(originalY * sy);

        const portraitTexture = Assets.get<Texture>(UI_ASSETS.playerPortrait) ?? Texture.EMPTY;
        const portrait = new Sprite(portraitTexture);
        portrait.anchor.set(0.5);
        portrait.position.set(px(382), py(470));
        portrait.scale.set(4.2);
        portrait.roundPixels = true;
        this.tabContainer.addChild(portrait);

        const realm = CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()];
        const header = this.createContentText(
            `NHÂN VẬT · ${realm} · Tầng ${this.cultivationSystem.getLayer()} · Chương ${this.stageSystem.getChapter()} / Ải ${this.stageSystem.getStage()}`,
            py(196),
            12,
        );
        header.x = px(755);
        header.style.fill = MENU_COLORS.bronzeBright;
        this.tabContainer.addChild(header);

        const status = this.createContentText(
            this.inventoryStatusMessage || this.equipmentStatusMessage || "Bấm trang bị trong túi để mặc · bấm ô đang mặc để tháo",
            py(221),
            9,
        );
        status.x = px(755);
        status.style.fill = this.inventoryStatusMessage || this.equipmentStatusMessage
            ? "#fbbf24"
            : MENU_COLORS.textMuted;
        status.style.wordWrap = true;
        status.style.wordWrapWidth = Math.round(520 * sx);
        this.tabContainer.addChild(status);

        const equippedSlotPositions = [
            { slot: EquipmentSlot.WEAPON, x: 113, y: 214 },
            { slot: EquipmentSlot.ARMOR, x: 113, y: 335 },
            { slot: EquipmentSlot.BRACELET, x: 113, y: 455 },
        ] as const;

        for (const slotPosition of equippedSlotPositions) {
            const equipment = this.equipmentManager.getEquippedItem(slotPosition.slot);
            const label = this.createContentText(
                equipment?.definition.name ?? EQUIPMENT_SLOT_LABELS[slotPosition.slot],
                py(slotPosition.y + 70),
                8,
            );
            label.x = px(slotPosition.x - 4);
            label.style.fill = equipment
                ? EQUIPMENT_RARITY_COLORS[equipment.rarity]
                : MENU_COLORS.textMuted;
            label.style.wordWrap = true;
            label.style.wordWrapWidth = Math.round(105 * sx);
            this.tabContainer.addChild(label);

            if (equipment) {
                const hit = new Graphics()
                    .rect(px(slotPosition.x), py(slotPosition.y), Math.round(100 * sx), Math.round(100 * sy))
                    .fill({ color: 0xffffff, alpha: 0.001 });
                hit.eventMode = "static";
                hit.cursor = "pointer";
                hit.on("pointertap", () => {
                    if (this.equipmentManager.unequip(slotPosition.slot)) {
                        this.inventoryStatusMessage = `Đã tháo ${equipment.definition.name}`;
                        this.saveManager.requestSave();
                        this.renderUnifiedLoadoutTab();
                    }
                });
                this.tabContainer.addChild(hit);
            }
        }

        const inventoryItems = this.inventory.getItems();
        const pillStacks = this.inventory.getPillStacks();
        const equipmentInstances = this.inventory.getEquipmentInstances();
        const entries: Array<{
            name: string;
            detail: string;
            color: string | number;
            action?: () => void;
        }> = [];

        for (const inventoryItem of inventoryItems) {
            entries.push({
                name: `${inventoryItem.item.name} x${inventoryItem.quantity}`,
                detail: isMaterialDefinition(inventoryItem.item)
                    ? `Tier ${inventoryItem.item.tier}`
                    : ITEM_TYPE_LABELS[inventoryItem.item.type],
                color: MENU_COLORS.text,
            });
        }

        for (const stack of pillStacks) {
            const definition = this.alchemyManager.getPillDefinition(stack.definitionId);
            if (!definition) continue;
            entries.push({
                name: `${definition.name} x${stack.quantity}`,
                detail: "Bấm để dùng",
                color: EQUIPMENT_RARITY_COLORS[stack.rarity],
                action: () => {
                    this.alchemyManager.usePill(stack.definitionId, stack.rarity);
                    this.inventoryStatusMessage = `Đã dùng ${definition.name}`;
                    this.saveManager.requestSave();
                    this.renderUnifiedLoadoutTab();
                },
            });
        }

        for (const equipment of equipmentInstances) {
            const equipped = this.equipmentManager.isEquipped(equipment.instanceId);
            entries.push({
                name: equipment.definition.name,
                detail: equipped ? "Đang mặc" : `${EQUIPMENT_RARITY_LABELS[equipment.rarity]} · Bấm để mặc`,
                color: EQUIPMENT_RARITY_COLORS[equipment.rarity],
                action: equipped
                    ? undefined
                    : () => {
                        if (this.equipmentManager.equip(equipment)) {
                            this.inventoryStatusMessage = `Đã trang bị ${equipment.definition.name}`;
                            this.saveManager.requestSave();
                        } else {
                            this.inventoryStatusMessage = `Chưa đủ cảnh giới để dùng ${equipment.definition.name}`;
                        }
                        this.renderUnifiedLoadoutTab();
                    },
            });
        }

        const pageCount = Math.max(1, Math.ceil(entries.length / UNIFIED_LOADOUT_PAGE_SIZE));
        this.inventoryPage = Math.min(this.inventoryPage, pageCount - 1);
        const visibleEntries = entries.slice(
            this.inventoryPage * UNIFIED_LOADOUT_PAGE_SIZE,
            (this.inventoryPage + 1) * UNIFIED_LOADOUT_PAGE_SIZE,
        );

        visibleEntries.forEach((entry, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const cellX = 750 + col * 110;
            const cellY = 270 + row * 108;
            const name = this.createContentText(entry.name, py(cellY + 10), 7);
            name.x = px(cellX + 8);
            name.style.fill = entry.color;
            name.style.wordWrap = true;
            name.style.wordWrapWidth = Math.round(92 * sx);
            const detail = this.createContentText(entry.detail, py(cellY + 58), 6);
            detail.x = px(cellX + 8);
            detail.style.fill = MENU_COLORS.textMuted;
            detail.style.wordWrap = true;
            detail.style.wordWrapWidth = Math.round(92 * sx);
            this.tabContainer.addChild(name, detail);

            if (entry.action) {
                const hit = new Graphics()
                    .rect(px(cellX), py(cellY), Math.round(100 * sx), Math.round(92 * sy))
                    .fill({ color: 0xffffff, alpha: 0.001 });
                hit.eventMode = "static";
                hit.cursor = "pointer";
                hit.on("pointertap", entry.action);
                this.tabContainer.addChild(hit);
            }
        });

        if (pageCount > 1) {
            const previous = this.createMenuActionButton("‹", 28, 20, () => {
                this.inventoryPage = Math.max(0, this.inventoryPage - 1);
                this.renderUnifiedLoadoutTab();
            }, "#f4dfaa", 10);
            const page = this.createContentText(`Trang ${this.inventoryPage + 1}/${pageCount}`, py(735), 8);
            const next = this.createMenuActionButton("›", 28, 20, () => {
                this.inventoryPage = Math.min(pageCount - 1, this.inventoryPage + 1);
                this.renderUnifiedLoadoutTab();
            }, "#f4dfaa", 10);
            previous.position.set(px(1010), py(730));
            page.x = px(1065);
            next.position.set(px(1160), py(730));
            this.tabContainer.addChild(previous, page, next);
        }

        const stats = [
            `HP\n${this.formatNumber(this.player.getHp())}/${this.formatNumber(this.player.getMaxHp())}`,
            `MP\n${this.formatNumber(this.player.getMp())}/${this.formatNumber(this.player.getMaxMp())}`,
            `CÔNG\n${this.formatNumber(this.player.getAttack())}`,
            `THỦ\n${this.formatNumber(this.player.getDefense())}`,
            `BẠO KÍCH\n${this.formatPercent(this.player.getCritRate())}`,
            `LINH THẠCH\n${this.formatNumber(this.getSpiritStone())}`,
        ];
        stats.forEach((value, index) => {
            const stat = this.createContentText(value, py(855), 8);
            stat.x = px(285 + index * 155);
            stat.style.fill = index < 2 ? MENU_COLORS.jadeBright : MENU_COLORS.bronzeBright;
            stat.style.align = "center";
            stat.style.wordWrap = true;
            stat.style.wordWrapWidth = Math.round(120 * sx);
            this.tabContainer.addChild(stat);
        });

        this.renderedInventoryVersion = this.inventory.getVersion();
        this.renderedEquipmentVersion = this.equipmentManager.getVersion();
        this.renderedEquipmentInventoryVersion = this.inventory.getVersion();
    }

    private renderCultivationTab(): void {
        this.cultivationPanel = new CultivationPanel(
            this.cultivationSystem,
            this.breakthroughRewardSystem,
        );
        this.tabContainer.addChild(this.cultivationPanel.getView());
    }

    private createContentText(
        value: string,
        y: number,
        fontSize = 18,
    ): Text {
        const text = new Text({
            text: value,
            style: {
                fill: MENU_COLORS.text,
                fontSize,
                fontWeight: "bold",
            },
        });

        text.y = y;

        return text;
    }

    private renderSkillTab(): void {
        this.skillsPanel = new SkillsPanel(
            this.skillManager,
            this.getSpiritStone,
            this.spendSpiritStone,
        );
        this.tabContainer.addChild(this.skillsPanel.getView());
    }

    private renderRefiningTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_TITLES[MenuTab.REFINING],
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
        this.tabContainer.addChild(
            this.createAssetFrame(
                MENU_ASSETS.inventory.detailPanes[2],
                x - 8,
                25,
                392,
                178,
                0.72,
            ),
        );
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
            this.createContentText(TAB_TITLES[MenuTab.ALCHEMY], 0, 24),
        );
        this.renderLastPillCraftResult();
        this.renderActivePillBuff();

        this.alchemyManager.getPillRecipes().forEach((recipe, index) => {
            this.renderAlchemyRecipe(recipe.id, index * 410);
        });
    }

    private renderAlchemyRecipe(recipeId: string, x: number): void {
        this.tabContainer.addChild(
            this.createAssetFrame(
                MENU_ASSETS.inventory.detailPanes[3],
                x - 8,
                25,
                392,
                178,
                0.72,
            ),
        );
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
            TAB_TITLES[MenuTab.EQUIPMENT],
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

        this.renderEquipmentPaperDoll();
        const slotPositions = [
            { x: 0, y: 44 },
            { x: 420, y: 44 },
            { x: 420, y: 142 },
        ] as const;
        EQUIPMENT_SLOTS.forEach((slot, index) => {
            const position = slotPositions[index];
            this.renderEquipmentSlot(slot, position.x, position.y);
        });

        const selectedEquipment = this.selectedRerollInstanceId
            ? this.inventory.getEquipmentInstance(this.selectedRerollInstanceId)
            : null;

        if (selectedEquipment) {
            this.renderRerollDetail(selectedEquipment);
        } else {
            this.selectedRerollInstanceId = null;
            this.pendingRerollInstanceId = null;
            this.renderOwnedEquipment();
        }
        this.renderedEquipmentVersion = this.equipmentManager.getVersion();
        this.renderedEquipmentInventoryVersion = this.inventory.getVersion();
    }

    private renderEquipmentSlot(
        slot: EquipmentSlot,
        x: number,
        y: number,
    ): void {
        this.tabContainer.addChild(
            this.createAssetFrame(
                MENU_ASSETS.inventory.detailPanes[1],
                x - 6,
                y - 6,
                194,
                92,
                0.78,
            ),
        );
        const slotLabel = this.createContentText(
            `${EQUIPMENT_SLOT_LABELS[slot]}:`,
            y,
            12,
        );
        const equipment = this.equipmentManager.getEquippedItem(slot);

        slotLabel.x = x;
        this.tabContainer.addChild(slotLabel);

        if (!equipment) {
            const emptyText = this.createContentText("Trống", y + 25, 12);

            emptyText.x = x;
            emptyText.style.fill = "#aaaabb";
            this.tabContainer.addChild(emptyText);
            return;
        }

        const definition = equipment.definition;
        const nameText = this.createContentText(definition.name, y + 20, 11);
        const requirementText = this.createContentText(
            `${EQUIPMENT_RARITY_LABELS[equipment.rarity]} | ` +
            `Dòng: ${equipment.rolledStats.length} / ${CURRENT_MAX_STAT_LINE_COUNT} | ` +
            `Yêu cầu: ${CULTIVATION_REALM_LABELS[definition.requiredRealm]}`,
            y + 36,
            9,
        );
        const modifierText = this.createContentText(
            equipment.rolledStats.map((modifier) =>
                this.formatStatModifier(modifier),
            ).join(" · "),
            y + 51,
            9,
        );
        modifierText.style.wordWrap = true;
        modifierText.style.wordWrapWidth = 180;
        const unequipButton = this.createMenuActionButton(
            "Tháo",
            54,
            20,
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
        unequipButton.position.set(x, y + 70);

        this.tabContainer.addChild(
            nameText,
            requirementText,
            modifierText,
            unequipButton,
        );
        this.renderStatUnlockAction(equipment, x + 60, y + 70);
        const rerollButton = this.createMenuActionButton(
            "TẨY",
            44,
            20,
            () => this.openRerollDetail(equipment.instanceId),
            "#c4b5fd",
            9,
        );

        rerollButton.position.set(x + 136, y + 70);
        this.tabContainer.addChild(rerollButton);
    }

    private renderEquipmentPaperDoll(): void {
        const frame = this.createAssetFrame(
            MENU_ASSETS.inventory.rarityFrame,
            208,
            42,
            188,
            188,
            0.88,
        );
        const portraitTexture = Assets.get<Texture>(UI_ASSETS.playerPortrait);
        const portrait = new Sprite(portraitTexture ?? Texture.EMPTY);
        portrait.anchor.set(0.5);
        portrait.position.set(302, 140);
        portrait.scale.set(3.8);
        portrait.roundPixels = true;

        const label = this.createContentText("PAPER DOLL", 210, 10);
        label.x = 270;
        label.style.fill = MENU_COLORS.jadeBright;
        this.tabContainer.addChild(frame, portrait, label);
    }

    private renderOwnedEquipment(): void {
        const ownedTitle = this.createContentText(
            "TRANG BỊ SỞ HỮU",
            2,
            15,
        );
        const ownedEquipment = this.inventory.getEquipmentInstances();
        const pageCount = Math.max(
            1,
            Math.ceil(ownedEquipment.length / EQUIPMENT_PAGE_SIZE),
        );
        this.equipmentPage = Math.min(this.equipmentPage, pageCount - 1);
        const pageStart = this.equipmentPage * EQUIPMENT_PAGE_SIZE;
        const visibleEquipment = ownedEquipment.slice(
            pageStart,
            pageStart + EQUIPMENT_PAGE_SIZE,
        );

        ownedTitle.x = 650;
        this.tabContainer.addChild(ownedTitle);

        visibleEquipment.forEach((equipment, index) => {
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
            const comparison = this.equipmentComparisonService.compare(
                this.player,
                this.equipmentManager,
                equipment,
            );
            const comparisonSummary = this.formatEquipmentComparisonSummary(comparison);
            const button = this.createMenuActionButton(
                `${equipment.definition.name} #${shortId}${equippedLabel} ` +
                `[${equipment.rolledStats.length}/${CURRENT_MAX_STAT_LINE_COUNT}]\n` +
                `${stats}\n${comparisonSummary}`,
                110,
                44,
                () => {
                    this.attemptEquip(equipment);
                },
                EQUIPMENT_RARITY_COLORS[equipment.rarity],
                9,
            );

            button.position.set(
                650 + column * 195,
                28 + row * 76,
            );
            this.tabContainer.addChild(button);
            this.renderStatUnlockAction(
                equipment,
                765 + column * 195,
                28 + row * 76,
            );
            const rerollButton = this.createMenuActionButton(
                "TẨY",
                78,
                22,
                () => this.openRerollDetail(equipment.instanceId),
                "#c4b5fd",
                9,
            );

            rerollButton.position.set(
                765 + column * 195,
                54 + row * 76,
            );
            this.tabContainer.addChild(rerollButton);
        });

        this.renderEquipmentPagination(pageCount);
    }

    private renderEquipmentPagination(pageCount: number): void {
        if (pageCount <= 1) return;

        const previous = this.createMenuActionButton(
            "‹",
            34,
            22,
            () => {
                this.equipmentPage = Math.max(0, this.equipmentPage - 1);
                this.renderEquipmentTab();
            },
            this.equipmentPage > 0 ? "#f4dfaa" : "#5c655f",
            11,
        );
        const next = this.createMenuActionButton(
            "›",
            34,
            22,
            () => {
                this.equipmentPage = Math.min(pageCount - 1, this.equipmentPage + 1);
                this.renderEquipmentTab();
            },
            this.equipmentPage < pageCount - 1 ? "#f4dfaa" : "#5c655f",
            11,
        );
        const label = this.createContentText(
            `${this.equipmentPage + 1}/${pageCount}`,
            190,
            10,
        );

        if (this.equipmentPage <= 0) {
            previous.eventMode = "none";
            previous.alpha = 0.45;
        }
        if (this.equipmentPage >= pageCount - 1) {
            next.eventMode = "none";
            next.alpha = 0.45;
        }

        previous.position.set(1040, 185);
        label.x = 1082;
        next.position.set(1120, 185);
        this.tabContainer.addChild(previous, label, next);
    }

    private openRerollDetail(instanceId: string): void {
        this.selectedRerollInstanceId = instanceId;
        this.pendingRerollInstanceId = null;
        this.equipmentStatusMessage = "Chọn các dòng cần giữ, sau đó Tẩy Luyện.";
        this.renderEquipmentTab();
    }

    private renderRerollDetail(equipment: EquipmentInstance): void {
        const title = this.createContentText(
            `TẨY LUYỆN - ${equipment.definition.name}`,
            2,
            15,
        );
        const preview = this.equipmentRerollManager.getRerollPreview(
            equipment.instanceId,
        );
        const closeButton = this.createMenuActionButton(
            "QUAY LẠI",
            76,
            22,
            () => {
                this.selectedRerollInstanceId = null;
                this.pendingRerollInstanceId = null;
                this.renderEquipmentTab();
            },
            "#ffffff",
            9,
        );

        title.x = 650;
        closeButton.position.set(1195, 0);
        this.tabContainer.addChild(title, closeButton);

        const comparison = this.equipmentComparisonService.compare(
            this.player,
            this.equipmentManager,
            equipment,
        );
        const affixPoolText = this.createContentText(
            `Pool: ${comparison.affixPool.map((stat) => STAT_LABELS[stat]).join(" / ")} | ` +
            `Roll: ${Math.round(comparison.averageRollQuality * 100)}% | ` +
            this.formatEquipmentComparisonSummary(comparison),
            20,
            9,
        );

        affixPoolText.x = 650;
        affixPoolText.style.fill = this.getEquipmentComparisonColor(comparison);
        this.tabContainer.addChild(affixPoolText);

        equipment.rolledStats.forEach((modifier, index) => {
            const locked = equipment.lockedStatIndices.includes(index);
            const statText = this.createContentText(
                this.formatStatModifier(modifier),
                34 + index * 30,
                12,
            );
            const lockButton = this.createMenuActionButton(
                locked ? "ĐÃ KHÓA" : "KHÓA",
                72,
                24,
                () => this.toggleRerollLock(equipment.instanceId, index),
                locked ? "#fbbf24" : "#ffffff",
                9,
            );

            statText.x = 650;
            lockButton.position.set(825, 30 + index * 30);
            this.tabContainer.addChild(statText, lockButton);
        });

        const costText = this.createContentText(
            preview
                ? `Chi phí (${preview.lockedCount} khóa):\n` +
                    `Luyện Khí Tinh Hoa: ${preview.ownedEssence}/${preview.cost.essence}\n` +
                    `Linh Thạch: ${preview.ownedSpiritStone}/${preview.cost.spiritStone}`
                : "Không thể Tẩy Luyện khi đã khóa tất cả dòng.",
            34,
            12,
        );

        costText.x = 920;
        costText.style.fill = preview ? "#e5e7eb" : "#fca5a5";
        this.tabContainer.addChild(costText);

        if (this.pendingRerollInstanceId === equipment.instanceId) {
            const warning = this.createContentText(
                "Các thuộc tính không khóa sẽ bị thay đổi.",
                128,
                11,
            );
            const confirmButton = this.createMenuActionButton(
                "XÁC NHẬN",
                82,
                26,
                () => this.confirmEquipmentReroll(equipment.instanceId),
                "#fbbf24",
                10,
            );
            const cancelButton = this.createMenuActionButton(
                "HỦY",
                52,
                26,
                () => {
                    this.pendingRerollInstanceId = null;
                    this.renderEquipmentTab();
                },
                "#ffffff",
                10,
            );

            warning.x = 650;
            confirmButton.position.set(900, 124);
            cancelButton.position.set(988, 124);
            this.tabContainer.addChild(warning, confirmButton, cancelButton);
            return;
        }

        const rerollButton = this.createMenuActionButton(
            "TẨY LUYỆN",
            110,
            28,
            () => this.beginEquipmentReroll(equipment.instanceId),
            "#c4b5fd",
            11,
        );

        rerollButton.position.set(920, 124);
        this.tabContainer.addChild(rerollButton);
    }

    private toggleRerollLock(instanceId: string, statIndex: number): void {
        const result = this.equipmentRerollManager.toggleStatLock(
            instanceId,
            statIndex,
        );

        this.pendingRerollInstanceId = null;
        this.equipmentStatusMessage = result.success
            ? result.locked ? "Đã khóa dòng thuộc tính." : "Đã mở khóa dòng thuộc tính."
            : this.getRerollFailureMessage(
                result.reason ?? EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );

        if (result.success) {
            this.saveManager.requestSave();
        }

        this.renderEquipmentTab();
    }

    private beginEquipmentReroll(instanceId: string): void {
        const check = this.equipmentRerollManager.canReroll(instanceId);
        const preview = this.equipmentRerollManager.getRerollPreview(instanceId);

        if (!check.success) {
            this.pendingRerollInstanceId = null;
            this.equipmentStatusMessage = this.getRerollFailureMessage(
                check.reason ?? EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
            this.renderEquipmentTab();
            return;
        }

        this.pendingStatUnlockInstanceId = null;
        this.pendingRerollInstanceId = instanceId;
        this.equipmentStatusMessage = preview
            ? `Xác nhận chi ${preview.cost.essence} Tinh Hoa và ` +
                `${preview.cost.spiritStone} Linh Thạch. Chưa roll stat.`
            : "Không thể tạo preview Tẩy Luyện.";
        this.renderEquipmentTab();
    }

    private confirmEquipmentReroll(instanceId: string): void {
        const result = this.equipmentRerollManager.reroll(instanceId);

        this.pendingRerollInstanceId = null;

        if (!result.success || !result.previousStats || !result.newStats ||
            !result.rerolledIndices) {
            this.equipmentStatusMessage = this.getRerollFailureMessage(
                result.reason ?? EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
            this.renderEquipmentTab();
            return;
        }

        const before = result.rerolledIndices.map((index) =>
            this.formatStatModifier(result.previousStats![index]),
        ).join(", ");
        const after = result.rerolledIndices.map((index) =>
            this.formatStatModifier(result.newStats![index]),
        ).join(", ");

        this.equipmentStatusMessage =
            `TẨY LUYỆN THÀNH CÔNG | Trước: ${before} | Sau: ${after}`;
        this.saveManager.requestSave();
        this.renderEquipmentTab();
    }

    private getRerollFailureMessage(
        reason: EquipmentRerollFailReason,
    ): string {
        if (reason === EquipmentRerollFailReason.ITEM_NOT_FOUND) {
            return "Không tìm thấy trang bị.";
        }
        if (reason === EquipmentRerollFailReason.NO_STATS) {
            return "Trang bị không có thuộc tính để Tẩy Luyện.";
        }
        if (reason === EquipmentRerollFailReason.ALL_STATS_LOCKED) {
            return "Không thể Tẩy Luyện: tất cả dòng đã khóa.";
        }
        if (reason === EquipmentRerollFailReason.NOT_ENOUGH_ESSENCE) {
            return "Không đủ Luyện Khí Tinh Hoa.";
        }
        if (reason === EquipmentRerollFailReason.NOT_ENOUGH_SPIRIT_STONE) {
            return "Không đủ Linh Thạch.";
        }
        return "Cấu hình thuộc tính trang bị không hợp lệ.";
    }

    private attemptEquip(equipment: EquipmentInstance): void {
        const comparison = this.equipmentComparisonService.compare(
            this.player,
            this.equipmentManager,
            equipment,
        );

        if (this.equipmentManager.equip(equipment)) {
            this.equipmentStatusMessage =
                `Đã trang bị ${equipment.definition.name} | ` +
                this.formatEquipmentComparisonSummary(comparison);
        } else {
            this.equipmentStatusMessage =
                `Yêu cầu cảnh giới: ${CULTIVATION_REALM_LABELS[equipment.definition.requiredRealm]}`;
        }

        this.renderEquipmentTab();
    }

    private renderStatUnlockAction(
        equipment: EquipmentInstance,
        x: number,
        y: number,
    ): void {
        if (
            equipment.unlockedStatLineCount >= CURRENT_MAX_STAT_LINE_COUNT ||
            equipment.rolledStats.length >= CURRENT_MAX_STAT_LINE_COUNT
        ) {
            const maxText = this.createContentText("ĐÃ TỐI ĐA", y + 5, 9);

            maxText.x = x;
            maxText.style.fill = "#86efac";
            this.tabContainer.addChild(maxText);
            return;
        }

        if (this.pendingStatUnlockInstanceId === equipment.instanceId) {
            const confirmButton = this.createMenuActionButton(
                "XÁC NHẬN",
                54,
                24,
                () => this.confirmStatLineUnlock(equipment.instanceId),
                "#fbbf24",
                8,
            );
            const cancelButton = this.createMenuActionButton(
                "HỦY",
                30,
                24,
                () => {
                    this.pendingStatUnlockInstanceId = null;
                    this.setStatUnlockStatus("Đã hủy mở dòng thuộc tính");
                    this.renderActiveTab();
                },
                "#ffffff",
                8,
            );

            confirmButton.position.set(x, y);
            cancelButton.position.set(x + 57, y);
            this.tabContainer.addChild(confirmButton, cancelButton);
            return;
        }

        const unlockButton = this.createMenuActionButton(
            "MỞ DÒNG",
            78,
            24,
            () => this.beginStatLineUnlock(equipment.instanceId),
            "#67e8f9",
            9,
        );

        unlockButton.position.set(x, y);
        this.tabContainer.addChild(unlockButton);
    }

    private beginStatLineUnlock(instanceId: string): void {
        const preview = this.equipmentStatUnlockManager.getUnlockPreview(
            instanceId,
        );
        const check = this.equipmentStatUnlockManager.canUnlockNextStatLine(
            instanceId,
        );

        if (!preview || !check.success) {
            this.pendingStatUnlockInstanceId = null;
            const failureMessage = this.getStatUnlockFailureMessage(
                    check.reason ?? EquipmentStatUnlockFailReason.INVALID_EQUIPMENT,
                );
            this.setStatUnlockStatus(preview
                ? `${failureMessage} ` +
                    `Tinh Hoa ${preview.ownedEssence}/${preview.cost.essence}, ` +
                    `Linh Thạch ${preview.ownedSpiritStone}/${preview.cost.spiritStone}.`
                : failureMessage);
            this.renderActiveTab();
            return;
        }

        this.pendingSalvageInstanceId = null;
        this.pendingStatUnlockInstanceId = instanceId;
        this.setStatUnlockStatus(
            `Mở dòng ${preview.targetLine} cho ${preview.equipmentName}? ` +
            `Luyện Khí Tinh Hoa ${preview.ownedEssence}/${preview.cost.essence}, ` +
            `Linh Thạch ${preview.ownedSpiritStone}/${preview.cost.spiritStone}. ` +
            "Stat mới chưa được roll.",
        );
        this.renderActiveTab();
    }

    private confirmStatLineUnlock(instanceId: string): void {
        const result = this.equipmentStatUnlockManager.unlockNextStatLine(
            instanceId,
        );

        this.pendingStatUnlockInstanceId = null;

        if (!result.success || !result.equipment || !result.newModifier) {
            this.setStatUnlockStatus(
                this.getStatUnlockFailureMessage(
                    result.reason ?? EquipmentStatUnlockFailReason.INVALID_EQUIPMENT,
                ),
            );
            this.renderActiveTab();
            return;
        }

        this.setStatUnlockStatus(
            `MỞ DÒNG THÀNH CÔNG: ${result.equipment.definition.name} - ` +
            `${this.formatStatModifier(result.newModifier)}`,
        );
        this.saveManager.requestSave();
        this.renderActiveTab();
    }

    private setStatUnlockStatus(message: string): void {
        this.equipmentStatusMessage = message;
        this.inventoryStatusMessage = message;
    }

    private getStatUnlockFailureMessage(
        reason: EquipmentStatUnlockFailReason,
    ): string {
        if (reason === EquipmentStatUnlockFailReason.ITEM_NOT_FOUND) {
            return "Không tìm thấy trang bị.";
        }

        if (reason === EquipmentStatUnlockFailReason.MAX_LINES_REACHED) {
            return "Đã mở tối đa số dòng hiện tại.";
        }

        if (reason === EquipmentStatUnlockFailReason.NOT_ENOUGH_ESSENCE) {
            return "Không đủ Luyện Khí Tinh Hoa.";
        }

        if (reason === EquipmentStatUnlockFailReason.NOT_ENOUGH_SPIRIT_STONE) {
            return "Không đủ Linh Thạch.";
        }

        if (reason === EquipmentStatUnlockFailReason.INVALID_STAT_POOL) {
            return "Không còn thuộc tính hợp lệ để mở.";
        }

        return "Dữ liệu trang bị không hợp lệ.";
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

    private formatEquipmentComparisonSummary(
        comparison: EquipmentComparison,
    ): string {
        const gradeLabel: Readonly<Record<EquipmentComparison["grade"], string>> = {
            upgrade: "NÂNG CẤP",
            sidegrade: "ĐỔI BUILD",
            downgrade: "GIẢM SỨC MẠNH",
            equipped: "ĐANG DÙNG",
        };
        const dpsDelta = comparison.dpsDeltaPercent * 100;
        const dpsText = comparison.grade === "equipped"
            ? `DPS ${this.formatNumber(comparison.projectedEstimatedDps)}`
            : `DPS ${dpsDelta >= 0 ? "+" : ""}${dpsDelta.toFixed(1)}%`;
        const importantDeltas = comparison.statDeltas
            .filter((entry) => Math.abs(entry.delta) > 0.000001)
            .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
            .slice(0, 2)
            .map((entry) => {
                const percent = RATIO_STATS.has(entry.stat);
                const value = percent
                    ? `${entry.delta >= 0 ? "+" : ""}${(entry.delta * 100).toFixed(1)}%`
                    : `${entry.delta >= 0 ? "+" : ""}${this.formatNumber(entry.delta)}`;
                return `${STAT_LABELS[entry.stat]} ${value}`;
            })
            .join(" | ");
        const tags = comparison.buildTags.length > 0
            ? comparison.buildTags.join("/")
            : "Thuần stat";

        return `${gradeLabel[comparison.grade]} | ${dpsText}` +
            `${importantDeltas ? ` | ${importantDeltas}` : ""}` +
            ` | ${tags} | Roll ${Math.round(comparison.averageRollQuality * 100)}%`;
    }

    private getEquipmentComparisonColor(comparison: EquipmentComparison): string {
        if (comparison.grade === "upgrade") {
            return "#86efac";
        }
        if (comparison.grade === "downgrade") {
            return "#fca5a5";
        }
        if (comparison.grade === "sidegrade") {
            return "#fde68a";
        }
        return "#93c5fd";
    }

    private renderTechniqueTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_TITLES[MenuTab.TECHNIQUES],
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
                this.tabContainer.addChild(
                    this.createAssetFrame(
                        MENU_ASSETS.inventory.detailPanes[index % MENU_ASSETS.inventory.detailPanes.length],
                        x - 8,
                        27,
                        382,
                        166,
                        state.learned ? 0.76 : 0.52,
                    ),
                );
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
        } else if (!learned) {
            this.techniqueStatusMessage =
                `Đã dùng ${this.techniqueManager.getLearnedTechniqueCount()} / ${this.breakthroughRewardSystem.getTechniqueSlotCount()} ô Công Pháp. Hãy đột phá để mở thêm.`;
            this.renderTechniqueTab();
        }
    }

    private renderArtifactTab(): void {
        this.tabContainer.removeChildren();

        const title = this.createContentText(
            TAB_TITLES[MenuTab.ARTIFACTS],
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
                this.tabContainer.addChild(
                    this.createAssetFrame(
                        MENU_ASSETS.inventory.detailPanes[index % MENU_ASSETS.inventory.detailPanes.length],
                        x - 8,
                        27,
                        382,
                        166,
                        state.equipped ? 0.86 : 0.72,
                    ),
                );
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
                } else if (!equipped && this.breakthroughRewardSystem.getArtifactSlotCount() < 1) {
                    this.artifactStatusMessage = "Chưa mở ô Pháp Bảo. Hãy tiếp tục đột phá.";
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
            TAB_TITLES[MenuTab.INVENTORY],
            0,
            24,
        );
        const inventoryItems = this.inventory.getItems();
        const pillStacks = this.inventory.getPillStacks();
        const equipmentInstances = this.inventory.getEquipmentInstances();
        const totalEntries =
            inventoryItems.length + pillStacks.length + equipmentInstances.length;
        const pageCount = Math.max(1, Math.ceil(totalEntries / INVENTORY_PAGE_SIZE));
        this.inventoryPage = Math.min(this.inventoryPage, pageCount - 1);
        const pageStart = this.inventoryPage * INVENTORY_PAGE_SIZE;
        const pageEnd = pageStart + INVENTORY_PAGE_SIZE;
        let displayIndex = 0;
        const statusText = this.createContentText(
            this.inventoryStatusMessage,
            5,
            12,
        );

        statusText.x = 165;
        statusText.style.fill = "#fbbf24";
        this.tabContainer.addChild(title, statusText);

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
                const entryIndex = displayIndex;
                displayIndex += 1;
                if (entryIndex < pageStart || entryIndex >= pageEnd) return;
                const { x, y } = this.getInventoryCellPosition(entryIndex - pageStart);
                this.tabContainer.addChild(
                    this.createAssetFrame(
                        MENU_ASSETS.inventory.detailPanes[entryIndex % MENU_ASSETS.inventory.detailPanes.length],
                        x - 8,
                        y - 8,
                        286,
                        70,
                        0.72,
                    ),
                );
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

            });

            pillStacks.forEach((stack) => {
                const entryIndex = displayIndex;
                displayIndex += 1;
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

                if (entryIndex < pageStart || entryIndex >= pageEnd) return;

                const { x, y } = this.getInventoryCellPosition(entryIndex - pageStart);
                this.tabContainer.addChild(
                    this.createAssetFrame(
                        MENU_ASSETS.inventory.detailPanes[entryIndex % MENU_ASSETS.inventory.detailPanes.length],
                        x - 8,
                        y - 8,
                        286,
                        70,
                        0.72,
                    ),
                );
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
            });

            equipmentInstances.forEach((equipment) => {
                const entryIndex = displayIndex;
                displayIndex += 1;
                if (entryIndex < pageStart || entryIndex >= pageEnd) return;
                const { x, y } = this.getInventoryCellPosition(entryIndex - pageStart);
                this.tabContainer.addChild(
                    this.createAssetFrame(
                        MENU_ASSETS.inventory.detailPanes[entryIndex % MENU_ASSETS.inventory.detailPanes.length],
                        x - 8,
                        y - 8,
                        286,
                        70,
                        0.72,
                    ),
                );
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
                    `${EQUIPMENT_RARITY_LABELS[equipment.rarity]} | ` +
                    `Dòng ${equipment.rolledStats.length}/${CURRENT_MAX_STAT_LINE_COUNT} | ` +
                    `${CULTIVATION_REALM_LABELS[definition.requiredRealm]}${equippedLabel}`,
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

                this.renderInventoryEquipmentActions(equipment, x, y);
            });

            this.renderInventoryPagination(pageCount);
        }

        this.renderedInventoryVersion = this.inventory.getVersion();
    }

    private renderInventoryEquipmentActions(
        equipment: EquipmentInstance,
        x: number,
        y: number,
    ): void {
        const equipped = this.equipmentManager.isEquipped(equipment.instanceId);
        const comparison = this.equipmentComparisonService.compare(
            this.player,
            this.equipmentManager,
            equipment,
        );

        if (this.pendingStatUnlockInstanceId === equipment.instanceId) {
            this.renderStatUnlockAction(equipment, x, y + 42);
            return;
        }

        if (equipped) {
            const unequipButton = this.createMenuActionButton(
                "THÁO",
                62,
                20,
                () => {
                    if (this.equipmentManager.unequip(equipment.definition.slot)) {
                        this.inventoryStatusMessage =
                            `Đã tháo ${equipment.definition.name}. ` +
                            "Có thể tháo rã trang bị này.";
                        this.renderInventoryTab();
                    }
                },
                "#ffffff",
                9,
            );
            const protectedText = this.createContentText(
                "Không thể tháo rã khi đang dùng",
                y + 46,
                9,
            );

            unequipButton.position.set(x, y + 42);
            this.renderStatUnlockAction(equipment, x + 70, y + 42);
            protectedText.x = x + 154;
            protectedText.style.fill = "#fca5a5";
            this.tabContainer.addChild(unequipButton, protectedText);
            return;
        }

        if (this.pendingSalvageInstanceId === equipment.instanceId) {
            const confirmButton = this.createMenuActionButton(
                "XÁC NHẬN",
                82,
                20,
                () => this.confirmEquipmentSalvage(equipment.instanceId),
                "#fbbf24",
                9,
            );
            const cancelButton = this.createMenuActionButton(
                "HỦY",
                55,
                20,
                () => {
                    this.pendingSalvageInstanceId = null;
                    this.inventoryStatusMessage = "Đã hủy tháo rã";
                    this.renderInventoryTab();
                },
                "#ffffff",
                9,
            );

            confirmButton.position.set(x, y + 42);
            cancelButton.position.set(x + 90, y + 42);
            this.tabContainer.addChild(confirmButton, cancelButton);
            return;
        }

        const equipButton = this.createMenuActionButton(
            "TRANG BỊ",
            65,
            20,
            () => {
                if (this.equipmentManager.equip(equipment)) {
                    this.inventoryStatusMessage =
                        `Đã trang bị ${equipment.definition.name} | ` +
                        this.formatEquipmentComparisonSummary(comparison);
                } else {
                    this.inventoryStatusMessage =
                        `Yêu cầu cảnh giới: ` +
                        CULTIVATION_REALM_LABELS[equipment.definition.requiredRealm];
                }

                this.renderInventoryTab();
            },
            "#ffffff",
            9,
        );
        const salvageButton = this.createMenuActionButton(
            "THÁO RÃ",
            65,
            20,
            () => this.beginEquipmentSalvage(equipment.instanceId),
            "#fbbf24",
            9,
        );

        equipButton.position.set(x, y + 42);
        salvageButton.position.set(x + 70, y + 42);
        this.tabContainer.addChild(equipButton, salvageButton);
        this.renderStatUnlockAction(equipment, x + 140, y + 42);
    }

    private beginEquipmentSalvage(instanceId: string): void {
        const check = this.equipmentSalvageManager.canSalvage(instanceId);
        const preview = this.equipmentSalvageManager.getSalvagePreview(instanceId);
        const equipment = this.inventory.getEquipmentInstance(instanceId);

        if (!check.success || !preview) {
            this.inventoryStatusMessage = this.getSalvageFailureMessage(
                check.reason ?? EquipmentSalvageFailReason.INVALID_EQUIPMENT,
            );
            this.pendingSalvageInstanceId = null;
            this.renderInventoryTab();
            return;
        }

        this.pendingSalvageInstanceId = instanceId;
        this.pendingStatUnlockInstanceId = null;
        const comparison = equipment
            ? this.equipmentComparisonService.compare(
                this.player,
                this.equipmentManager,
                equipment,
            )
            : null;
        this.inventoryStatusMessage =
            `Tháo rã ${preview.equipmentName} ` +
            `[${EQUIPMENT_RARITY_LABELS[preview.rarity]}]? ` +
            `Nhận ${preview.essenceName} x${preview.essenceQuantity}` +
            (comparison
                ? ` | ${this.formatEquipmentComparisonSummary(comparison)}`
                : "");
        this.renderInventoryTab();
    }

    private confirmEquipmentSalvage(instanceId: string): void {
        const result = this.equipmentSalvageManager.salvage(instanceId);

        this.pendingSalvageInstanceId = null;

        if (!result.success || !result.preview) {
            this.inventoryStatusMessage = this.getSalvageFailureMessage(
                result.reason ?? EquipmentSalvageFailReason.INVALID_EQUIPMENT,
            );
            this.renderInventoryTab();
            return;
        }

        this.inventoryStatusMessage =
            `Đã tháo rã ${result.preview.equipmentName} ` +
            `[${EQUIPMENT_RARITY_LABELS[result.preview.rarity]}]. ` +
            `Nhận ${result.preview.essenceName} ` +
            `x${result.preview.essenceQuantity}`;
        this.saveManager.requestSave();
        this.renderInventoryTab();
    }

    private getSalvageFailureMessage(
        reason: EquipmentSalvageFailReason,
    ): string {
        if (reason === EquipmentSalvageFailReason.ITEM_NOT_FOUND) {
            return "Không tìm thấy trang bị cần tháo rã.";
        }

        if (reason === EquipmentSalvageFailReason.ITEM_CURRENTLY_EQUIPPED) {
            return "Không thể tháo rã trang bị đang sử dụng.";
        }

        if (reason === EquipmentSalvageFailReason.REWARD_CAPACITY_EXCEEDED) {
            return "Không đủ chỗ chứa Luyện Khí Tinh Hoa.";
        }

        return "Trang bị không hợp lệ, không thể tháo rã.";
    }

    private getInventoryCellPosition(index: number): {
        x: number;
        y: number;
    } {
        return {
            x: (index % 4) * 300,
            y: 34 + Math.floor(index / 4) * 72,
        };
    }

    private renderInventoryPagination(pageCount: number): void {
        if (pageCount <= 1) return;

        const previous = this.createMenuActionButton(
            "‹ TRƯỚC",
            92,
            22,
            () => {
                this.inventoryPage = Math.max(0, this.inventoryPage - 1);
                this.renderInventoryTab();
            },
            this.inventoryPage > 0 ? "#f4dfaa" : "#5c655f",
            10,
        );
        const next = this.createMenuActionButton(
            "SAU ›",
            92,
            22,
            () => {
                this.inventoryPage = Math.min(pageCount - 1, this.inventoryPage + 1);
                this.renderInventoryTab();
            },
            this.inventoryPage < pageCount - 1 ? "#f4dfaa" : "#5c655f",
            10,
        );
        const pageText = this.createContentText(
            `Trang ${this.inventoryPage + 1} / ${pageCount}`,
            209,
            10,
        );

        if (this.inventoryPage <= 0) {
            previous.eventMode = "none";
            previous.alpha = 0.45;
        }
        if (this.inventoryPage >= pageCount - 1) {
            next.eventMode = "none";
            next.alpha = 0.45;
        }

        previous.position.set(470, 204);
        pageText.x = 578;
        next.position.set(655, 204);
        this.tabContainer.addChild(previous, pageText, next);
    }

    private createAssetFrame(
        asset: string,
        x: number,
        y: number,
        width: number,
        height: number,
        alpha = 1,
    ): Sprite {
        const texture = Assets.get<Texture>(asset) ?? Texture.EMPTY;
        texture.source.scaleMode = "nearest";
        const sprite = new Sprite(texture);
        sprite.position.set(Math.round(x), Math.round(y));
        sprite.width = Math.round(width);
        sprite.height = Math.round(height);
        sprite.alpha = alpha;
        sprite.roundPixels = true;
        return sprite;
    }

    private createMenuActionButton(
        label: string,
        width: number,
        height: number,
        action: () => void,
        textColor = "#ffffff",
        fontSize = 14,
    ): Container {
        const parsedColor = Number.parseInt(textColor.replace("#", ""), 16);
        return createThemedMenuActionButton(
            label,
            width,
            height,
            action,
            Number.isFinite(parsedColor) ? parsedColor : MENU_COLORS.text,
            fontSize,
        );
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
                this.skillsPanel?.refresh();
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
            this.renderUnifiedLoadoutTab();
        } else {
            this.cultivationPanel?.refresh();
        }
    }

    private refreshInventoryTab(): void {
        if (this.renderedInventoryVersion === this.inventory.getVersion()) {
            return;
        }

        this.renderInventoryTab();
    }

    private refreshEquipmentTab(): void {
        if (
            this.renderedEquipmentVersion === this.equipmentManager.getVersion() &&
            this.renderedEquipmentInventoryVersion === this.inventory.getVersion()
        ) {
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
                color: active ? MENU_COLORS.panelAlt : MENU_COLORS.panel,
            })
            .stroke({
                color: active ? MENU_COLORS.jadeBright : MENU_COLORS.bronzeDark,
                width: active ? 2 : 1,
            });
    }

    private createToggleButton(): Container {
        const button = createThemedMenuActionButton(
            "",
            100,
            32,
            () => this.toggle(),
            MENU_COLORS.text,
            MENU_FONT.tab,
        );

        button.x = GAME_WIDTH - 120;
        button.y = GAME_HEIGHT - 42;

        this.toggleButtonText.anchor.set(0.5);
        this.toggleButtonText.x = 50;
        this.toggleButtonText.y = 16;

        button.addChild(this.toggleButtonText);

        return button;
    }
}
