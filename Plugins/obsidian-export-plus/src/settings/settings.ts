import { HexString } from "obsidian";

export interface ExportPlusSettings {
    scale: number;
    delay: number;
    paperWidth: number;
    paperHeight: number;
    overlayColor: HexString;
    overlayTransparency: number;
    overlayEnabled: boolean;
}

export const DEFAULT_SETTINGS: ExportPlusSettings = {
    scale: 0,
    delay: 200,
    paperWidth: 8.5,
    paperHeight: 11,
    overlayColor: "#ff0000",
    overlayTransparency: 0.15,
    overlayEnabled: false,
};
