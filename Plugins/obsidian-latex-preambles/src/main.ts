import { loadMathJax, App, Plugin, PluginManifest, PluginSettingTab, Setting, ListedFiles } from "obsidian";
import { LatexExtensionSettings } from "src/ui/settings_tab";
import { DEFAULT_SETTINGS, PluginSettings } from "src/settings/settings";

export default class LatexExtension extends Plugin {
    app: App;
    settings: PluginSettings;

    async loadPreambles() {
        try {
            const listedFiles = await this.app.vault.adapter.list(this.settings.folderPath);
            const preambles: string[] = [];

            if (!listedFiles) {
                return;
            }

            // Use map to create an array of promises and await all at once
            await Promise.all(
                listedFiles.files
                    .filter((filePath: string) => filePath.endsWith(".sty"))
                    .map((filePath: string) =>
                        this.app.vault.adapter.read(filePath).then((preamble: string) => {
                            console.log(`Loaded preamble: ${filePath}`);
                            preambles.push(preamble);
                        })
                    )
            );

            // @ts-expect-error Undocumented Obsidian API
            let MathJax = window.MathJax;

            if (MathJax.tex2chtml == undefined) {
                // Ensure MathJax is ready before processing
                MathJax.startup.ready = () => {
                    MathJax.startup.defaultReady();
                    preambles.forEach((preamble) => MathJax.tex2chtml(preamble));
                };
            } else {
                // Process immediately if MathJax is already ready
                preambles.forEach((preamble) => MathJax.tex2chtml(preamble));
            }
        } catch (error) {
            console.error("Invalid preambles folder:", this.settings.folderPath);
        }
    }

    async onload() {
        await this.loadSettings();
        await loadMathJax();

        this.addSettingTab(new LatexExtensionSettings(this.app, this));

        // @ts-expect-error Undocumented Obsidian API
        if (!MathJax) {
            console.warn("MathJax was not defined despite loading it.");
            return;
        }

        await this.loadPreambles();
        // TODO: Refresh view?
    }

    onunload() {
        // TODO: Is it possible to remove our definitions?
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
