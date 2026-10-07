import { Container, Text } from "pixi.js";
import type { BreakthroughRewardSystem } from "../../../cultivation/BreakthroughRewardSystem";
import { CULTIVATION_LAYERS_PER_STAGE } from "../../../cultivation/cultivationConfig";
import { CULTIVATION_REALM_LABELS } from "../../../cultivation/CultivationRealm";
import { CULTIVATION_STAGE_LABELS } from "../../../cultivation/CultivationStage";
import type { CultivationSystem } from "../../../cultivation/CultivationSystem";
import { createMenuActionButton, createMenuText } from "../MenuComponents";
import { MENU_COLORS } from "../MenuTheme";
import type { MenuPanel } from "../MenuPanel";

export class CultivationPanel implements MenuPanel {
    private readonly root = new Container();
    private readonly details: Text;
    private readonly progress: Text;
    private readonly status: Text;

    public constructor(
        private readonly cultivationSystem: CultivationSystem,
        private readonly breakthroughRewardSystem: BreakthroughRewardSystem,
    ) {
        const title = createMenuText("TU LUYỆN", 18, MENU_COLORS.bronzeBright);
        this.details = createMenuText("", 13);
        this.progress = createMenuText("", 12);
        this.status = createMenuText("", 12, MENU_COLORS.warning);

        this.details.position.set(0, 34);
        this.progress.position.set(330, 34);
        this.status.position.set(330, 140);
        this.progress.style.lineHeight = 18;

        this.root.addChild(title, this.details, this.progress, this.status);
        this.refresh();
    }

    public getView(): Container {
        return this.root;
    }

    public refresh(): void {
        this.root.removeChildren(4);
        this.details.text = [
            `Cảnh giới: ${CULTIVATION_REALM_LABELS[this.cultivationSystem.getRealm()]}`,
            `Giai đoạn: ${CULTIVATION_STAGE_LABELS[this.cultivationSystem.getStage()]}`,
            `Tầng: ${this.cultivationSystem.getLayer()} / ${CULTIVATION_LAYERS_PER_STAGE}`,
        ].join("\n");
        this.progress.text = [
            `Tu Vi: ${this.format(this.cultivationSystem.getCultivation())} / ${this.format(this.cultivationSystem.getRequiredCultivation())}`,
            `Tốc độ: ${this.format(this.cultivationSystem.getCultivationPerSecond())} / giây`,
            `Ô kỹ năng: ${this.breakthroughRewardSystem.getSkillSlotCount()} / 5`,
            `Ô công pháp: ${this.breakthroughRewardSystem.getTechniqueSlotCount()}`,
            `Ô pháp bảo: ${this.breakthroughRewardSystem.getArtifactSlotCount()}`,
            `Nội tại: ${this.breakthroughRewardSystem.getUnlockedPassives().join(", ") || "Chưa mở"}`,
            this.breakthroughRewardSystem.getNextRewardSummary(),
        ].join("\n");

        if (this.cultivationSystem.isMaxCultivation()) {
            this.status.text = "Đã đạt cảnh giới tối đa";
            return;
        }

        this.status.text = "";
        const button = createMenuActionButton(
            "ĐỘT PHÁ",
            126,
            30,
            () => {
                if (this.cultivationSystem.breakthrough()) {
                    this.breakthroughRewardSystem.reconcile(true);
                    this.status.text = "Đột phá thành công";
                } else {
                    this.status.text = "Chưa đủ Tu Vi";
                }
                this.refresh();
            },
            MENU_COLORS.bronzeBright,
            12,
        );
        button.position.set(0, 122);
        this.root.addChild(button);
    }

    private format(value: number): string {
        const rounded = Math.round(value * 100) / 100;
        return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
    }
}
