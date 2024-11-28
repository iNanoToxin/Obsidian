import { AbstractInputSuggest, App, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    includeRoot: boolean = false;
    textInputEl: HTMLInputElement;

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.textInputEl = textInputEl;
    }

    allowRoot(value: boolean) {
        this.includeRoot = value;
    }

    renderSuggestion(suggestion: TFolder, inputEl: HTMLInputElement) {
        inputEl.setText(suggestion.path);
    }

    getSuggestions(query: string) {
        const lowerCaseQuery = query.toLowerCase();
        const folders = this.app.vault.getAllFolders(this.includeRoot);

        return folders.filter((folder) => folder.path.toLowerCase().contains(lowerCaseQuery));
    }

    selectSuggestion(suggestion: TFolder, event: MouseEvent | KeyboardEvent) {
        this.setValue(suggestion.path);
        this.textInputEl.trigger("input");
        this.close();
    }
}
