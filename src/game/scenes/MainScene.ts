import {
    Application,
    Container,
    Text,
} from "pixi.js";

import gsap from "gsap";
import { AlchemyManager } from "../alchemy/AlchemyManager";
import { PILL_DEFINITIONS } from "../alchemy/pillData";

import { ArtifactDropSystem } from "../artifacts/ArtifactDropSystem";
import { ArtifactManager } from "../artifacts/ArtifactManager";
import { ARTIFACT_DATA } from "../artifacts/artifactData";
import {
    CATALYST_DATA,
    CATALYST_DEFINITIONS,
} from "../crafting/catalystData";
import { CraftingManager } from "../crafting/CraftingManager";
import { CRAFTING_RECIPES } from "../crafting/craftingData";
import { RarityRoller } from "../crafting/RarityRoller";
import {
    CULTIVATION_REALM_LABELS,
    CultivationRealm,
} from "../cultivation/CultivationRealm";
import { CULTIVATION_STAGE_LABELS } from "../cultivation/CultivationStage";
import { CultivationSystem } from "../cultivation/CultivationSystem";
import { BreakthroughRewardSystem } from "../cultivation/BreakthroughRewardSystem";
import { BuffManager } from "../buffs/BuffManager";
import { BossController } from "../bosses/BossController";
import type { BossSummonConfig } from "../bosses/BossPhase";
import type { BossSkillDefinition } from "../bosses/BossSkill";
import { getBossForChapter } from "../bosses/bossData";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import {
    getEnemyDefinitionById,
} from "../enemies/enemyData";
import { EnemyFactory } from "../enemies/EnemyFactory";
import { loadEnemyAssets } from "../enemies/enemyAssets";
import {
    getEncounterDefinition,
    type EncounterDefinition,
    type EncounterWave,
} from "../encounters/EncounterDefinition";
import type { EquipmentDefinition } from "../equipment/Equipment";
import { EquipmentFactory } from "../equipment/EquipmentFactory";
import { EquipmentManager } from "../equipment/EquipmentManager";
import { EquipmentSalvageManager } from "../equipment/EquipmentSalvageManager";
import { EquipmentStatUnlockManager } from "../equipment/EquipmentStatUnlockManager";
import { EquipmentRerollManager } from "../equipment/EquipmentRerollManager";
import { EquipmentRarity } from "../equipment/EquipmentRarity";
import { EquipmentStatRoller } from "../equipment/EquipmentStatRoller";
import { EQUIPMENT_DATA } from "../equipment/equipmentData";
import { Inventory } from "../inventory/Inventory";
import { ITEM_DATA } from "../items/itemData";
import { CatalystDropSystem } from "../loot/CatalystDropSystem";
import { BOSS_CATALYST_DROP_TABLES } from "../loot/catalystDropConfig";
import { LootSystem } from "../loot/LootSystem";
import { LOOT_TABLE_DATA } from "../loot/lootTableData";
import { MATERIAL_DEFINITIONS } from "../materials/materialData";
import { RefiningManager } from "../refining/RefiningManager";
import { SaveManager } from "../save/SaveManager";
import { SkillCombatSystem } from "../skills/SkillCombatSystem";
import type { SkillDamageEvent } from "../skills/SkillCombatSystem";
import { SkillManager } from "../skills/SkillManager";
import { SKILL_DATA, SKILL_IDS } from "../skills/skillData";
import { SkillVfxSystem } from "../skills/SkillVfxSystem";

import { StageSystem } from "../systems/StageSystem";
import type { StageConfig } from "../systems/StageSystem";
import { TechniqueManager } from "../techniques/TechniqueManager";
import { TECHNIQUE_DATA } from "../techniques/techniqueData";
import { BottomMenu } from "../ui/BottomMenu";
import { CharacterProgressionPanel } from "../ui/CharacterProgressionPanel";
import { MenuTab } from "../ui/MenuTab";
import { PlayerBottomHUD } from "../../ui/hud/PlayerBottomHUD";
import { BossHUD } from "../../ui/enemy/BossHUD";
import { EnemyLootDropUI } from "../../ui/enemy/EnemyLootDropUI";

export class MainScene {
    private static readonly COMBAT_BASELINE_Y = 170;
    private app: Application;
    private container: Container;

    private player: Player | null;
    private enemies: Enemy[];
    private enemyFactory: EnemyFactory;
    private bossController: BossController | null;
    private currentEncounter: EncounterDefinition | null;
    private currentWaveIndex: number;

    private stageSystem: StageSystem;
    private cultivationSystem: CultivationSystem | null;
    private breakthroughRewardSystem: BreakthroughRewardSystem | null;
    private craftingManager: CraftingManager | null;
    private buffManager: BuffManager | null;
    private alchemyManager: AlchemyManager | null;
    private inventory: Inventory;
    private equipmentManager: EquipmentManager | null;
    private equipmentSalvageManager: EquipmentSalvageManager | null;
    private equipmentStatUnlockManager: EquipmentStatUnlockManager | null;
    private equipmentRerollManager: EquipmentRerollManager | null;
    private equipmentStatRoller: EquipmentStatRoller;
    private equipmentFactory: EquipmentFactory;
    private refiningManager: RefiningManager | null;
    private artifactManager: ArtifactManager | null;
    private lootSystem: LootSystem | null;
    private techniqueManager: TechniqueManager | null;
    private skillManager: SkillManager | null;
    private skillCombatSystem: SkillCombatSystem | null;
    private skillVfxSystem: SkillVfxSystem | null;
    private bottomMenu: BottomMenu | null;
    private playerHud: PlayerBottomHUD | null;
    private saveManager: SaveManager | null;

    private heroAttackTimer: number;

    private spiritStone: number;

    private stageText: Text | null;
    private spiritStoneText: Text | null;
    private statusText: Text | null;
    private recentLootText: Text | null;
    private recentLootLines: string[];
    private bossHud: BossHUD | null;

    private stageCleared: boolean;
    private gameOver: boolean;

    constructor(app: Application) {
        this.app = app;
        this.container = new Container();

        this.player = null;
        this.enemies = [];
        this.enemyFactory = new EnemyFactory();
        this.bossController = null;
        this.currentEncounter = null;
        this.currentWaveIndex = 0;

        this.stageSystem = new StageSystem();
        this.cultivationSystem = null;
        this.breakthroughRewardSystem = null;
        this.craftingManager = null;
        this.buffManager = null;
        this.alchemyManager = null;
        this.inventory = new Inventory();
        this.equipmentManager = null;
        this.equipmentSalvageManager = null;
        this.equipmentStatUnlockManager = null;
        this.equipmentRerollManager = null;
        this.equipmentStatRoller = new EquipmentStatRoller();
        this.equipmentFactory = new EquipmentFactory(this.equipmentStatRoller);
        this.refiningManager = null;
        this.artifactManager = null;
        this.lootSystem = null;
        this.techniqueManager = null;
        this.skillManager = null;
        this.skillCombatSystem = null;
        this.skillVfxSystem = null;
        this.bottomMenu = null;
        this.playerHud = null;
        this.saveManager = null;

        this.heroAttackTimer = 0;

        this.spiritStone = 0;

        this.stageText = null;
        this.spiritStoneText = null;
        this.statusText = null;
        this.recentLootText = null;
        this.recentLootLines = [];
        this.bossHud = null;

        this.stageCleared = false;
        this.gameOver = false;
    }

    public async init(): Promise<void> {
        this.app.stage.addChild(
            this.container,
        );

        await Promise.all([
            this.createPlayer(),
            PlayerBottomHUD.loadAssets(),
            CharacterProgressionPanel.loadAssets(),
            SkillVfxSystem.loadAssets(),
            loadEnemyAssets(),
        ]);
        this.createUI();
        this.createCultivationSystem();
        this.createCraftingManager();
        this.createBuffAndAlchemySystems();
        this.createEquipmentManager();
        this.createEquipmentSalvageManager();
        this.createEquipmentStatUnlockManager();
        this.createEquipmentRerollManager();
        this.createRefiningManager();
        this.createArtifactSystems();
        this.createTechniqueManager();
        this.createSkillSystems();
        this.createBreakthroughRewardSystem();
        this.setupDebugInventory();
        this.createSaveManager();

        if (this.saveManager?.hasSave()) {
            this.saveManager.load();
            this.breakthroughRewardSystem?.reconcile(true);
        }

        this.startStage();
        this.createBottomMenu();
        this.createPlayerHUD();
        this.setupSkillInput();
        this.startGameLoop();
    }

    private createPlayerHUD(): void {
        if (
            !this.player ||
            !this.cultivationSystem ||
            !this.skillManager ||
            !this.skillCombatSystem
        ) {
            return;
        }

        this.playerHud = new PlayerBottomHUD({
            onNavigate: (id) => {
                const tabById: Partial<Record<string, MenuTab>> = {
                    character: MenuTab.CHARACTER,
                    inventory: MenuTab.INVENTORY,
                    cultivation: MenuTab.CULTIVATION,
                    techniques: MenuTab.TECHNIQUES,
                    settings: MenuTab.SETTINGS,
                };
                const tab = tabById[id];
                if (tab) {
                    this.bottomMenu?.openTab(tab);
                }
            },
            onUtility: () => {
                this.bottomMenu?.toggle();
            },
        });
        this.bottomMenu?.setLegacyToggleVisible(false);
        this.app.stage.addChild(this.playerHud.getView());
        this.updatePlayerHUD(false);
    }

    private updatePlayerHUD(animate = true): void {
        if (
            !this.playerHud ||
            !this.player ||
            !this.cultivationSystem ||
            !this.skillManager ||
            !this.skillCombatSystem
        ) {
            return;
        }

        this.playerHud.layout(this.app.screen.width, this.app.screen.height);
        this.playerHud.setPlayerProfile({
            name: "Vô Danh",
            realm: CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()],
            stage:
                `${CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()]} · Tầng ${this.cultivationSystem.getLayer()}`,
            sect: "Tán Tu",
        });
        this.playerHud.setHP(
            this.player.getHp(),
            this.player.getMaxHp(),
            animate,
        );
        this.playerHud.setQi(
            this.player.getMp(),
            this.player.getMaxMp(),
            animate,
        );
        this.playerHud.setCultivation(
            this.cultivationSystem.getCultivation(),
            this.cultivationSystem.getRequiredCultivation(),
            animate,
        );
        this.playerHud.setCurrencies({
            spiritStones: this.spiritStone,
            jade: this.inventory.getQuantity(ITEM_DATA.MYSTIC_JADE.id),
        });

        for (let index = 0; index < 5; index += 1) {
            const slotUnlocked = index < this.skillManager.getUnlockedSlotCount();
            if (!slotUnlocked) {
                this.playerHud.setQuickSlot(index, { locked: true });
                continue;
            }

            const skillId = this.skillManager.getEquippedSkillId(index);
            if (!skillId) {
                this.playerHud.setQuickSlot(index, {
                    locked: false,
                    disabled: true,
                    label: String(index + 1),
                    name: "Ô kỹ năng trống",
                    description: "Ô đã mở. Kỹ năng tương lai có thể được trang bị tại đây.",
                });
                continue;
            }

            const definition = this.skillManager.getSkillDefinition(skillId);
            const state = this.skillManager.getSkillState(skillId);
            if (!definition || !state) {
                this.playerHud.setQuickSlot(index, { locked: true });
                continue;
            }

            const totalCooldown =
                this.skillManager.getEffectiveCooldown(skillId);
            const remainingCooldown =
                this.skillManager.getRemainingCooldown(skillId);
            const effectiveMpCost = this.skillManager.getEffectiveMpCost(skillId);
            const insufficientMp = !this.player.canSpendMp(effectiveMpCost);
            this.playerHud.setQuickSlot(index, {
                id: skillId,
                name: definition.name,
                description: definition.description,
                label: String(index + 1),
                icon: definition.icon,
                mpCost: effectiveMpCost,
                cooldown: remainingCooldown,
                cooldownTotal: totalCooldown,
                autoCastEnabled: state.autoCastEnabled,
                insufficientMp,
                locked: !state.unlocked,
                disabled:
                    !state.unlocked ||
                    (insufficientMp && remainingCooldown <= 0) ||
                    (!this.skillManager.canCast(skillId) &&
                        remainingCooldown <= 0),
                onActivate: () => {
                    this.skillCombatSystem?.cast(skillId);
                },
            });
        }
    }

    public getCraftingManager(): CraftingManager | null {
        return this.craftingManager;
    }

    private createBottomMenu(): void {
        if (
            !this.player ||
            !this.cultivationSystem ||
            !this.equipmentManager ||
            !this.equipmentSalvageManager ||
            !this.equipmentStatUnlockManager ||
            !this.equipmentRerollManager ||
            !this.artifactManager ||
            !this.techniqueManager ||
            !this.skillManager ||
            !this.skillCombatSystem ||
            !this.breakthroughRewardSystem ||
            !this.refiningManager ||
            !this.craftingManager ||
            !this.buffManager ||
            !this.alchemyManager ||
            !this.saveManager
        ) {
            return;
        }

        this.bottomMenu = new BottomMenu(
            this.app,
            this.player,
            this.stageSystem,
            this.cultivationSystem,
            this.inventory,
            this.equipmentManager,
            this.equipmentSalvageManager,
            this.equipmentStatUnlockManager,
            this.equipmentRerollManager,
            this.artifactManager,
            this.techniqueManager,
            this.skillManager,
            this.breakthroughRewardSystem,
            this.refiningManager,
            this.craftingManager,
            this.alchemyManager,
            this.buffManager,
            () => this.spiritStone,
            (amount) => this.spendSpiritStone(amount),
            this.saveManager,
            () => this.restartAfterPersistentChange(),
        );
        this.app.stage.addChild(
            this.bottomMenu.getView(),
        );
    }

    private createEquipmentManager(): void {
        if (!this.player || !this.cultivationSystem) {
            return;
        }

        this.equipmentManager = new EquipmentManager(
            this.player,
            this.inventory,
            () => this.cultivationSystem?.getRealm() ??
                CultivationRealm.QI_REFINING,
        );
    }

    private createEquipmentSalvageManager(): void {
        if (!this.equipmentManager) {
            return;
        }

        this.equipmentSalvageManager = new EquipmentSalvageManager(
            this.inventory,
            this.equipmentManager,
        );
    }

    private createEquipmentStatUnlockManager(): void {
        if (!this.equipmentManager) {
            return;
        }

        this.equipmentStatUnlockManager = new EquipmentStatUnlockManager({
            inventory: this.inventory,
            equipmentManager: this.equipmentManager,
            statRoller: this.equipmentStatRoller,
            getSpiritStone: () => this.spiritStone,
            spendSpiritStone: (amount) => this.spendSpiritStone(amount),
            refundSpiritStone: (amount) => {
                this.setSpiritStone(this.spiritStone + amount);
            },
        });
    }

    private createEquipmentRerollManager(): void {
        if (!this.equipmentManager) {
            return;
        }

        this.equipmentRerollManager = new EquipmentRerollManager({
            inventory: this.inventory,
            equipmentManager: this.equipmentManager,
            statRoller: this.equipmentStatRoller,
            getSpiritStone: () => this.spiritStone,
            spendSpiritStone: (amount) => this.spendSpiritStone(amount),
            refundSpiritStone: (amount) => {
                this.setSpiritStone(this.spiritStone + amount);
            },
        });
    }

    private createRefiningManager(): void {
        if (!this.craftingManager) {
            return;
        }

        this.refiningManager = new RefiningManager({
            craftingManager: this.craftingManager,
            inventory: this.inventory,
            equipmentDefinitions: Object.values(EQUIPMENT_DATA),
            equipmentFactory: this.equipmentFactory,
        });
    }

    private createCultivationSystem(): void {
        if (!this.player) {
            return;
        }

        this.cultivationSystem = new CultivationSystem(
            () => this.player?.getCultivationSpeed() ?? 1,
        );
    }

    private createCraftingManager(): void {
        if (!this.cultivationSystem) {
            return;
        }

        this.craftingManager = new CraftingManager({
            inventory: this.inventory,
            recipes: CRAFTING_RECIPES,
            catalysts: CATALYST_DEFINITIONS,
            rarityRoller: new RarityRoller(),
            getSpiritStone: () => this.spiritStone,
            spendSpiritStone: (amount) => this.spendSpiritStone(amount),
            getRealm: () => this.cultivationSystem?.getRealm() ??
                CultivationRealm.QI_REFINING,
        });
    }

    private createBuffAndAlchemySystems(): void {
        if (!this.player || !this.craftingManager) {
            return;
        }

        this.buffManager = new BuffManager(this.player.getStatSystem());
        this.alchemyManager = new AlchemyManager({
            craftingManager: this.craftingManager,
            inventory: this.inventory,
            pillDefinitions: PILL_DEFINITIONS,
            player: this.player,
            buffManager: this.buffManager,
        });
    }

    private spendSpiritStone(amount: number): boolean {
        const cost = Math.max(0, Math.floor(amount));

        if (this.spiritStone < cost) {
            return false;
        }

        this.spiritStone -= cost;

        if (this.spiritStoneText) {
            this.spiritStoneText.text = `Linh Thạch: ${this.spiritStone}`;
        }

        return true;
    }

    private createArtifactSystems(): void {
        if (!this.player) {
            return;
        }

        this.artifactManager = new ArtifactManager(
            this.player,
            ARTIFACT_DATA,
        );
        const artifactDropSystem = new ArtifactDropSystem(
            ARTIFACT_DATA,
        );
        const catalystDropSystem = new CatalystDropSystem(
            CATALYST_DEFINITIONS,
            BOSS_CATALYST_DROP_TABLES,
        );

        this.lootSystem = new LootSystem(
            artifactDropSystem,
            catalystDropSystem,
            MATERIAL_DEFINITIONS,
            LOOT_TABLE_DATA,
        );
    }

    private createTechniqueManager(): void {
        if (!this.player) {
            return;
        }

        this.techniqueManager = new TechniqueManager(
            this.player.getStatSystem(),
            TECHNIQUE_DATA,
            () => {
                this.player?.syncCurrentResourcesWithMaxStats();
            },
        );
    }

    private createSkillSystems(): void {
        if (!this.player) {
            return;
        }

        this.skillManager = new SkillManager(
            this.player,
            SKILL_DATA,
            [SKILL_IDS.NORMAL_SLASH],
        );
        this.skillVfxSystem = new SkillVfxSystem(
            this.container,
            this.player,
            import.meta.env.DEV && new URLSearchParams(window.location.search).has("skillDebug"),
        );
        this.skillCombatSystem = new SkillCombatSystem(
            this.player,
            this.skillManager,
            () => this.enemies,
            this.skillVfxSystem,
            {
                onDamage: (event) => this.showSkillDamage(event),
                onHeal: (amount) => this.showSkillHeal(amount),
            },
        );
    }

    private createBreakthroughRewardSystem(): void {
        if (
            !this.player ||
            !this.cultivationSystem ||
            !this.skillManager ||
            !this.artifactManager ||
            !this.techniqueManager
        ) {
            return;
        }

        this.breakthroughRewardSystem = new BreakthroughRewardSystem(
            this.cultivationSystem,
            this.player,
            this.skillManager,
            this.artifactManager,
            this.techniqueManager,
        );
    }

    private setupSkillInput(): void {
        window.addEventListener("keydown", (event) => {
            if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
            const slotIndex = Number(event.key) - 1;
            if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= 5) return;
            const skillId = this.skillManager?.getEquippedSkillId(slotIndex);
            if (!skillId) return;
            event.preventDefault();
            this.skillCombatSystem?.cast(skillId);
        });
    }

    private createSaveManager(): void {
        if (
            !this.player ||
            !this.equipmentManager ||
            !this.artifactManager ||
            !this.techniqueManager ||
            !this.cultivationSystem ||
            !this.skillManager ||
            !this.buffManager
        ) {
            return;
        }

        this.saveManager = new SaveManager({
            stageSystem: this.stageSystem,
            inventory: this.inventory,
            equipmentManager: this.equipmentManager,
            artifactManager: this.artifactManager,
            techniqueManager: this.techniqueManager,
            cultivationSystem: this.cultivationSystem,
            skillManager: this.skillManager,
            buffManager: this.buffManager,
            player: this.player,
            getSpiritStone: () => this.spiritStone,
            setSpiritStone: (amount) => this.setSpiritStone(amount),
        });
    }

    private setSpiritStone(amount: number): void {
        this.spiritStone = Math.max(0, Math.floor(amount));

        if (this.spiritStoneText) {
            this.spiritStoneText.text = `Linh Thạch: ${this.spiritStone}`;
        }
    }

    private restartAfterPersistentChange(): void {
        this.breakthroughRewardSystem?.reconcile(true);

        if (this.statusText) {
            this.statusText.text = "";
        }

        this.stageCleared = false;
        this.gameOver = false;
        this.heroAttackTimer = 0;
        this.player?.restoreFullResources();
        this.startStage();
    }

    private setupDebugInventory(): void {
        this.inventory.addItem(ITEM_DATA.SPIRIT_HERB, 3);
        this.inventory.addItem(ITEM_DATA.MYSTIC_JADE, 5);
        this.inventory.addItem(
            CATALYST_DATA.LOW_GRADE_FORTUNE_STONE,
            3,
        );
        this.addDebugEquipment(
            EQUIPMENT_DATA.AZURE_CLOUD_SWORD,
            EquipmentRarity.GREEN,
            5,
        );
        this.addDebugEquipment(
            EQUIPMENT_DATA.FROST_MOON_SWORD,
            EquipmentRarity.BLUE,
        );
        this.addDebugEquipment(
            EQUIPMENT_DATA.AZURE_CLOUD_ROBE,
            EquipmentRarity.GREEN,
        );
        this.addDebugEquipment(
            EQUIPMENT_DATA.AZURE_SPIRIT_BRACELET,
            EquipmentRarity.GREEN,
        );
    }

    private addDebugEquipment(
        definition: EquipmentDefinition,
        rarity: EquipmentRarity,
        count = 1,
    ): void {
        for (let index = 0; index < count; index += 1) {
            this.inventory.addEquipmentInstance(
                this.equipmentFactory.create(definition, rarity),
            );
        }
    }

    private createUI(): void {
        this.statusText = new Text({
            text: "",
            style: {
                fill: "#ffffff",
                fontSize: 24,
                fontWeight: "bold",
            },
        });

        this.statusText.anchor.set(
            0.5,
        );

        this.statusText.x =
            this.app.screen.width / 2;

        this.statusText.y = 35;

        this.container.addChild(
            this.statusText,
        );

        this.createBossUI();
    }

    private createBossUI(): void {
        this.bossHud = new BossHUD();
        this.bossHud.layout(this.app.screen.width);
        this.app.stage.addChild(this.bossHud.getView());
    }

    private async createPlayer(): Promise<void> {
        this.player = await Player.create();

        // PlayerBottomHUD is the single source of truth for profile/resources.
        // Hide the old world-space Hero/HP/MP labels; at taskbar height those
        // labels sit directly behind the transparent HUD and appear as overlap.
        this.player.setWorldStatusVisible(false);

        this.player.setPosition(
            150,
            MainScene.COMBAT_BASELINE_Y,
        );

        this.container.addChild(
            this.player.getView(),
        );
    }

    private startStage(): void {
        this.clearEnemies();

        this.stageCleared = false;
        this.gameOver = false;

        this.heroAttackTimer = 0;

        const config =
            this.stageSystem.getConfig();

        this.currentEncounter = getEncounterDefinition(config.chapter, config.stage);
        this.currentWaveIndex = 0;

        this.updateStageUI(
            config,
        );

        this.spawnStageEnemies(
            config,
        );
    }

    private spawnStageEnemies(
        config: StageConfig,
    ): void {
        if (config.isBossStage) {
            const bossDefinition = getBossForChapter(config.chapter);
            const boss = this.enemyFactory.create(bossDefinition.enemy, config);

            boss.setPosition(
                1050,
                MainScene.COMBAT_BASELINE_Y,
            );

            this.enemies.push(
                boss,
            );

            this.container.addChild(
                boss.getView(),
            );

            this.bossController = new BossController(
                boss,
                bossDefinition,
                {
                    isPlayerAlive: () => Boolean(this.player && !this.player.isDead()),
                    canUseTargetedSkill: () => Boolean(
                        this.player &&
                        boss.isInAttackRange(this.player.getView().x),
                    ),
                    dealDamageToPlayer: (damage) => {
                        this.dealBossSkillDamage(damage);
                    },
                    onSkillCast: (skill) => {
                        this.showBossSkillText(boss, skill);
                    },
                    onPhaseChanged: (_phase, phaseIndex) => {
                        boss.setBossPhaseVisual(phaseIndex);
                        this.showBossPhaseText(boss, phaseIndex);
                    },
                    onSummonRequested: (summon) => {
                        this.spawnBossMinions(summon, config, boss);
                    },
                },
            );
            this.updateBossUI();

            return;
        }

        const encounter = this.currentEncounter;
        const firstWave = encounter?.waves[0];
        if (firstWave) this.spawnEncounterWave(config, firstWave);
    }

    private spawnEncounterWave(config: StageConfig, wave: EncounterWave): void {
        const spacing = wave.spacing ?? 120;
        const scaledConfig: StageConfig = {
            ...config,
            enemyHp: config.enemyHp * (wave.hpMultiplier ?? 1),
            enemyAttack: config.enemyAttack * (wave.attackMultiplier ?? 1),
            enemySpeed: config.enemySpeed * (wave.speedMultiplier ?? 1),
            enemyCount: wave.enemyIds.length,
        };

        wave.enemyIds.forEach((enemyId, index) => {
            const definition = getEnemyDefinitionById(enemyId);
            if (!definition || definition.isBoss) return;
            const enemy = this.enemyFactory.create(definition, scaledConfig);
            enemy.setPosition(
                700 + index * spacing,
                MainScene.COMBAT_BASELINE_Y,
            );
            this.enemies.push(enemy);
            this.container.addChild(enemy.getView());
        });

        if (this.statusText && (this.currentEncounter?.waves.length ?? 0) > 1) {
            this.statusText.text = `Đợt ${this.currentWaveIndex + 1}/${this.currentEncounter?.waves.length}`;
        }
    }

    private tryAdvanceEncounterWave(): boolean {
        const encounter = this.currentEncounter;
        if (!encounter || encounter.kind === "boss") return false;
        const nextWaveIndex = this.currentWaveIndex + 1;
        const nextWave = encounter.waves[nextWaveIndex];
        if (!nextWave) return false;

        this.currentWaveIndex = nextWaveIndex;
        this.heroAttackTimer = 0;
        this.spawnEncounterWave(this.stageSystem.getConfig(), nextWave);
        return true;
    }

    private spawnBossMinions(
        summon: BossSummonConfig,
        config: StageConfig,
        boss: Enemy,
    ): void {
        const definition = getEnemyDefinitionById(summon.enemyId);

        if (!definition || definition.isBoss) {
            console.warn(`Không thể triệu hồi enemy: ${summon.enemyId}`);
            return;
        }

        const count = Math.max(0, Math.floor(summon.count));
        const minionStageConfig = this.stageSystem.getNormalEnemyConfig(
            config.chapter,
            config.stage,
        );

        for (let index = 0; index < count; index += 1) {
            const minion = this.enemyFactory.create(
                definition,
                minionStageConfig,
                { rewardEnabled: false },
            );

            minion.setPosition(
                boss.getView().x + 90 * (index + 1),
                boss.getView().y,
            );
            this.enemies.push(minion);
            this.container.addChild(minion.getView());
        }
    }

    private dealBossSkillDamage(damage: number): void {
        if (!this.player || this.player.isDead()) {
            return;
        }

        const finalDamage = this.player.takeDamage(damage);

        this.showDamageText(
            this.player.getView().x,
            this.player.getView().y - 95,
            `-${this.formatNumber(finalDamage)}`,
            "#fb7185",
        );
    }

    private showBossSkillText(
        boss: Enemy,
        skill: BossSkillDefinition,
    ): void {
        this.showDamageText(
            boss.getView().x,
            boss.getView().y - 115,
            `${skill.name}!`,
            "#fda4af",
        );
    }

    private showBossPhaseText(
        boss: Enemy,
        phaseIndex: number,
    ): void {
        if (phaseIndex === 0) {
            return;
        }

        this.showDamageText(
            boss.getView().x,
            boss.getView().y - 135,
            `Lang Vương nổi giận! Giai đoạn ${phaseIndex + 1}`,
            "#fbbf24",
        );
    }

    private updateBossUI(): void {
        if (!this.bossController || !this.bossHud) return;

        const boss = this.bossController.getBoss();
        this.bossHud.layout(this.app.screen.width);
        this.bossHud.show(
            boss.getDefinition().name,
            boss.getHp(),
            boss.getMaxHp(),
            this.bossController.getCurrentPhaseIndex(),
            this.bossController.getRemainingBuffDuration(),
        );
    }

    private hideBossUI(): void {
        this.bossHud?.hide();
    }

    private startGameLoop(): void {
        this.app.ticker.add(
            (ticker) => {
                const deltaSeconds = ticker.deltaMS / 1000;

                this.cultivationSystem?.update(
                    deltaSeconds,
                );
                this.buffManager?.update(deltaSeconds);

                this.player?.updateResources(deltaSeconds);
                this.skillManager?.update(deltaSeconds);
                this.saveManager?.update(deltaSeconds);
                this.updatePlayerHUD();

                if (
                    !this.player ||
                    this.gameOver ||
                    this.stageCleared
                ) {
                    return;
                }

                this.removeDeadEnemies();

                if (
                    this.enemies.length === 0
                ) {
                    if (this.tryAdvanceEncounterWave()) return;
                    this.handleStageClear();

                    return;
                }

                if (
                    this.player.isDead()
                ) {
                    this.handleGameOver();

                    return;
                }

                this.skillCombatSystem?.updateAutoCast();
                this.removeDeadEnemies();

                if (this.enemies.length === 0) {
                    if (this.tryAdvanceEncounterWave()) return;
                    this.handleStageClear();

                    return;
                }

                this.bossController?.update(deltaSeconds);
                this.updateBossUI();

                if (this.player.isDead()) {
                    this.handleGameOver();

                    return;
                }

                for (const enemy of this.enemies) {
                    enemy.update(deltaSeconds);
                }

                this.updateEnemyMovement();
                this.updatePlayerLocomotion();

                this.heroAttackTimer +=
                    ticker.deltaMS;

                if (
                    this.heroAttackTimer >=
                    1000
                ) {
                    this.heroAttackTimer = 0;

                    this.heroAttack();
                }

                this.enemiesAttack();
            },
        );
    }

    private updateEnemyMovement(): void {
        const alive = this.enemies
            .filter((enemy) => !enemy.isDead())
            .sort((left, right) => left.getX() - right.getX());

        // Keep a readable melee queue instead of letting every enemy collapse
        // onto the same x position. Only the front line should naturally enter
        // attack range; the rest advance as space opens.
        const frontStopX = 260;
        const formationGap = 92;

        alive.forEach((enemy, index) => {
            const stopX = frontStopX + index * formationGap;
            if (enemy.getX() > stopX) enemy.moveLeft();
        });
    }

    private updatePlayerLocomotion(): void {
        if (!this.player || this.player.isDead()) return;
        const target = this.getNearestEnemy();
        if (!target) {
            this.player.playIdle();
            return;
        }
        const distance = target.getX() - this.player.getView().x;
        this.player.setFacingDirection(distance >= 0 ? 1 : -1);
        if (distance > 430) {
            this.player.playRun();
        } else if (distance > 320) {
            this.player.playWalk();
        } else {
            this.player.playIdle();
        }
    }

    private heroAttack(): void {
        if (
            !this.player ||
            !this.skillCombatSystem ||
            this.enemies.length === 0
        ) {
            return;
        }

        const target =
            this.getNearestEnemy();

        if (!target) {
            return;
        }

        if (
            target.getX() > 320
        ) {
            return;
        }
        this.skillCombatSystem.cast(SKILL_IDS.NORMAL_SLASH);
    }

    private enemiesAttack(): void {
        if (!this.player) {
            return;
        }

        for (
            const enemy of this.enemies
        ) {
            if (
                enemy.isDead()
            ) {
                continue;
            }

            if (
                !enemy.isAttackReady() ||
                !enemy.isInAttackRange(this.player.getView().x)
            ) {
                continue;
            }

            enemy.consumeAttack();

            const damage =
                enemy.getAttack();

            const finalDamage = this.player.takeDamage(
                damage,
            );

            this.showDamageText(
                this.player.getView().x,
                this.player.getView().y - 80,
                `-${finalDamage}`,
                "#ff5555",
            );

            gsap.fromTo(
                this.player.getView(),
                {
                    x:
                        this.player
                            .getView().x,
                },
                {
                    x:
                        this.player
                            .getView().x - 5,
                    duration: 0.05,
                    yoyo: true,
                    repeat: 1,
                },
            );

            if (
                this.player.isDead()
            ) {
                return;
            }
        }
    }

    private getNearestEnemy():
        | Enemy
        | null {
        let nearest:
            | Enemy
            | null = null;

        let nearestX =
            Number.MAX_VALUE;

        for (
            const enemy of this.enemies
        ) {
            if (
                enemy.isDead()
            ) {
                continue;
            }

            const x =
                enemy.getX();

            if (
                x < nearestX
            ) {
                nearestX = x;
                nearest = enemy;
            }
        }

        return nearest;
    }

    private removeDeadEnemies(): void {
        const aliveEnemies: Enemy[] =
            [];

        for (
            const enemy of this.enemies
        ) {
            if (
                enemy.isDead()
            ) {
                if (!enemy.isRemovalReady()) {
                    aliveEnemies.push(enemy);
                    continue;
                }
                if (this.bossController?.getBoss() === enemy) {
                    this.bossController.destroy();
                    this.bossController = null;
                    this.hideBossUI();
                }

                this.rewardEnemy(
                    enemy,
                );

                this.container.removeChild(
                    enemy.getView(),
                );

                enemy
                    .getView()
                    .destroy({
                        children: true,
                    });

                continue;
            }

            aliveEnemies.push(
                enemy,
            );
        }

        this.enemies =
            aliveEnemies;
    }

    private rewardEnemy(
        enemy: Enemy,
    ): void {
        if (!enemy.isRewardEnabled()) {
            return;
        }

        this.rewardLoot(enemy);
    }

    private rewardLoot(enemy: Enemy): void {
        if (!this.lootSystem) {
            return;
        }

        const enemyDefinition = enemy.getDefinition();
        const loot = this.lootSystem.rollLoot(
            enemyDefinition,
            {
                chapter: this.stageSystem.getChapter(),
                stage: this.stageSystem.getStage(),
                enemyId: enemyDefinition.id,
                isBoss: enemyDefinition.isBoss,
            },
        );

        const lootView = EnemyLootDropUI.create(loot);
        lootView.position.set(enemy.getView().x, enemy.getView().y - 82);
        this.container.addChild(lootView);
        gsap.to(lootView, {
            y: lootView.y - 28,
            alpha: 0,
            delay: 0.35,
            duration: 1.1,
            onComplete: () => lootView.destroy({ children: true }),
        });

        this.spiritStone += loot.spiritStone;

        if (this.spiritStoneText) {
            this.spiritStoneText.text = `Linh Thạch: ${this.spiritStone}`;
        }

        this.showRewardText(
            enemy.getView().x,
            enemy.getView().y - 70,
            loot.spiritStone,
        );
        this.addRecentLoot(`+${loot.spiritStone} Linh Thạch`);

        for (const drop of loot.materials) {
            this.inventory.addItem(drop.item, drop.amount);
            this.addRecentLoot(`+${drop.amount} ${drop.item.name}`);
        }

        for (const drop of loot.artifactFragments) {
            this.artifactManager?.addFragments(
                drop.artifactId,
                drop.amount,
            );

            const definition = this.artifactManager?.getArtifactDefinition(
                drop.artifactId,
            );

            if (definition) {
                this.showDamageText(
                    enemy.getView().x,
                    enemy.getView().y - 95,
                    `+${drop.amount} Mảnh ${definition.name}`,
                    "#67e8f9",
                );
                this.addRecentLoot(`+${drop.amount} Mảnh ${definition.name}`);
            }
        }

        for (const drop of loot.catalysts) {
            this.inventory.addItem(drop.catalyst, drop.amount);
            this.addRecentLoot(`+${drop.amount} ${drop.catalyst.name}`);
            this.showDamageText(
                enemy.getView().x,
                enemy.getView().y - 120,
                `+${drop.amount} ${drop.catalyst.name}`,
                "#f0abfc",
            );
        }
    }

    private addRecentLoot(line: string): void {
        this.recentLootLines.unshift(line);
        this.recentLootLines = this.recentLootLines.slice(0, 5);

        if (this.recentLootText) {
            this.recentLootText.text = [
                "Vật phẩm gần đây:",
                ...this.recentLootLines,
            ].join("\n");
        }
    }

    private handleStageClear(): void {
        this.stageCleared = true;

        this.heroAttackTimer = 0;

        const clearedStage =
            this.stageSystem.getStage();

        const isChapterCleared =
            clearedStage === 50;

        if (
            this.statusText
        ) {
            if (isChapterCleared) {
                this.statusText.text =
                    "BOSS CLEAR!";
            } else {
                this.statusText.text =
                    "CLEAR!";
            }
        }

        gsap.delayedCall(
            1.5,
            () => {
                this.stageSystem.nextStage();

                if (
                    isChapterCleared &&
                    this.player
                ) {
                    this.player.restoreFullResources();
                    this.skillManager?.resetCooldowns();
                }

                if (
                    this.statusText
                ) {
                    if (isChapterCleared) {
                        this.statusText.text =
                            `CHƯƠNG ${this.stageSystem.getChapter()}`;
                    } else {
                        this.statusText.text =
                            "";
                    }
                }

                this.heroAttackTimer = 0;

                this.startStage();

                if (
                    isChapterCleared &&
                    this.statusText
                ) {
                    gsap.delayedCall(
                        1,
                        () => {
                            if (
                                this.statusText
                            ) {
                                this.statusText.text =
                                    "";
                            }
                        },
                    );
                }
            },
        );
    }

    private handleGameOver(): void {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;

        this.heroAttackTimer = 0;

        if (
            this.statusText
        ) {
            this.statusText.text =
                "GAME OVER";
        }

        gsap.delayedCall(
            2,
            () => {
                this.resetGame();
            },
        );
    }

    private resetGame(): void {
        this.clearEnemies();

        this.stageSystem.reset();

        this.spiritStone = 0;

        if (
            this.spiritStoneText
        ) {
            this.spiritStoneText.text =
                "Linh Thạch: 0";
        }

        if (
            this.statusText
        ) {
            this.statusText.text =
                "";
        }

        this.heroAttackTimer = 0;

        this.stageCleared = false;
        this.gameOver = false;

        if (
            this.player
        ) {
            this.player.restoreFullResources();
        }

        this.skillManager?.resetCooldowns();

        this.startStage();
    }

    private updateStageUI(
        config: StageConfig,
    ): void {
        if (
            !this.stageText
        ) {
            return;
        }

        if (
            config.isBossStage
        ) {
            this.stageText.text =
                `Chương ${config.chapter} - Ải ${config.stage} - BOSS`;
        } else {
            const encounter = this.currentEncounter ??
                getEncounterDefinition(config.chapter, config.stage);
            this.stageText.text =
                `Chương ${config.chapter} - Ải ${config.stage} · ${encounter.label}`;
        }
    }

    private showDamageText(
        x: number,
        y: number,
        textValue: string,
        color: string,
    ): void {
        const damageText =
            new Text({
                text: textValue,
                style: {
                    fill: color,
                    fontSize: 16,
                    fontWeight:
                        "bold",
                },
            });

        damageText.anchor.set(
            0.5,
        );

        damageText.x = x;
        damageText.y = y;

        this.container.addChild(
            damageText,
        );

        gsap.to(
            damageText,
            {
                y: y - 30,
                alpha: 0,
                duration: 0.7,

                onComplete: () => {
                    damageText.destroy();
                },
            },
        );
    }

    private showSkillDamage(event: SkillDamageEvent): void {
        this.showDamageText(
            event.enemy.getView().x,
            event.enemy.getView().y - 60,
            event.isCritical
                ? `-${this.formatNumber(event.damage)} CRIT`
                : `-${this.formatNumber(event.damage)}`,
            event.isCritical ? "#ffd54a" : "#7dd3fc",
        );
    }

    private showSkillHeal(amount: number): void {
        if (!this.player) {
            return;
        }

        this.showDamageText(
            this.player.getView().x,
            this.player.getView().y - 90,
            `+${this.formatNumber(amount)} HP`,
            "#4ade80",
        );
    }

    private formatNumber(value: number): string {
        return value.toFixed(2);
    }

    private showRewardText(
        x: number,
        y: number,
        amount: number,
    ): void {
        const rewardText =
            new Text({
                text:
                    `+${amount} Linh Thạch`,
                style: {
                    fill: "#ffd54a",
                    fontSize: 15,
                    fontWeight:
                        "bold",
                },
            });

        rewardText.anchor.set(
            0.5,
        );

        rewardText.x = x;
        rewardText.y = y;

        this.container.addChild(
            rewardText,
        );

        gsap.to(
            rewardText,
            {
                y: y - 40,
                alpha: 0,
                duration: 1,

                onComplete: () => {
                    rewardText.destroy();
                },
            },
        );
    }

    private clearEnemies(): void {
        this.bossController?.destroy();
        this.bossController = null;
        this.hideBossUI();

        for (
            const enemy of this.enemies
        ) {
            this.container.removeChild(
                enemy.getView(),
            );

            enemy
                .getView()
                .destroy({
                    children: true,
                });
        }

        this.enemies = [];
        this.currentWaveIndex = 0;
    }
}
