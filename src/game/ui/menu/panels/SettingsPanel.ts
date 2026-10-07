import { Container } from "pixi.js";
import type { SaveManager } from "../../../save/SaveManager";
import { CURRENT_SAVE_VERSION } from "../../../save/SaveVersion";
import { createMenuActionButton, createMenuText } from "../MenuComponents";
import { MENU_COLORS } from "../MenuTheme";
import type { MenuPanel } from "../MenuPanel";

export class SettingsPanel implements MenuPanel {
    private readonly root = new Container();
    private statusMessage = "";

    public constructor(
        private readonly saveManager: SaveManager,
        private readonly onPersistentStateChanged: () => void,
    ) {
        this.refresh();
    }

    public getView(): Container {
        return this.root;
    }

    public refresh(): void {
        this.root.removeChildren();
        const title = createMenuText("CÀI ĐẶT · SAVE", 18, MENU_COLORS.bronzeBright);
        const lastSavedAt = this.saveManager.getLastSavedAt();
        const info = createMenuText([
            `Save Version: ${CURRENT_SAVE_VERSION}`,
            `Last Save: ${lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString("vi-VN") : "Chưa có"}`,
            this.statusMessage,
        ].filter(Boolean).join("\n"), 12);
        info.position.set(0, 38);

        const actions = [
            ["LƯU GAME", () => {
                this.statusMessage = this.saveManager.save() ? "Đã lưu game" : "Lưu game thất bại";
                this.refresh();
            }, MENU_COLORS.success],
            ["TẢI GAME", () => {
                const result = this.saveManager.load();
                this.statusMessage = result.success
                    ? `Đã tải save v${result.version}`
                    : `Tải thất bại: ${result.reason ?? "Không rõ"}`;
                if (result.success) this.onPersistentStateChanged();
                this.refresh();
            }, MENU_COLORS.jadeBright],
            ["XÓA SAVE", () => {
                this.saveManager.deleteSave();
                this.statusMessage = "Đã xóa save; runtime được giữ nguyên";
                this.refresh();
            }, MENU_COLORS.danger],
            ["RESET GAME", () => {
                this.saveManager.resetPersistentProgress();
                this.onPersistentStateChanged();
                this.statusMessage = "Đã reset permanent progress";
                this.refresh();
            }, MENU_COLORS.warning],
        ] as const;

        actions.forEach(([label, action, color], index) => {
            const button = createMenuActionButton(label, 150, 34, action, color, 12);
            button.position.set(index * 170, 112);
            this.root.addChild(button);
        });

        this.root.addChild(title, info);
    }
}
