export interface JsonNode {
    x: number;
    y: number;
    width: number;
    height: number;

    id: string;
    type: string;
    color?: string;
    label?: string;
    file?: string;
}

export interface JsonEdge {
    id: string;
    fromNode: string;
    fromSide: string;
    toNode: string;
    toSide: string;
}

export interface JsonCanvas {
    nodes: JsonNode[];
    edges: JsonEdge[];
}
