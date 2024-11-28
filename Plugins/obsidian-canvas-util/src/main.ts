import { Plugin, setIcon, setTooltip } from "obsidian";
import { BBox, Canvas, CanvasNode } from "common/interface/canvas";

const SPACING = 20;
const SNAP_GRID = (n: number) => Math.ceil(n / SPACING) * SPACING;

export default class MyPlugin extends Plugin {
    saved: HTMLElement[];

    async onload() {
        this.saved = [];

        this.app.workspace.onLayoutReady(() => {
            this.app.workspace.getLeavesOfType("canvas").forEach(this.onLeaf.bind(this));

            this.app.workspace.on("layout-change", () => {
                this.onunload();
                this.app.workspace.getLeavesOfType("canvas").forEach(this.onLeaf.bind(this));
            });
        });

        this.registerInterval(window.setInterval(this.updateScrollbar, 500));
    }

    onLeaf(leaf: any) {
        const controlEl: HTMLElement = leaf?.view?.canvas?.canvasControlsEl;

        if (!controlEl) {
            return;
        }

        const onNodeSnap = this.onNodeSnap.bind(this, leaf.view.canvas);
        const onNodeResize = this.onNodeResize.bind(this, leaf.view.canvas);
        const onGroupResize = this.onGroupResize.bind(this, leaf.view.canvas);

        const newGroup = controlEl.createDiv("canvas-control-group", function (group: HTMLElement) {
            group.createDiv("canvas-control-item", function (item: HTMLElement) {
                setIcon(item, "lucide-expand");
                setTooltip(item, "Snap cards", {
                    placement: "left",
                });
                item.addEventListener("click", function () {
                    leaf.view.canvas.nodes.forEach(onNodeSnap);
                });
            });

            group.createDiv("canvas-control-item", function (item: HTMLElement) {
                setIcon(item, "lucide-shrink");
                setTooltip(item, "Resize cards", {
                    placement: "left",
                });
                item.addEventListener("click", function () {
                    leaf.view.canvas.nodes.forEach(onNodeResize);
                    leaf.view.canvas.nodes.forEach(onGroupResize);
                });
            });
        });

        this.saved.push(newGroup);
    }

    onNodeSnap(canvas: Canvas, node: CanvasNode) {
        const attr = ["x", "y", "width", "height"];

        let changed = false;
        attr.forEach((property: string) => {
            const snapped = SNAP_GRID(node[property]);

            if (node[property] != snapped) {
                node[property] = snapped;
                changed = true;
            }
        });

        if (changed) {
            node.render();
            canvas.requestSave();
        }
    }

    onNodeResize(canvas: Canvas, node: CanvasNode) {
        if (node.unknownData.type == "group") return;

        let previewEl: HTMLElement = node?.child?.previewMode?.renderer?.previewEl;

        if (previewEl && previewEl.isShown()) {
            let oldHeight = SNAP_GRID(node.height);
            node.height = 0;
            node.render();

            while (previewEl.clientHeight < previewEl.scrollHeight) {
                node.height += previewEl.scrollHeight - previewEl.clientHeight;
                node.render();
            }

            if (SNAP_GRID(node.height) != oldHeight) {
                canvas.requestSave();
            }
        }

        this.onNodeSnap(canvas, node);
    }

    onGroupResize(canvas: Canvas, node: CanvasNode, key: string, map: Map<string, CanvasNode>) {
        if (node.unknownData.type != "group") return;

        let changed = false;
        while (true) {
            let lastBBox = node.getBBox();

            const innerNodes = Array.from(map.values())
                .filter((innerNode: CanvasNode) => innerNode.unknownData.type !== "group")
                .filter((innerNode: CanvasNode) => {
                    const inner = innerNode.getBBox();
                    const outer = node.getBBox();
                    return !(
                        inner.maxX < outer.minX ||
                        inner.minX > outer.maxX ||
                        inner.maxY < outer.minY ||
                        inner.minY > outer.maxY
                    );
                });

            let bbox: BBox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

            innerNodes.forEach((innerNode: CanvasNode) => {
                const outer = innerNode.getBBox();
                bbox.minX = Math.min(bbox.minX, outer.minX);
                bbox.minY = Math.min(bbox.minY, outer.minY);
                bbox.maxX = Math.max(bbox.maxX, outer.maxX);
                bbox.maxY = Math.max(bbox.maxY, outer.maxY);
            });

            if (innerNodes.length > 0) {
                node.x = bbox.minX - SPACING;
                node.y = bbox.minY - SPACING;
                node.width = bbox.maxX - bbox.minX + SPACING * 2;
                node.height = bbox.maxY - bbox.minY + SPACING * 2;
                node.render();

                this.onNodeSnap(canvas, node);
                changed = true;
            }

            const b1 = node.getBBox();
            const b2 = lastBBox;
            if (b1.minX == b2.minX && b1.minY == b2.minY && b1.maxX == b2.maxX && b1.maxY == b2.maxY) {
                break;
            }
        }

        if (changed) {
            canvas.requestSave();
        }
    }

    updateScrollbar() {
        // Fixes the scrollbar issue when there is already enough space
        this.app.workspace.getLeavesOfType("canvas").forEach((leaf: any) => {
            leaf.view?.canvas?.nodes?.forEach((node: CanvasNode) => {
                if (node.unknownData.type != "group") {
                    node.child?.previewMode?.renderer?.onResize();
                }
            });
        });
    }

    onunload() {
        this.saved.forEach((group) => group.remove());
    }
}
