import { App, ButtonComponent, Editor, Menu, MenuItem, Modal, Setting, TextComponent } from "obsidian";
import { copyTruthTable, getTruthTable } from "../solver/truth_table";

export interface DetailedMenu extends Menu {
    items: DetailedMenu[];
    section: string;
    submenu: DetailedMenu;
}

export class InputModal extends Modal {
    input: string;
    callback: (input: string) => void;

    constructor(app: App, callback: (input: string) => void) {
        super(app);
        this.input = "";
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", {
            text: "Enter logical expression",
        });

        new Setting(contentEl)
            .setName("Logical expression")
            .setDesc("Enter latex expression")
            .addText((text: TextComponent) => {
                text.setPlaceholder("Expression")
                    .onChange((value) => {
                        this.input = value;
                    })
                    .inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
                        if (event.key === "Enter") {
                            this.close();
                            this.callback(this.input);
                        }
                    });
            });

        new Setting(contentEl).addButton((button: ButtonComponent) => {
            button
                .setButtonText("Submit")
                .setCta()
                .onClick(() => {
                    this.close();
                    this.callback(this.input);
                });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export function contextMenu(app: App, menu: DetailedMenu, editor: Editor): void {
    const selectionMenu: DetailedMenu | undefined = Object.values(menu.items)
        .filter((category: DetailedMenu) => category.section == "selection")
        .find((category: DetailedMenu) =>
            category.submenu?.items.find((section) => section.section == "selection-insert-advanced")
        );

    selectionMenu?.submenu.addItem((item: MenuItem) => {
        item.setSection("selection-insert-advanced")
            .setTitle("Truth Table")
            .setIcon("table-2")
            .onClick(async () => getTruthTable(app));
    });

    if (editor.getSelection()) {
        menu.addItem((item) => {
            item.setTitle("Copy Truth Table")
                .setIcon("table-2")
                .onClick(() => copyTruthTable(app));
        });
    }
}
