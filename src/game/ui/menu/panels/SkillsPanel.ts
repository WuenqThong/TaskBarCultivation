import { Container } from "pixi.js";
import type { SkillDefinition } from "../../../skills/Skill";
import type { SkillManager } from "../../../skills/SkillManager";
import type { SkillState } from "../../../skills/SkillState";
import { createMenuActionButton, createMenuText } from "../MenuComponents";
import { MENU_COLORS } from "../MenuTheme";
import type { MenuPanel } from "../MenuPanel";

export class SkillsPanel implements MenuPanel {
    private readonly root = new Container();
    private statusMessage = "";

    public constructor(
        private readonly skillManager: SkillManager,
        private readonly getSpiritStone: () => number,
        private readonly spendSpiritStone: (amount: number) => boolean,
    ) {
        this.refresh();
    }

    public getView(): Container {
        return this.root;
    }

    public refresh(): void {
        this.root.removeChildren();
        const title = createMenuText("KỸ NĂNG · BUILD 5 Ô", 18, MENU_COLORS.bronzeBright);
        const status = createMenuText(
            `${this.statusMessage || "Chọn ô 2–5 để đổi skill trong build."}   Linh Thạch: ${this.getSpiritStone()}`,
            11,
            MENU_COLORS.warning,
        );
        status.position.set(220, 4);
        this.root.addChild(title, status);

        for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
            const unlocked = slotIndex < this.skillManager.getUnlockedSlotCount();
            const skillId = this.skillManager.getEquippedSkillId(slotIndex);
            const skillName = skillId
                ? this.skillManager.getSkillDefinition(skillId)?.name ?? "?"
                : "TRỐNG";
            const button = createMenuActionButton(
                unlocked ? `${slotIndex + 1}. ${skillName}` : `${slotIndex + 1}. KHÓA`,
                212,
                28,
                () => {
                    if (unlocked && slotIndex > 0) this.cycleSkillSlot(slotIndex);
                },
                unlocked
                    ? (slotIndex === 0 ? MENU_COLORS.textMuted : MENU_COLORS.jadeBright)
                    : MENU_COLORS.disabled,
                10,
            );
            button.position.set(slotIndex * 220, 31);
            this.root.addChild(button);
        }

        this.skillManager.getAllSkills().forEach(({ definition, state }, index) => {
            this.renderSkillCard(definition, state, index);
        });
    }

    private renderSkillCard(
        definition: SkillDefinition,
        state: SkillState,
        index: number,
    ): void {
        const column = index % 4;
        const row = Math.floor(index / 4);
        const x = column * 300;
        const y = 72 + row * 78;
        const equippedSlot = this.skillManager.getLoadout().findIndex(
            (skillId) => skillId === definition.id,
        );
        const maxLevel = definition.progression.maxLevel;
        const upgradeCost = this.skillManager.getUpgradeCost(definition.id);
        const power = definition.damageMultiplier !== undefined
            ? `ST ${this.format(this.skillManager.getEffectiveDamageMultiplier(definition.id) * 100)}%`
            : `Hồi ${this.format(this.skillManager.getEffectiveHealPercent(definition.id) * 100)}%`;
        const name = createMenuText(
            `${state.unlocked ? "" : "🔒 "}${definition.name}${equippedSlot >= 0 ? ` [Ô ${equippedSlot + 1}]` : ""}`,
            13,
            state.unlocked ? MENU_COLORS.text : MENU_COLORS.disabled,
        );
        const details = createMenuText(
            `Lv ${state.level}/${maxLevel} · ${power} · MP ${this.format(this.skillManager.getEffectiveMpCost(definition.id))} · CD ${this.format(this.skillManager.getEffectiveCooldown(definition.id))}s`,
            10,
            state.unlocked ? MENU_COLORS.textMuted : MENU_COLORS.disabled,
        );
        name.position.set(x, y);
        details.position.set(x, y + 20);
        this.root.addChild(name, details);

        if (!state.unlocked) return;

        const upgradeButton = createMenuActionButton(
            upgradeCost === null ? "MAX" : `NÂNG ${upgradeCost}`,
            112,
            22,
            () => {
                if (upgradeCost === null) return;
                const upgraded = this.skillManager.upgradeSkill(
                    definition.id,
                    this.spendSpiritStone,
                );
                this.statusMessage = upgraded
                    ? `${definition.name} đã lên cấp ${state.level + 1}.`
                    : `Không đủ Linh Thạch để nâng ${definition.name}.`;
                this.refresh();
            },
            upgradeCost === null ? MENU_COLORS.disabled : MENU_COLORS.bronzeBright,
            10,
        );
        const autoButton = createMenuActionButton(
            `AUTO ${state.autoCastEnabled ? "ON" : "OFF"}`,
            84,
            22,
            () => {
                this.skillManager.setAutoCast(definition.id, !state.autoCastEnabled);
                this.refresh();
            },
            state.autoCastEnabled ? MENU_COLORS.success : MENU_COLORS.danger,
            10,
        );
        upgradeButton.position.set(x, y + 42);
        autoButton.position.set(x + 120, y + 42);
        this.root.addChild(upgradeButton, autoButton);
    }

    private cycleSkillSlot(slotIndex: number): void {
        const basicSkillId = this.skillManager.getEquippedSkillId(0);
        const candidates = this.skillManager.getAllSkills()
            .filter(({ definition, state }) => state.unlocked && definition.id !== basicSkillId)
            .map(({ definition }) => definition.id);
        if (candidates.length === 0) return;

        const current = this.skillManager.getEquippedSkillId(slotIndex);
        const currentIndex = current ? candidates.indexOf(current) : -1;
        for (let offset = 1; offset <= candidates.length; offset += 1) {
            const candidate = candidates[(currentIndex + offset) % candidates.length];
            if (this.skillManager.equipSkill(candidate, slotIndex)) {
                const name = this.skillManager.getSkillDefinition(candidate)?.name ?? candidate;
                this.statusMessage = `Đã gắn ${name} vào ô ${slotIndex + 1}.`;
                this.refresh();
                return;
            }
        }
    }

    private format(value: number): string {
        return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }
}
