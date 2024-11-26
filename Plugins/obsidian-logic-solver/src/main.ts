import { Editor, Plugin } from "obsidian";
import { DetailedMenu, LogicSolverContextMenu } from "src/ui/menu";
import { copyTruthTable, getTruthTable } from "src/solver/truth_table";

export default class LogicSolver extends Plugin {
    async onload() {
        this.addCommand({
            id: "generate-truth-table",
            name: "Generate Truth Table",
            editorCallback: () => getTruthTable(this.app),
        });

        this.addCommand({
            id: "copy-truth-table",
            name: "Copy Truth Table",
            editorCallback: () => copyTruthTable(this.app),
        });

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: DetailedMenu, editor: Editor) => {
                LogicSolverContextMenu(this.app, menu, editor);
            })
        );
    }
}
