import { Notice } from "obsidian";
import { PropertyManager } from "../util/property_manager";
import { CaptureInfo } from "./canvas_info";
import { ProgressBarPopup } from "src/ui/progress_bar_popup";
import { Canvas } from "common/interface/canvas";
import ExportPlus from "src/main";

export class CanvasCapture {
    private canvas: Canvas;
    private delay: number;
    private captureInfo: CaptureInfo;
    private propertyManager: PropertyManager;
    private plugin: ExportPlus;
    private progressBar: ProgressBarPopup;
    private cancelled: boolean;

    constructor(plugin: ExportPlus, canvas: Canvas, zoom: number) {
        this.plugin = plugin;
        this.canvas = canvas;
        this.delay = plugin.settings.delay;
        this.cancelled = false;
        this.progressBar = new ProgressBarPopup();
        this.propertyManager = new PropertyManager();
        this.captureInfo = new CaptureInfo(canvas);
        this.captureInfo.setZoom(zoom);
    }

    private setViewportState(x: number, y: number, zoom: number) {
        if (!(this.canvas.x === x && this.canvas.y === y && this.canvas.zoom === zoom)) {
            this.propertyManager.setValue(this.canvas, "x", x);
            this.propertyManager.setValue(this.canvas, "tx", x);
            this.propertyManager.setValue(this.canvas, "y", y);
            this.propertyManager.setValue(this.canvas, "ty", y);
            this.propertyManager.setValue(this.canvas, "zoom", zoom);
            this.propertyManager.setValue(this.canvas, "tZoom", zoom);
            this.canvas.markViewportChanged();
        }
    }

    cancel() {
        this.progressBar.close();
        this.cancelled = true;
    }

    async capture() {
        if (this.captureInfo.canvasEmpty) {
            new Notice("Canvas is empty.");
            return;
        }

        const { x, y, zoom, readonly } = this.canvas;
        const { image } = this.captureInfo;
        try {
            let win = this.canvas.wrapperEl.win;
            let w = win.outerWidth * 0.6;
            let h = win.outerHeight * 0.1;
            let x = win.screenX + win.outerWidth / 2 - w / 2;
            let y = win.screenY + win.outerHeight / 2 - h / 2;

            this.cancelled = false;
            this.progressBar.open(x, y, w, h);
            this.progressBar.setMessage("Rendering tiles...");
            this.progressBar.el.createEl("button", { cls: "mod-cta", text: "Stop" }, (button: HTMLButtonElement) => {
                button.style.marginTop = "20px";
                button.onClickEvent(this.cancel.bind(this));
            });
            this.setCanvasCaptureState(true, readonly);

            const fullCanvas = this.canvas.wrapperEl.doc.createElement("canvas");
            fullCanvas.width = image.width;
            fullCanvas.height = image.height;

            await this.captureTiles(fullCanvas)
                .then(() => CanvasCapture.canvasToBuffer(fullCanvas))
                .then((buffer: Buffer) => {
                    let vault = this.plugin.app.vault;
                    let suffix = "";
                    let path = "";
                    let counter = 0;

                    do {
                        switch (this.plugin.settings.fileSaveOption) {
                            case "folder": {
                                path = `${this.plugin.settings.fileSavePath}/${this.canvas.view.file.basename}${suffix}.png`;
                                break;
                            }
                            case "current":{
                                path = `${this.canvas.view.file.parent.path}/${this.canvas.view.file.basename}${suffix}.png`;
                                break;
                            }
                            case "subfolder":{
                                path = `${this.canvas.view.file.parent.path}/${this.plugin.settings.fileSavePath}/${this.canvas.view.file.basename}${suffix}.png`;
                                break;
                            }
                            default: {
                                path = `${this.canvas.view.file.basename}${suffix}.png`;
                                break;
                            }
                        }
                        suffix = ` (${++counter})`;
                    } while (vault.getAbstractFileByPath(path));

                    const folderPath = path.substring(0, path.lastIndexOf("/"));
                    const folder = vault.getAbstractFileByPath(folderPath);

                    if (!folder) {
                        vault.createFolder(folderPath);
                    }
                    return vault.createBinary(path, buffer);
                })
                .then(() => {
                    new Notice("Successfully saved canvas.");
                })
                .catch((error: Error) => {
                    console.error(`image_error: ${error.message}`);
                    new Notice("Failed to save image.");
                });
        } catch (error) {
            console.error(`capture_error: ${error.message}`);
            new Notice("Failed to capture canvas.");
        } finally {
            this.setCanvasCaptureState(false, readonly);
            this.canvas.setViewport(x, y, zoom);
            this.progressBar.close();
        }
    }

    private setCanvasCaptureState(toggle: boolean, readonly: boolean) {
        if (toggle) {
            this.canvas.screenshotting = true;
            this.canvas.wrapperEl.addClass("is-screenshotting");
            this.canvas.wrapperEl.doc.body.appendChild(this.canvas.wrapperEl);

            this.canvas.deselectAll();
            this.canvas.setDragging(false);

            this.propertyManager.disableAll(this.canvas, ["x", "y", "tx", "ty", "zoom", "tZoom"]);
            this.propertyManager.disableAll(this.canvas, [
                "handleDragToSelect",
                "onSelectionContextMenu",
                "select",
                "selectOnly",
                "selectAll",
            ]);

            this.canvas.readonly = true;
            this.canvas.wrapperEl.toggleClass("mod-readonly", true);
            this.canvas.menu.render(true);
        } else {
            this.canvas.screenshotting = false;
            this.canvas.view.contentEl.appendChild(this.canvas.wrapperEl);
            this.canvas.wrapperEl.removeClass("is-screenshotting");

            this.propertyManager.reset();
            this.canvas.setReadonly(readonly);
        }
        this.canvas.onResize();
    }

    private async captureTiles(canvas: HTMLCanvasElement) {
        // Returns an object that provides methods and properties for drawing and manipulating images
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get canvas context.");
        }

        await sleep(this.delay);

        const { image, boundingBox, scale, zoom, width, height, pixelRatio } = this.captureInfo;

        // Enlarge canvas and take screenshots of each tile
        for (let y = 0; y < image.tileCountY; y++) {
            for (let x = 0; x < image.tileCountX; x++) {
                this.canvas.onResize();
                this.setViewportState(
                    boundingBox.min.x + (x + 0.5) * width * scale,
                    boundingBox.min.y + (y + 0.5) * height * scale,
                    zoom
                );

                console.log(this.captureInfo.height, height);

                // Somewhat reliable wait time until next render
                while (this.canvas.frame !== 0) {
                    await sleep(this.delay);
                }

                console.log(this.captureInfo.height, height);

                if (this.cancelled) {
                    throw new Error("Cancelled capture.")
                }

                if (this.captureInfo.changed(width, height, pixelRatio)) {
                    throw new Error("Viewport changed size.");
                }

                let total = image.tileCountX * image.tileCountY;
                let current = x + y * image.tileCountX + 1;
                this.progressBar.setMessage(`Rendering tiles... (${current}/${total})`);
                this.progressBar.setProgress(current, total);

                await this.captureScreen().then((image: HTMLImageElement) => {
                    context.drawImage(image, x * width * pixelRatio, y * height * pixelRatio);
                });
            }
        }
    }

    private async captureScreen(): Promise<HTMLImageElement | null> {
        const { left, top, width, height } = this.canvas.canvasRect;

        // Capture screenshot of enlarged tile
        return (this.canvas.wrapperEl.win as any).electron.remote
            .getCurrentWebContents()
            .capturePage({
                x: left,
                y: top,
                width: width,
                height: height,
            })
            .then((screenshot: any) => {
                const buffer = screenshot.toPNG();
                const blob = new Blob([buffer], { type: "image/png" });
                return CanvasCapture.createImageFromBlob(blob);
            });
    }

    private static createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(blob);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
        });
    }

    private static canvasToBuffer(canvas: HTMLCanvasElement): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(Buffer.from(reader.result as ArrayBuffer));
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(blob);
                } else {
                    reject(new Error("Failed to create blob from canvas."));
                }
            }, "image/png");
        });
    }
}
