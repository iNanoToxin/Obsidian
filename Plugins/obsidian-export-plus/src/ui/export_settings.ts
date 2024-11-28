import {
    ColorComponent,
    DropdownComponent,
    HexString,
    PluginSettingTab,
    SearchComponent,
    Setting,
    SliderComponent,
    TextComponent,
    ToggleComponent,
} from "obsidian";
import { ATTACHMENT_LOCATION_OPTIONS, DEFAULT_SETTINGS } from "src/settings/settings";
import { FolderSuggest } from "common/file/folder_suggest";
import ExportPlus from "src/main";

export class ExportSettings extends PluginSettingTab {
    private plugin: ExportPlus;
    private folderSetting: Setting;
    private subfolderSetting: Setting;
    private folderText: TextComponent;
    private subfolderText: TextComponent;
    private dropdown: DropdownComponent;

    constructor(plugin: ExportPlus) {
        super(plugin.app, plugin);
        this.plugin = plugin;

        plugin.addSettingTab(this);
    }

    updateFileDropdown(value: string): void {
        this.folderSetting.settingEl.toggle("folder" === value);
        this.subfolderSetting.settingEl.toggle("subfolder" === value);
    }

    getSavePath(): string {
        const dropdownValue: string = this.dropdown.getValue();

        switch (dropdownValue) {
            case "root":
                return "/";
            case "folder":
                return this.folderText.getValue();
            case "current":
                return "./";
            case "subfolder":
                return this.subfolderText.getValue();
            default:
                return "/"; // Return root folder
        }
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
                    .onChange(async (value: string) => {
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
            .addText((text: TextComponent) => {
                text.setPlaceholder(DEFAULT_SETTINGS.paperHeight.toString())
                    .setValue(this.plugin.settings.paperHeight.toString())
                    .onChange(async (value: string) => {
                        let number = parseFloat(value);
                        if (!isNaN(number)) {
                            this.plugin.settings.paperHeight = number;
                            await this.plugin.saveSettings();
                        }
                    });
            });

        new Setting(this.containerEl)
            .setName("Overlay Color")
            .setDesc("Set the color of your paper overlay.")
            .addColorPicker((colorPicker: ColorComponent) => {
                colorPicker
                    .onChange(async (hex: HexString) => {
                        this.plugin.settings.overlayColor = hex;
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.overlayColor);
            });

        new Setting(this.containerEl)
            .setName("Overlay Transparency")
            .setDesc("Set the transparency of your paper overlay.")
            .addSlider((slider: SliderComponent) => {
                slider
                    .setLimits(0, 1, "any")
                    .setInstant(true)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.settings.overlayTransparency = value;
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.overlayTransparency);
            });

        new Setting(this.containerEl)
            .setName("Printer Theme")
            .setDesc("Always display theme in black and white.")
            .addToggle((toggle: ToggleComponent) => {
                toggle
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.themeBlackAndWhite = value;
                        this.plugin.themeStatusBar.setPrintTheme(this.plugin.themeStatusBar.enabled);
                        await this.plugin.saveSettings();
                    })
                    .setValue(this.plugin.settings.themeBlackAndWhite);
            });

        this.containerEl.createEl("h1", { text: "Files" });

        new Setting(this.containerEl)
            .setName("Default location for images")
            .setDesc("Where newly exported canvas images are stored.")
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .onChange(async (value: string) => {
                        this.updateFileDropdown(value);
                        this.plugin.settings.fileSaveOption = value;
                        this.plugin.settings.fileSavePath = this.getSavePath();
                        await this.plugin.saveSettings();
                    })
                    .addOptions(ATTACHMENT_LOCATION_OPTIONS)
                    .setValue(this.plugin.settings.fileSaveOption);
                this.dropdown = dropdown;
            });

        this.folderSetting = new Setting(this.containerEl)
            .setName("Attachment folder path")
            .setDesc("Place exported files in this folder.")
            .addSearch((search: SearchComponent) => {
                search.setPlaceholder("Example: notes/exported").onChange(async () => {
                    this.plugin.settings.fileSavePath = this.getSavePath();
                    await this.plugin.saveSettings();
                });

                new FolderSuggest(this.plugin.app, search.inputEl);
                this.folderText = search;
            });

        this.subfolderSetting = new Setting(this.containerEl)
            .setName("Subfolder name")
            .setDesc(
                'If your file is under "vault/folder", and you set subfolder name to "attachments", attachments will be saved to "vault/folder/attachments".'
            )
            .addText((text: TextComponent) => {
                text.setPlaceholder("attachments").onChange(async () => {
                    this.plugin.settings.fileSavePath = this.getSavePath();
                    await this.plugin.saveSettings();
                });
                this.subfolderText = text;
            });

        this.updateFileDropdown(this.plugin.settings.fileSaveOption);

        if (this.plugin.settings.fileSaveOption == "folder") {
            this.folderText.setValue(this.plugin.settings.fileSavePath);
        } else if (this.plugin.settings.fileSaveOption == "subfolder") {
            this.subfolderText.setValue(this.plugin.settings.fileSavePath);
        }
    }
}
