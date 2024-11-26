import { HexString } from "obsidian";

export interface ExportPlusSettings {
    scale: number;
    delay: number;
    paperWidth: number;
    paperHeight: number;
    overlayColor: HexString;
    overlayTransparency: number;
    overlayEnabled: boolean;
    printThemeEnabled: boolean;
    fileSaveOption: string;
    fileSavePath: string;
    themeBlackAndWhite: boolean;
    packedFolderPath: string;
    packedVertical: boolean;
}

export const ATTACHMENT_LOCATION_OPTIONS: Record<string, string> = {
    root: "Vault folder",
    folder: "In the folder specified below",
    current: "Same folder as current file",
    subfolder: "In subfolder under current folder",
};

export const DEFAULT_SETTINGS: ExportPlusSettings = {
    scale: 0,
    delay: 200,
    paperWidth: 8.5,
    paperHeight: 11,
    overlayColor: "#ff0000",
    overlayTransparency: 0.15,
    overlayEnabled: false,
    printThemeEnabled: false,
    themeBlackAndWhite: false,

    fileSaveOption: "root",
    fileSavePath: "/",
    packedFolderPath: "/",
    packedVertical: true,
};
