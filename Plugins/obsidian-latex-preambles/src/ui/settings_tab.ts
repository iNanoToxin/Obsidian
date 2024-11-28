import { App, PluginSettingTab, Setting } from "obsidian";
import { FolderSuggest } from "common/folder_suggest";
import LatexExtension from "src/main";

export class LatexExtensionSettings extends PluginSettingTab {
    plugin: LatexExtension;

    constructor(app: App, plugin: LatexExtension) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h1", { text: "General" });

        new Setting(this.containerEl)
            .setName("Latex preamble folder")
            .setDesc("Folder that holds all your latex preamble files. (Refresh to see changes)")
            .addText((text) => {
                if (this.plugin.settings.folderPath.length > 0) {
                    text.setValue(this.plugin.settings.folderPath);
                }

                text.setPlaceholder("Example: notes/preambles").onChange(async (value: string) => {
                    this.plugin.settings.folderPath = value;
                    await this.plugin.saveSettings();
                });

                new FolderSuggest(this.plugin.app, text.inputEl);
            });
    }
}
