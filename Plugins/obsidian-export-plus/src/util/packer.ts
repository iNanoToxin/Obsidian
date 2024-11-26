class Vec2i {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

interface Dimension {
    size: number;
    index: number;
}

export class Rect {
    x: number = 0;
    y: number = 0;
    width: number;
    height: number;
    wasPacked: boolean = false;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

class DynamicGrid {
    private readonly gridSize = 400;
    private data: boolean[] = [];
    rows: Dimension[] = [];
    columns: Dimension[] = [];

    constructor(width: number, height: number) {
        this.data = new Array(this.gridSize * this.gridSize).fill(false);
        this.rows = [{ size: width, index: 0 }];
        this.columns = [{ size: height, index: 0 }];
    }

    get(x: number, y: number): boolean {
        const rowIndex = this.rows[y].index;
        const columnIndex = this.columns[x].index;
        return this.data[this.getDataLocation(columnIndex, rowIndex)];
    }

    set(x: number, y: number, val: boolean) {
        const rowIndex = this.rows[y].index;
        const columnIndex = this.columns[x].index;
        this.data[this.getDataLocation(columnIndex, rowIndex)] = val;
    }

    private getDataLocation(x: number, y: number): number {
        return this.gridSize * y + x;
    }

    getRowHeight(y: number): number {
        return this.rows[y].size;
    }

    getColumnWidth(x: number): number {
        return this.columns[x].size;
    }

    insertRow(atY: number, oldRowHeight: number) {
        const rowIndex = this.rows[atY].index;
        for (let i = 0; i < this.columns.length; i++) {
            this.data[this.getDataLocation(i, this.rows.length)] = this.data[this.getDataLocation(i, rowIndex)];
        }

        const old = this.rows[atY];
        this.rows.splice(atY, 0, { size: old.size - oldRowHeight, index: this.rows.length });
        this.rows[atY + 1].size = oldRowHeight;
    }

    insertColumn(atX: number, oldColumnWidth: number) {
        const columnIndex = this.columns[atX].index;
        for (let i = 0; i < this.rows.length; i++) {
            this.data[this.getDataLocation(this.columns.length, i)] = this.data[this.getDataLocation(columnIndex, i)];
        }

        const old = this.columns[atX];
        this.columns.splice(atX, 0, { size: old.size - oldColumnWidth, index: this.columns.length });
        this.columns[atX + 1].size = oldColumnWidth;
    }

    canBePlaced(desiredNode: Vec2i, desiredRectSize: Vec2i, outRequiredNode: Vec2i, outRemainingSize: Vec2i): boolean {
        let foundWidth = 0;
        let foundHeight = 0;

        let trialX = desiredNode.x;
        let trialY = desiredNode.y;

        while (foundHeight < desiredRectSize.y) {
            trialX = desiredNode.x;
            foundWidth = 0;

            if (trialY >= this.rows.length) return false;

            foundHeight += this.getRowHeight(trialY);

            while (foundWidth < desiredRectSize.x) {
                if (trialX >= this.columns.length) return false;

                if (this.get(trialX, trialY)) return false;

                foundWidth += this.getColumnWidth(trialX);
                trialX++;
            }
            trialY++;
        }

        if (trialX - desiredNode.x <= 0 || trialY - desiredNode.y <= 0) return false;

        outRequiredNode.x = trialX - desiredNode.x;
        outRequiredNode.y = trialY - desiredNode.y;
        outRemainingSize.x = foundWidth - desiredRectSize.x;
        outRemainingSize.y = foundHeight - desiredRectSize.y;

        return true;
    }
}

function packRectsGridSplitter(rects: Rect[], width: number, height: number) {
    rects.sort((a, b) => b.width * b.height - a.width * a.height);

    const grid = new DynamicGrid(width, height);

    for (const rect of rects) {
        let done = false;
        let yPos = 0;

        rect.x = 0;
        rect.y = 0;
        rect.wasPacked = false;

        for (let y = 0; y < grid.rows.length && !done; y++) {
            let xPos = 0;

            for (let x = 0; x < grid.columns.length && !done; x++) {
                const leftOverSize = new Vec2i(0, 0);
                const requiredNode = new Vec2i(0, 0);

                if (grid.canBePlaced(new Vec2i(x, y), new Vec2i(rect.width, rect.height), requiredNode, leftOverSize)) {
                    done = true;
                    rect.x = xPos;
                    rect.y = yPos;

                    const xFarRightColumn = x + requiredNode.x - 1;
                    grid.insertColumn(xFarRightColumn, leftOverSize.x);

                    const yFarBottomRow = y + requiredNode.y - 1;
                    grid.insertRow(yFarBottomRow, leftOverSize.y);

                    for (let i = x + requiredNode.x - 1; i >= x; i--) {
                        for (let j = y + requiredNode.y - 1; j >= y; j--) {
                            grid.set(i, j, true);
                        }
                    }
                }
                xPos += grid.getColumnWidth(x);
            }
            yPos += grid.getRowHeight(y);
        }

        if (!done) continue;

        rect.wasPacked = true;
    }
}

export function calculatePackingDimensions(rects: Rect[]) {
    const packedArea = rects
        .filter((rect) => rect.wasPacked)
        .reduce((sum, rect) => sum + rect.width * rect.height, 0);

    const totalWidth = Math.max(...rects.filter((rect) => rect.wasPacked).map((rect) => rect.x + rect.width));
    const totalHeight = Math.max(...rects.filter((rect) => rect.wasPacked).map((rect) => rect.y + rect.height));
    const containerArea = totalWidth * totalHeight;

    return {
        width: totalWidth,
        height: totalHeight,
        ratio: packedArea / containerArea
    };
}

export function binarySearchPack(
    rects: Rect[],
    ratio: number,
    reverse: boolean = false
): void {
    let W = 1;
    let H = 0;

    const pack = () => packRectsGridSplitter(rects, reverse ? H : W, reverse ? W : H);

    while (!rects.every((rect) => rect.wasPacked)) {
        W *= 2;
        H = W * ratio;
        pack();
    }

    let low = 0;
    let high = W;
    let optimalWidth = 0;

    while (low <= high) {
        W = Math.floor((low + high) / 2);
        H = W * ratio;
        pack();

        if (rects.every((rect) => rect.wasPacked)) {
            optimalWidth = W;
            high = W - 1;
        } else {
            low = W + 1;
        }
    }

    W = optimalWidth;
    H = W * ratio;
    pack();
}
