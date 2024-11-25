import { loadMathJax, App, Plugin, ListedFiles } from "obsidian";
import { LatexExtensionSettings } from "src/ui/settings_tab";
import { DEFAULT_SETTINGS, PluginSettings } from "src/settings/settings";

declare global {
    var MathJax: any;
}

export default class LatexExtension extends Plugin {
    app: App;
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();
        await loadMathJax();

        this.addSettingTab(new LatexExtensionSettings(this.app, this));

        if (!MathJax) {
            console.warn("MathJax was not defined despite loading it.");
            return;
        }

        await this.loadPreambles();
    }

    async loadPreambles() {
        return this.getPreambles(this.settings.folderPath)
            .then((preambles: string[]) => {
                this.onMathJaxReady(() => preambles.forEach((preamble) => MathJax.tex2chtml(preamble)));
            })
            .catch(() => {
                console.error("Invalid preambles folder:", this.settings.folderPath);
            });
    }

    async getPreambles(path: string): Promise<string[]> {
        return this.app.vault.adapter.list(path).then(async (listedFiles: ListedFiles) => {
            const folderPreambles = await Promise.all(
                listedFiles.folders.map(async (folderPath) => this.getPreambles(folderPath))
            );

            const filePreambles = await Promise.all(
                listedFiles.files
                    .filter((filePath) => filePath.endsWith(".sty"))
                    .map(async (filePath) => this.app.vault.adapter.read(filePath))
            );

            return [...filePreambles, ...folderPreambles.flat()];
        });
    }

    onMathJaxReady(callback: () => void) {
        if (MathJax.tex2chtml == undefined) {
            MathJax.startup.ready = () => {
                MathJax.startup.defaultReady();
                callback();
            };
        } else {
            callback();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
