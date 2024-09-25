export interface CanvasNode {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasRect {
    left: number;
    top: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Canvas {
    setReadonly: any;
    nodes: Map<string, CanvasNode>;
    x: number;
    y: number;
    tx: number;
    ty: number;
    tZoom: number;
    zoom: number;
    menu: any;
    view: any;
    frame: number;
    readonly: boolean;
    canvasEl: HTMLElement;
    wrapperEl: HTMLElement;
    screenshotting: boolean;
    canvasRect: CanvasRect;
    setDragging: (toggle: boolean) => void;
    setViewport: (x: number, y: number, zoom: number) => void;
    onResize: () => void;
    deselectAll: () => void;
    markViewportChanged: () => void;
    handleDragToSelect: () => void;
    onSelectionContextMenu: () => void;
    select: () => void;
    selectOnly: () => void;
    selectAll: () => void;
}
