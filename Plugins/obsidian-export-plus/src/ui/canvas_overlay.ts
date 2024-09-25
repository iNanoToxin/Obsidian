import { Canvas } from "src/canvas/canvas_interface";
import { CaptureInfo } from "src/canvas/canvas_info";
import ExportPlus from "src/main";

export class CanvasOverlay {
    private canvas: Canvas;
    private overlay: HTMLElement;
    private frame: number;
    private plugin: ExportPlus;

    constructor(plugin: ExportPlus, canvas: Canvas) {
        this.canvas = canvas;
        this.plugin = plugin;

        this.overlay = document.createElement("div");
        this.overlay.className = "export-plus-overlay";
        this.canvas.canvasEl.appendChild(this.overlay);

        this.render();
    }

    render() {
        const captureInfo = new CaptureInfo(this.canvas);
        captureInfo.setZoom(this.canvas.zoom);

        const { paperWidth, paperHeight, overlayColor, overlayTransparency } = this.plugin.settings;
        const { boundingBox } = captureInfo;
        const lenX = boundingBox.max.x - boundingBox.min.x;
        const lenY = boundingBox.max.y - boundingBox.min.y;
        const paperRatio = paperWidth / paperHeight;

        this.overlay.style.backgroundColor = overlayColor;
        this.overlay.style.opacity = overlayTransparency.toString();

        if (lenX > lenY) {
            this.overlay.style.width = `${Math.max(lenY / paperRatio, lenX)}px`;
            this.overlay.style.height = `${Math.max(lenY, lenX * paperRatio)}px`;
        } else {
            this.overlay.style.width = `${Math.max(lenX, lenY * paperRatio)}px`;
            this.overlay.style.height = `${Math.max(lenX / paperRatio, lenY)}px`;
        }
        this.overlay.style.transform = `translate(${boundingBox.min.x}px, ${boundingBox.min.y}px)`;

        this.frame = requestAnimationFrame(() => this.render());
    }

    unload() {
        cancelAnimationFrame(this.frame);
        this.overlay.remove();
    }
}
