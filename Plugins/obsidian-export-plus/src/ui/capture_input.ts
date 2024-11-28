import { ButtonComponent, Modal, Setting, SliderComponent, ToggleComponent } from "obsidian";
import { CanvasCapture } from "../canvas/canvas_capture";
import { Canvas } from "common/interface/canvas";
import { CaptureInfo } from "../canvas/canvas_info";
import ExportPlus from "src/main";

export class CaptureInputModal extends Modal {
    canvas: Canvas;
    plugin: ExportPlus;

    constructor(plugin: ExportPlus, canvas: Canvas) {
        super(plugin.app);
        this.canvas = canvas;
        this.plugin = plugin;
    }

    onOpen() {
        let captureInfo = new CaptureInfo(this.canvas);

        this.setTitle("Export as Image");
        this.modalEl.addClass("mod-narrow");

        this.contentEl.createEl("p", {
            cls: "u-muted",
            text: `Export "${this.canvas.view.file.basename}" as a PNG file with the settings below.`,
        });

        const MIN_ZOOM = -1;
        const MAX_ZOOM = 2;

        let zoomSetting = new Setting(this.contentEl);
        zoomSetting
            .setName("Zoom")
            .setDesc("Image dimensions: {0px, 0px}")
            .addSlider((slider: SliderComponent) => {
                slider
                    .setLimits(MIN_ZOOM, MAX_ZOOM, "any")
                    .setInstant(true)
                    .setDynamicTooltip()
                    .onChange(async (scale: number) => {
                        if (captureInfo.canvasEmpty) {
                            zoomSetting.setDesc(`Image dimensions: {0px, 0px}`);
                            return;
                        }

                        const factor = scale < 0 ? Math.abs(MIN_ZOOM) : MAX_ZOOM;
                        captureInfo.setZoom((scale / factor) * Math.log2(captureInfo.maxScale));

                        const { image } = captureInfo;
                        zoomSetting.setDesc(`Image dimensions: {${image.width}px, ${image.height}px}`);

                        this.plugin.settings.scale = scale;
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.scale);
            });

        let delaySetting = new Setting(this.contentEl);
        delaySetting
            .setName("Delay")
            .setDesc("Image capture delay: 0ms")
            .addSlider((slider: SliderComponent) => {
                slider
                    .setLimits(50, 1000, 5)
                    .setInstant(true)
                    .setDynamicTooltip()
                    .onChange(async (delay: number) => {
                        this.plugin.settings.delay = Math.round(delay);
                        delaySetting.setDesc(`Image capture delay: ${delay}ms`);
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.delay);

                slider.getValuePretty = () => `${Math.round(slider.getValue()).toString()}ms`;
            });

        let printThemeSetting = new Setting(this.contentEl);
        printThemeSetting
            .setName("Enable Print Theme")
            .setDesc("Saves canvas in black and white and also reduces wasted space.")
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.printThemeEnabled).onChange(async (value: boolean) => {
                    this.plugin.settings.printThemeEnabled = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(this.contentEl).addButton((button: ButtonComponent) => {
            button
                .setButtonText("Save")
                .setCta()
                .onClick(async () => {
                    let enabled: boolean = this.plugin.themeStatusBar.enabled;

                    this.close();
                    // Remove overlays and enable print theme if enabled
                    this.plugin.updateOverlays(false);
                    this.plugin.themeStatusBar.setPrintTheme(this.plugin.settings.printThemeEnabled);
                    // Capture canvas
                    await new CanvasCapture(this.plugin, this.canvas, captureInfo.zoom).capture();
                    // Restore settings back to default
                    this.plugin.updateOverlays(this.plugin.settings.overlayEnabled);
                    this.plugin.themeStatusBar.setPrintTheme(enabled);
                });
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
