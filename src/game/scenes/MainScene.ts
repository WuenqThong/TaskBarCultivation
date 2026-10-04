import {
    Application,
    Container,
    Graphics,
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
import { CultivationRealm } from "../cultivation/CultivationRealm";
import { CultivationSystem } from "../cultivation/CultivationSystem";
import { BuffManager } from "../buffs/BuffManager";
import { BossController } from "../bosses/BossController";
import type { BossSummonConfig } from "../bosses/BossPhase";
import type { BossSkillDefinition } from "../bosses/BossSkill";
import { getBossForChapter } from "../bosses/bossData";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import {
    getChapterEnemyPool,
    getEnemyDefinitionById,
} from "../enemies/enemyData";
import { EnemyFactory } from "../enemies/EnemyFactory";
import type { EquipmentDefinition } from "../equipment/Equipment";
import { EquipmentFactory } from "../equipment/EquipmentFactory";
import { EquipmentManager } from "../equipment/EquipmentManager";
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
import { SKILL_DATA } from "../skills/skillData";

import { StageSystem } from "../systems/StageSystem";
import type { StageConfig } from "../systems/StageSystem";
import { TechniqueManager } from "../techniques/TechniqueManager";
import { TECHNIQUE_DATA } from "../techniques/techniqueData";
import { BottomMenu } from "../ui/BottomMenu";

export class MainScene {
    private app: Application;
    private container: Container;

    private player: Player | null;
    private enemies: Enemy[];
    private enemyFactory: EnemyFactory;
    private bossController: BossController | null;

    private stageSystem: StageSystem;
    private cultivationSystem: CultivationSystem | null;
    private craftingManager: CraftingManager | null;
    private buffManager: BuffManager | null;
    private alchemyManager: AlchemyManager | null;
    private inventory: Inventory;
    private equipmentManager: EquipmentManager | null;
    private equipmentStatRoller: EquipmentStatRoller;
    private equipmentFactory: EquipmentFactory;
    private refiningManager: RefiningManager | null;
    private artifactManager: ArtifactManager | null;
    private lootSystem: LootSystem | null;
    private techniqueManager: TechniqueManager | null;
    private skillManager: SkillManager | null;
    private skillCombatSystem: SkillCombatSystem | null;
    private bottomMenu: BottomMenu | null;
    private saveManager: SaveManager | null;

    private heroAttackTimer: number;

    private spiritStone: number;

    private stageText: Text | null;
    private spiritStoneText: Text | null;
    private statusText: Text | null;
    private recentLootText: Text | null;
    private recentLootLines: string[];
    private bossUi: Container | null;
    private bossHpBarFill: Graphics | null;
    private bossStatusText: Text | null;

    private stageCleared: boolean;
    private gameOver: boolean;

    constructor(app: Application) {
        this.app = app;
        this.container = new Container();

        this.player = null;
        this.enemies = [];
        this.enemyFactory = new EnemyFactory();
        this.bossController = null;

        this.stageSystem = new StageSystem();
        this.cultivationSystem = null;
        this.craftingManager = null;
        this.buffManager = null;
        this.alchemyManager = null;
        this.inventory = new Inventory();
        this.equipmentManager = null;
        this.equipmentStatRoller = new EquipmentStatRoller();
        this.equipmentFactory = new EquipmentFactory(this.equipmentStatRoller);
        this.refiningManager = null;
        this.artifactManager = null;
        this.lootSystem = null;
        this.techniqueManager = null;
        this.skillManager = null;
        this.skillCombatSystem = null;
        this.bottomMenu = null;
        this.saveManager = null;

        this.heroAttackTimer = 0;

        this.spiritStone = 0;

        this.stageText = null;
        this.spiritStoneText = null;
        this.statusText = null;
        this.recentLootText = null;
        this.recentLootLines = [];
        this.bossUi = null;
        this.bossHpBarFill = null;
        this.bossStatusText = null;

        this.stageCleared = false;
        this.gameOver = false;
    }

    public async init(): Promise<void> {
        this.app.stage.addChild(
            this.container,
        );

        this.createUI();
        await this.createPlayer();
        this.createCultivationSystem();
        this.createCraftingManager();
        this.createBuffAndAlchemySystems();
        this.createEquipmentManager();
        this.createRefiningManager();
        this.createArtifactSystems();
        this.createTechniqueManager();
        this.createSkillSystems();
        this.setupDebugInventory();
        this.createSaveManager();

        if (this.saveManager?.hasSave()) {
            this.saveManager.load();
        }

        this.startStage();
        this.createBottomMenu();
        this.startGameLoop();
    }

    public getCraftingManager(): CraftingManager | null {
        return this.craftingManager;
    }

    private createBottomMenu(): void {
        if (
            !this.player ||
            !this.cultivationSystem ||
            !this.equipmentManager ||
            !this.artifactManager ||
            !this.techniqueManager ||
            !this.skillManager ||
            !this.skillCombatSystem ||
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
            this.artifactManager,
            this.techniqueManager,
            this.skillManager,
            this.skillCombatSystem,
            this.refiningManager,
            this.craftingManager,
            this.alchemyManager,
            this.buffManager,
            () => this.spiritStone,
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
        );
        this.skillCombatSystem = new SkillCombatSystem(
            this.player,
            this.skillManager,
            () => this.enemies,
            {
                onDamage: (event) => this.showSkillDamage(event),
                onHeal: (amount) => this.showSkillHeal(amount),
            },
        );
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
        this.stageText = new Text({
            text: "Chương 1 - Ải 1",
            style: {
                fill: "#ffffff",
                fontSize: 20,
                fontWeight: "bold",
            },
        });

        this.stageText.x = 20;
        this.stageText.y = 20;

        this.container.addChild(
            this.stageText,
        );

        this.spiritStoneText =
            new Text({
                text: "Linh Thạch: 0",
                style: {
                    fill: "#ffd54a",
                    fontSize: 18,
                    fontWeight: "bold",
                },
            });

        this.spiritStoneText.x = 20;
        this.spiritStoneText.y = 50;

        this.container.addChild(
            this.spiritStoneText,
        );

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

        this.recentLootText = new Text({
            text: "",
            style: {
                fill: "#d1d5db",
                fontSize: 11,
            },
        });
        this.recentLootText.x = 20;
        this.recentLootText.y = 78;
        this.container.addChild(this.recentLootText);

        this.createBossUI();
    }

    private createBossUI(): void {
        const barWidth = 400;
        const bossUi = new Container();
        const background = new Graphics()
            .roundRect(0, 39, barWidth, 14, 7)
            .fill("#29151f")
            .stroke({ color: "#fca5a5", width: 1 });
        const fill = new Graphics();
        const statusText = new Text({
            text: "",
            style: {
                fill: "#ffffff",
                fontSize: 14,
                fontWeight: "bold",
                align: "center",
            },
        });

        statusText.anchor.set(0.5, 0);
        statusText.x = barWidth / 2;
        bossUi.position.set((this.app.screen.width - barWidth) / 2, 52);
        bossUi.visible = false;
        bossUi.addChild(background, fill, statusText);
        this.container.addChild(bossUi);

        this.bossUi = bossUi;
        this.bossHpBarFill = fill;
        this.bossStatusText = statusText;
    }

    private async createPlayer(): Promise<void> {
        this.player = await Player.create();

        this.player.setPosition(
            150,
            170,
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
        const enemyPool = getChapterEnemyPool(config.chapter);

        if (config.isBossStage) {
            const bossDefinition = getBossForChapter(config.chapter);
            const boss = this.enemyFactory.create(bossDefinition.enemy, config);

            boss.setPosition(
                1050,
                170,
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

        const spacing = 120;

        for (
            let i = 0;
            i < config.enemyCount;
            i += 1
        ) {
            const definition = enemyPool.enemies[
                Math.floor(Math.random() * enemyPool.enemies.length)
            ];
            const enemy = this.enemyFactory.create(definition, config);

            enemy.setPosition(
                700 +
                    i * spacing,
                170,
            );

            this.enemies.push(
                enemy,
            );

            this.container.addChild(
                enemy.getView(),
            );
        }
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
        if (
            !this.bossController ||
            !this.bossUi ||
            !this.bossHpBarFill ||
            !this.bossStatusText
        ) {
            return;
        }

        const boss = this.bossController.getBoss();
        const hpRatio = Math.min(
            1,
            Math.max(0, boss.getHp() / boss.getMaxHp()),
        );

        this.bossUi.visible = true;
        this.bossStatusText.text =
            `${boss.getDefinition().name} | ` +
            `Giai đoạn ${this.bossController.getCurrentPhaseIndex() + 1}\n` +
            `HP: ${this.formatNumber(boss.getHp())} / ` +
            `${this.formatNumber(boss.getMaxHp())}`;
        this.bossHpBarFill.clear();

        if (hpRatio > 0) {
            this.bossHpBarFill
                .roundRect(0, 39, 400 * hpRatio, 14, 7)
                .fill("#dc2626");
        }
    }

    private hideBossUI(): void {
        if (this.bossUi) {
            this.bossUi.visible = false;
        }

        this.bossHpBarFill?.clear();

        if (this.bossStatusText) {
            this.bossStatusText.text = "";
        }
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
        for (
            const enemy of this.enemies
        ) {
            if (
                enemy.isDead()
            ) {
                continue;
            }

            if (
                enemy.getX() > 260
            ) {
                enemy.moveLeft();
            }
        }
    }

    private heroAttack(): void {
        if (
            !this.player ||
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

        const attackResult =
            this.player.calculateAttackDamage();

        this.player.playAttack();

        target.takeDamage(
            attackResult.damage,
        );

        this.showDamageText(
            target.getView().x,
            target.getView().y - 60,
            attackResult.isCritical
                ? `-${this.formatNumber(attackResult.damage)} CRIT`
                : `-${this.formatNumber(attackResult.damage)}`,
            attackResult.isCritical
                ? "#ffd54a"
                : "#ffffff",
        );

        gsap.fromTo(
            this.player.getView().scale,
            {
                x: 1,
                y: 1,
            },
            {
                x: 1.15,
                y: 1.15,
                duration: 0.08,
                yoyo: true,
                repeat: 1,
            },
        );
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
            this.stageText.text =
                `Chương ${config.chapter} - Ải ${config.stage}`;
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
    }
}
