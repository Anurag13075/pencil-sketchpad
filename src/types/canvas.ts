export type Tool =
  | "select"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "line"
  | "arrow"
  | "freedraw"
  | "text"
  | "eraser";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FillStyle = "none" | "solid" | "hachure" | "cross-hatch";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[];
  text?: string;
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  angle: number;
  roughness: number;
  seed: number;
  isDeleted?: boolean;
}

export type HandlePosition =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w";

export interface AppState {
  tool: Tool;
  elements: CanvasElement[];
  selectedIds: Set<string>;
  panOffset: Point;
  zoom: number;
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  roughness: number;
  gridEnabled: boolean;
}

export interface HistoryEntry {
  elements: CanvasElement[];
}
