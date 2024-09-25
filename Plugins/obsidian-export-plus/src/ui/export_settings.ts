import { ColorComponent, HexString, PluginSettingTab, Setting, SliderComponent, TextComponent } from "obsidian";
import { DEFAULT_SETTINGS } from "src/settings/settings";
import ExportPlus from "src/main";

export class ExportSettings extends PluginSettingTab {
    private plugin: ExportPlus;

    constructor(plugin: ExportPlus) {
        super(plugin.app, plugin);
        this.plugin = plugin;

        plugin.addSettingTab(this);
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h1", { text: "General" });

        new Setting(this.containerEl)
            .setName("Paper Width")
            .setDesc(
                "Set the width of the paper in units (e.g., pixels, inches). This will affect how overlay is laid out on the canvas."
            )
            .addText((text: TextComponent) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.paperWidth.toString())
                    .setValue(this.plugin.settings.paperWidth.toString())
                    .onChange(async (value) => {
                        let number = parseFloat(value);
                        if (!isNaN(number)) {
                            this.plugin.settings.paperWidth = number;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        new Setting(this.containerEl)
            .setName("Paper Height")
            .setDesc(
                "Set the height of the paper in units (e.g., pixels, inches). This will affect how overlay is laid out on the canvas."
            )
            .addText((text: TextComponent) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.paperHeight.toString())
                    .setValue(this.plugin.settings.paperHeight.toString())
                    .onChange(async (value) => {
                        let number = parseFloat(value);
                        if (!isNaN(number)) {
                            this.plugin.settings.paperHeight = number;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        new Setting(this.containerEl)
            .setName("Overlay Color")
            .setDesc("Set the color of your paper overlay.")
            .addColorPicker((colorPicker: ColorComponent) =>
                colorPicker
                    .onChange(async (hex: HexString) => {
                        this.plugin.settings.overlayColor = hex;
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.overlayColor)
            );

        new Setting(this.containerEl)
            .setName("Overlay Transparency")
            .setDesc("Set the transparency of your paper overlay.")
            .addSlider((slider: SliderComponent) =>
                slider
                    .setLimits(0, 1, "any")
                    .setInstant(true)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.settings.overlayTransparency = value;
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.overlayTransparency)
            );
    }
}
