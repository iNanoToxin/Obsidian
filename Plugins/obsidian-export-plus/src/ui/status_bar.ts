import ExportPlus from "src/main";



export class OverlayStatusBar {
    statusBarItemEl: HTMLElement;
    plugin: ExportPlus;

    constructor(plugin: ExportPlus) {
        this.plugin = plugin;
        this.statusBarItemEl = plugin.addStatusBarItem();
        this.statusBarItemEl.addClass("mod-clickable");
        this.statusBarItemEl.onClickEvent(() => {
            plugin.toggleOverlays();
        });
        this.update();
    }

    update() {
        this.statusBarItemEl.setText(`overlay: ${this.plugin.settings.overlayEnabled ? "on" : "off"}`);
    }
}
