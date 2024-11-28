import { SliderComponent } from "obsidian";
import ExportPlus from "src/main";

export class ThemeStatusBar {
    statusBarItemEl: HTMLElement;
    plugin: ExportPlus;
    enabled: boolean;

    constructor(plugin: ExportPlus) {
        let app: any = plugin.app;

        this.plugin = plugin;
        this.enabled = false;

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

            // Enable css style
            document.body.classList.toggle("printer-mode", true);
        } else {
            // Set original mode
            app.changeTheme(app.vault.getConfig("theme"));
            // Set original theme
            app.customCss.requestLoadTheme();

            // Disable css style
            document.body.classList.toggle("printer-mode", false);
        }
        this.enabled = state;
    }

    update() {
        this.statusBarItemEl.setText(`print-theme: ${this.enabled ? "on" : "off"}`);
    }
}
