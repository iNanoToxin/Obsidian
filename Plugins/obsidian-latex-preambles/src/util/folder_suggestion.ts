import { AbstractInputSuggest, App, TFolder } from "obsidian";

export class FolderSuggestion extends AbstractInputSuggest<TFolder | null> {
    static MAX_SUGGESTIONS: number;
    includeRoot: boolean;
    allowNullSelection: boolean;

    constructor(app: App, inputEl: HTMLInputElement, allowNullSelection: boolean = false, includeRoot: boolean = false) {
        super(app, inputEl);
        this.includeRoot = includeRoot;
        this.allowNullSelection = allowNullSelection;
    }

    // Render each suggestion in the dropdown
    renderSuggestion(suggestion: TFolder | null, inputEl: HTMLInputElement) {
        if (suggestion) {
            inputEl.setText(suggestion.path);
        } else {
            inputEl.setText("+ " + this.getValue());
        }
    }

    // Get the list of folder suggestions based on the input
    getSuggestions(query: string) {
        const lowerCaseQuery = query.toLowerCase();
        const suggestions = [];

        const folders = this.app.vault.getAllFolders(this.includeRoot);
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];

            if (suggestions.length >= FolderSuggestion.MAX_SUGGESTIONS) {
                break;
            }

            if (this.filePredicate(folder, lowerCaseQuery)) {
                suggestions.push(folder);
            }
        }

        // Allow for null selection if configured
        if (this.allowNullSelection && query) {
            suggestions.push(null);
        }
        return suggestions;
    }

    // Check if the folder path contains the query text
    filePredicate(folder: TFolder, query: string) {
        return folder.path.toLowerCase().includes(query);
    }

    // Handle when a suggestion is selected
    selectSuggestion(suggestion: TFolder, event: MouseEvent | KeyboardEvent) {
        if (suggestion) {
            this.setValue(suggestion.path);
            (this as any).textInputEl.trigger("input");
        }
        this.close();
        super.selectSuggestion(suggestion, event);
    }
}

// Set the maximum number of suggestions to show
FolderSuggestion.MAX_SUGGESTIONS = 100;
