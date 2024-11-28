export interface BBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface CanvasRect {
    left: number;
    top: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasNode {
    x: number;
    y: number;
    width: number;
    height: number;
    unknownData: {
        type: string;
    };
    render: () => void;
    resize: (args: { width: number; height: number }) => void;
    bbox: BBox;
    getBBox: () => BBox;

    [key: string]: any;
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
    gridSpacing: number;
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
    requestSave: () => void;
}
