import { ButtonComponent, Modal, Notice, SearchComponent, Setting, TFile, ToggleComponent } from "obsidian";
import { Rect, binarySearchPack, calculatePackingDimensions } from "src/util/packer";
import { JsonCanvas, JsonNode } from "common/interface/canvas_json";
import { FolderSuggest } from "common/file/folder_suggest"
import ExportPlus from "src/main";


let NOTICE_DURATION = 7 * 1000;

export class PackCanvasModal extends Modal {
    plugin: ExportPlus;
    file: TFile;

    constructor(plugin: ExportPlus, file: TFile) {
        super(plugin.app);
        this.plugin = plugin;
        this.file = file;
    }

    async pack() {
        let { packedFolderPath, paperWidth, paperHeight, packedVertical } = this.plugin.settings;

        let savePath = `${packedFolderPath}/${this.file.basename}.canvas`;
        let ratio = paperHeight / paperWidth;

        return this.app.vault.adapter
            .exists(packedFolderPath)
            .then((exists: boolean) => {
                if (!exists) {
                    throw new Error(`Folder "${packedFolderPath}" does not exist.`);
                }
                return this.app.vault.read(this.file);
            })
            .then((content: string) => JSON.parse(content))
            .then((data: JsonCanvas) => {
                let map = new Map<Rect, JsonNode>();

                data.nodes
                    .filter((node: JsonNode) => node.type === "file" || node.type === "text")
                    .forEach((node: JsonNode) => {
                        map.set(new Rect(node.width, node.height), node);
                    });

                if (map.size == 0) {
                    throw new Error(`Canvas "${this.file.basename}" has no cards.`);
                }

                binarySearchPack(Array.from(map.keys()), ratio, packedVertical);
                return map;
            })
            .then((map: Map<Rect, JsonNode>) => {
                for (const [rect, node] of map) {
                    node.x = rect.x;
                    node.y = rect.y;
                    node.width = rect.width;
                    node.height = rect.height;
                }

                return {
                    nodes: Array.from(map.values()),
                    dimensions: calculatePackingDimensions(Array.from(map.keys())),
                };
            })
            .then(async ({ nodes, dimensions }) => {
                await this.app.vault.adapter.write(savePath, JSON.stringify({ nodes, edges: [] }, null, 4));

                let messages = [
                    `Packed size: ${dimensions.width}x${dimensions.height}`,
                    `Packing Ratio: ${(dimensions.ratio * 100).toFixed(1)}%`,
                ];
                new Notice(messages.join("\n"), NOTICE_DURATION);
            });
    }

    onOpen() {
        let settings = this.plugin.settings;
        let packMethod = settings.paperWidth <= settings.paperHeight ? "vertically" : "horizontally";

        this.setTitle("Canvas Packer");

        new Setting(this.contentEl)
            .setName("Output Path")
            .setDesc("Enter folder to store packed canvas")
            .addSearch((text: SearchComponent) => {
                if (settings.packedFolderPath !== "/") {
                    text.setValue(settings.packedFolderPath);
                }

                text.setPlaceholder("Example: exported/packed").onChange(async (path: string) => {
                    settings.packedFolderPath = path;
                    await this.plugin.saveSettings();
                });

                // Stop immediate focus
                text.setDisabled(true);
                setTimeout(() => text.setDisabled(false), 10);

                new FolderSuggest(this.app, text.inputEl).allowRoot(true);
            });

        new Setting(this.contentEl)
            .setName(`Pack ${packMethod}`)
            .setDesc(`Will pack the canvas ${packMethod}.`)
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(settings.packedVertical).onChange(async (value: boolean) => {
                    settings.packedVertical = value;
                    this.plugin.saveSettings();
                });
            });

        new Setting(this.contentEl).addButton((button: ButtonComponent) => {
            button
                .setButtonText("Pack")
                .setCta()
                .onClick(() => {
                    this.pack()
                        .then(() => this.close())
                        .catch((reason: any) => {
                            new Notice(reason, NOTICE_DURATION);
                        });
                });
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
