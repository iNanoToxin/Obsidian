import { Notice } from "obsidian";
import { Canvas } from "./canvas_interface";
import { PropertyManager } from "../util/property_manager";
import { CaptureInfo } from "./canvas_info";

export class CanvasCapture {
    private canvas: Canvas;
    private delay: number;
    private captureInfo: CaptureInfo;
    private propertyManager: PropertyManager;

    constructor(canvas: Canvas, zoom: number, delay: number) {
        this.canvas = canvas;
        this.delay = delay;
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

    private getFilePath(): Promise<string | null> {
        return (this.canvas.wrapperEl.win as any).electron.remote.dialog
            .showSaveDialog({
                defaultPath: this.canvas.view.file.basename + ".png",
                filters: [
                    { name: "PNG Files", extensions: ["png"] },
                    { name: "All Files", extensions: ["*"] },
                ],
                properties: ["showOverwriteConfirmation"],
            })
            .then((result: { canceled: boolean; filePath?: string }) => {
                if (result.canceled || !result.filePath) {
                    return null;
                }
                return result.filePath;
            });
    }

    async capture() {
        if (this.captureInfo.canvasEmpty) {
            new Notice("Canvas is empty.");
            return;
        }

        const filePath = "C:/Users/Dylan/Documents/Obsidian Vault/Notes/test.png";
        // const filePath = await this.getFilePath();
        // if (!filePath) {
        //     new Notice("Cancelled canvas capture.");
        //     return;
        // }

        const { x, y, zoom, readonly } = this.canvas;
        const { image } = this.captureInfo;

        try {
            this.setCanvasCaptureState(true, readonly);

            const fullCanvas = this.canvas.wrapperEl.doc.createElement("canvas");
            fullCanvas.width = image.width;
            fullCanvas.height = image.height;

            await this.captureTiles(fullCanvas)
                .then(() => CanvasCapture.canvasToBuffer(fullCanvas))
                .then((buffer: Buffer) => {
                    return window.require("original-fs").promises.writeFile(filePath, buffer);
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
        const { image, boundingBox, scale, zoom, width, height, pixelRatio } = this.captureInfo;

        // Returns an object that provides methods and properties for drawing and manipulating images
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to get canvas context.");
        }

        // Enlarge canvas and take screenshots of each tile
        for (let y = 0; y < image.tileCountY; y++) {
            for (let x = 0; x < image.tileCountX; x++) {
                this.canvas.onResize();
                this.setViewportState(
                    boundingBox.min.x + (x + 0.5) * width * scale,
                    boundingBox.min.y + (y + 0.5) * height * scale,
                    zoom
                );

                // Somewhat reliable wait time until next render
                while (this.canvas.frame !== 0) {
                    await sleep(this.delay);
                }

                if (this.captureInfo.changed(width, height, pixelRatio)) {
                    throw new Error("Viewport changed size.");
                }

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
