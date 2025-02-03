import { SliderComponent } from "obsidian";
import ExportPlus from "src/main";

export class ThemeStatusBar {
    statusBarItemEl: HTMLElement;
    plugin: ExportPlus;
    enabled: boolean;

    lastCssTheme: string;
    lastTheme: string;

    constructor(plugin: ExportPlus) {
        let app: any = plugin.app;

        this.plugin = plugin;
        this.enabled = false;

        this.lastCssTheme = "Default";
        this.lastTheme = "obsidian";

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
    }

    setPrintTheme(state: boolean) {
        let app: any = this.plugin.app;

        if (state) {
            // this.setPrintTheme(false);

            if (this.plugin.settings.themeBlackAndWhite) {
                // Get current theme (return to state later)
                this.lastCssTheme = app.vault.getConfig("cssTheme");
                this.lastTheme = app.getTheme();

                // Set temporary printer-theme preview
                app.customCss.setTheme("Default");
                app.vault.setConfig("theme", "moonstone");
            }

            // Enable css style
            document.body.classList.toggle("printer-mode", true);
        } else {
            // Set original theme
            app.vault.setConfig("theme", this.lastTheme);
            app.customCss.setTheme(this.lastCssTheme);

            // Disable css style
            document.body.classList.toggle("printer-mode", false);
        }
        this.enabled = state;
    }

    update() {
        this.statusBarItemEl.setText(`print-theme: ${this.enabled ? "on" : "off"}`);
    }
}
