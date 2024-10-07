import { ContentSync } from "src/util/content_sync";

export class ProgressBarPopup {
    el: HTMLElement;
    messageEl: HTMLElement;
    lineEl: HTMLElement;
    line1El: HTMLElement;
    line2El: HTMLElement;

    overlay: WindowProxy | null;
    contentSync: ContentSync;

    // Create progress bar indicator and sublines
    private createProgressBarIndicator() {
        // Create progress bar container
        this.el = document.createElement("div");
        this.el.className = "progress-bar";

        // Create message element
        this.messageEl = this.el.createDiv({ cls: "progress-bar-message u-center-text" });

        const indicator = this.el.createDiv({ cls: "progress-bar-indicator" });
        indicator.createDiv({ cls: "progress-bar-line" });

        // Create sublines for progress animation
        this.lineEl = indicator.createDiv({ cls: "progress-bar-subline" });
        this.line1El = indicator.createDiv({ cls: "progress-bar-subline mod-increase" });
        this.line2El = indicator.createDiv({ cls: "progress-bar-subline mod-decrease" });

        // Prevent default behavior on click
        this.el.addEventListener("click", this.preventClick);
    }

    private preventClick(e: Event) {
        e.preventDefault();
    }

    // Show the progress bar immediately
    open(x: number, y: number, w: number, h: number) {
        this.overlay = window.open("about:blank", "_blank", `popup,x=${x},y=${y},width=${w},height=${h}`);

        if (this.overlay) {
            let base = createEl("base", { href: location.href });
            this.overlay.document.head.appendChild(base);
            this.contentSync = new ContentSync(this.overlay, [base]);

            this.createProgressBarIndicator();
            this.setUnknownProgress();
            this.overlay.document.body.appendChild(this.el);
        }
    }

    // Set the message to display in the progress bar
    setMessage(message: string) {
        this.messageEl.setText(message);
    }

    // Set the progress bar to unknown progress state
    setUnknownProgress() {
        this.lineEl.hide();
        this.line1El.show();
        this.line2El.show();
    }

    // Set the progress as a percentage of `current` over `total`
    setProgress(current: number, total: number) {
        this.lineEl.show();
        this.line1El.hide();
        this.line2El.hide();

        // Calculate percentage and update the width of the progress line
        const progressPercentage = ((current / total) * 100).toFixed(4);
        this.lineEl.style.width = `${progressPercentage}%`;
    }

    close() {
        if (this.overlay && !this.overlay.closed) {
            if (this.el.parentElement) {
                this.el.removeEventListener("click", this.preventClick);
                this.el.remove();
            }
            this.overlay.close();
            this.contentSync.cleanup();
            this.overlay = null;
        }
    }
}
