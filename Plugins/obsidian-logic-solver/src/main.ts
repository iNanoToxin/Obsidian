import { Editor, Plugin } from "obsidian";
import { DetailedMenu, contextMenu } from "src/ui/menu";
import { copyTruthTable, getTruthTable } from "src/solver/truth_table";

export default class MyPlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: "generate-truth-table-command",
            name: "Generate Truth Table",
            editorCallback: () => getTruthTable(this.app),
        });

        this.addCommand({
            id: "copy-truth-table-command",
            name: "Copy Truth Table",
            editorCallback: () => copyTruthTable(this.app),
        });

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: DetailedMenu, editor: Editor) => {
                contextMenu(this.app, menu, editor);
            })
        );
    }
}
