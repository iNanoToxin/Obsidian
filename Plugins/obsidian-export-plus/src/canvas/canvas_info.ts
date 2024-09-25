import { Canvas, CanvasNode } from "./canvas_interface";

const MAX_CANVAS_SIZE = 16384;

export class CaptureInfo {
    private canvas: Canvas;
    zoom: number;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.zoom = 0;
    }

    get scale(): number {
        return Math.pow(2, -this.zoom);
    }

    get maxScale(): number {
        let { min, max } = this.boundingBox;
        return Math.min(
            MAX_CANVAS_SIZE / this.pixelRatio / (max.x - min.x),
            MAX_CANVAS_SIZE / this.pixelRatio / (max.y - min.y)
        );
    }

    get image() {
        const { min, max } = this.boundingBox;
        const tile_w = (max.x - min.x) / (this.width * this.scale);
        const tile_h = (max.y - min.y) / (this.height * this.scale);

        return {
            tileCountX: Math.ceil(tile_w),
            tileCountY: Math.ceil(tile_h),
            width: Math.floor(tile_w * this.width * this.pixelRatio),
            height: Math.floor(tile_h * this.height * this.pixelRatio),
        };
    }

    get width(): number {
        return this.canvas.canvasRect.width;
    }

    get height(): number {
        return this.canvas.canvasRect.height;
    }

    get pixelRatio(): number {
        return this.canvas.wrapperEl.win.devicePixelRatio;
    }

    get canvasEmpty(): boolean {
        return this.canvas.nodes.size == 0;
    }

    get boundingBox(): { min: DOMPoint; max: DOMPoint } {
        let min = new DOMPoint(Infinity, Infinity);
        let max = new DOMPoint(-Infinity, -Infinity);
        this.canvas.nodes.forEach((node: CanvasNode) => {
            min.x = Math.min(min.x, node.x);
            min.y = Math.min(min.y, node.y);
            max.x = Math.max(max.x, node.x + node.width);
            max.y = Math.max(max.y, node.y + node.height);
        });
        return { min, max };
    }

    setZoom(zoom: number) {
        this.zoom = zoom;
    }

    changed(width: number, height: number, pixelRatio: number): boolean {
        return this.width != width || this.height != height || this.pixelRatio != pixelRatio;
    }
}
