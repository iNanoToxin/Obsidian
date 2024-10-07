import { ItemView, Plugin } from "obsidian";
import { CaptureInputModal } from "./ui/capture_input";
import { CanvasOverlay } from "./ui/canvas_overlay";
import { DEFAULT_SETTINGS, ExportPlusSettings } from "./settings/settings";
import { ExportSettings } from "./ui/export_settings";
import { OverlayStatusBar } from "./ui/overlay_status_bar";
import { ThemeStatusBar } from "./ui/theme_status_bar";

export default class ExportPlus extends Plugin {
    settings: ExportPlusSettings;
    overlays: CanvasOverlay[] = [];
    overlayStatusBar: OverlayStatusBar;
    themeStatusBar: ThemeStatusBar;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "export-canvas-as-image",
            name: "Export Canvas as Image",
            checkCallback: (checking: boolean) => {
                const view: any = this.app.workspace.getActiveViewOfType(ItemView);

                if (view && view.canvas) {
                    if (!checking) {
                        new CaptureInputModal(this, view.canvas).open();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "toggle-paper-overlay",
            name: "Toggle Paper Overlay",
            checkCallback: (checking: boolean) => {
                const view: any = this.app.workspace.getActiveViewOfType(ItemView);

                if (view && view.canvas) {
                    if (!checking) {
                        this.toggleOverlays();
                    }
                    return true;
                }
                return false;
            },
        });

        this.app.workspace.on("layout-change", () => this.updateOverlays(this.settings.overlayEnabled));
        this.updateOverlays(this.settings.overlayEnabled);

        this.overlayStatusBar = new OverlayStatusBar(this);
        this.themeStatusBar = new ThemeStatusBar(this);
        new ExportSettings(this);
    }

    async onunload() {
        this.updateOverlays(false);
        this.themeStatusBar.setPrintTheme(false);
    }

    async toggleOverlays() {
        this.settings.overlayEnabled = !this.settings.overlayEnabled;
        this.updateOverlays(this.settings.overlayEnabled);
        this.overlayStatusBar?.update();
        await this.saveSettings();
    }

    updateOverlays(state: boolean) {
        this.overlays.forEach((overlay: CanvasOverlay) => overlay.unload());
        this.overlays.length = 0;

        if (state) {
            this.app.workspace.getLeavesOfType("canvas").forEach((leaf: any) => {
                this.overlays.push(new CanvasOverlay(this, leaf.view.canvas));
            });
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
