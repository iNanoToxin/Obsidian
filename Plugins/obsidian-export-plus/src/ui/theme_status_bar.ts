import { ButtonComponent, Setting, SliderComponent } from "obsidian";
import ExportPlus from "src/main";

const PRINT_STYLE = `
:root {
    --sep-spc: 4px;
    --sep-lst: 2em;
}

/* * {
    padding: 0 !important;
} */

/* make all text on canvas black */
div.canvas * {
    color: #000000 !important
}

/* lists */
.markdown-rendered ul>li,
.markdown-rendered ol>li {
    margin-inline-start: var(--sep-lst);
    padding-top: 0px !important;
    padding-bottom: 0px !important;
}

/* canvas card padding left */
.canvas-node-content.markdown-embed>.markdown-embed-content>.markdown-preview-view {
    padding: 0px var(--sep-spc) !important;
}

/* canvas card padding top and bottom */
.canvas-node-content.markdown-embed>.markdown-embed-content>.markdown-preview-view::before,
.canvas-node-content.markdown-embed>.markdown-embed-content>.markdown-preview-view::after {
    min-height: var(--sep-spc) !important;
    max-height: var(--sep-spc) !important;
}

/* canvas card padding right extend */
.markdown-preview-view {
    overflow-y: initial !important;
    /* line-height: 16px !important; */
}

/* callout padding */
.callout {
    margin: 0px 0px var(--sep-spc) 0px !important;
    padding: var(--sep-spc) var(--sep-spc) var(--sep-spc) var(--sep-spc) !important;
}

/* text, list, separator padding */
p, ul, h1, h2, h3, h4, h5, h6, hr {
    margin-block-start: var(--sep-spc) !important;
    margin-block-end: var(--sep-spc) !important;

}

/* canvas card header padding */
.inline-title {
    margin-bottom: 0px !important
}

/* table cell padding */
.cm-html-embed td,
.markdown-rendered td,
.cm-html-embed th,
.markdown-rendered th {
    padding: 0px 0px !important;
    padding: 0px var(--sep-spc) !important;
}

/* negation add extra padding */
mjx-c.mjx-cAC {
    padding-right: 2px;
}

/* canvas card border */
.canvas-node-container {
    /* border-radius: 0px; */
    /* border: 2px solid #000000; */
}

/* canvas card label */
.canvas-node-label {
    display: none;
}

.theme-light {
    --table-border-color: #000000;
    --table-border-width: 2px;
    --list-marker-color: #000000;
    --callout-title-color: #000000;
    --callout-border-width: 2px;

    --canvas-color: 0 0 0;

    --callout-bug: #000000;
    --callout-default: #000000;
    --callout-error: #000000;
    --callout-example: #000000;
    --callout-fail: #000000;
    --callout-important: #000000;
    --callout-info: #000000;
    --callout-question: #000000;
    --callout-success: #000000;
    --callout-summary: #000000;
    --callout-tip: #000000;
    --callout-todo: #000000;
    --callout-warning: #000000;
}
`;

export class ThemeStatusBar {
    statusBarItemEl: HTMLElement;
    styleEl: HTMLStyleElement;
    plugin: ExportPlus;
    enabled: boolean;

    constructor(plugin: ExportPlus) {
        let app: any = plugin.app;

        this.plugin = plugin;
        this.enabled = false;

        this.styleEl = createEl("style", { type: "text/css" });
        this.styleEl.textContent = PRINT_STYLE;

        this.statusBarItemEl = plugin.addStatusBarItem();
        this.statusBarItemEl.addClass("mod-clickable");
        this.statusBarItemEl.onClickEvent(() => {
            this.setPrintTheme(!this.enabled);
            this.update();
        });
        this.update();

        let slider = plugin.addStatusBarItem();
        slider.setText("font-size:");

        new SliderComponent(slider)
            .setLimits(10, 30, 1)
            .setInstant(true)
            .setDynamicTooltip()
            .setValue(app.vault.getConfig("baseFontSize"))
            .onChange((size: number) => {
                app.vault.setConfig("baseFontSize", size);
                app.updateFontSize();
            });

        // new ButtonComponent(slider)
        //     .setIcon("lucide-rotate-ccw")
        //     .setCta()
        //     .setTooltip("Reset")
        //     .onClick(function () {
        //         // u.setValue(h);
        //     });
    }

    setPrintTheme(state: boolean) {
        let app: any = this.plugin.app;

        if (state) {
            this.setPrintTheme(false);

            if (this.plugin.settings.themeBlackAndWhite) {
                // Set temporary default theme preview
                let theme: string = app.vault.getConfig("cssTheme");
                app.customCss.setTheme("Default");
                app.customCss.theme = theme;
                app.vault.setConfig("cssTheme", theme);

                // Set temporary light mode preview
                let mode: string = app.getTheme();
                app.changeTheme("moonstone");
                app.vault.setConfig("theme", mode);
            }

            // Insert css style to app
            app.customCss.styleEl.parentNode.insertAfter(this.styleEl, app.customCss.styleEl);
            app.workspace.trigger("css-change");
        } else {
            // Set original mode
            app.changeTheme(app.vault.getConfig("theme"));
            // Set original theme
            app.customCss.requestLoadTheme();

            // Remove style from app
            this.styleEl.detach();
            app.workspace.trigger("css-change");
        }
        this.enabled = state;
    }

    update() {
        this.statusBarItemEl.setText(`print-theme: ${this.enabled ? "on" : "off"}`);
    }
}
