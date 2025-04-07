export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[];
  parentId: string | null;
  color: string;
}

export interface NodeData {
  text?: string;
  x?: number;
  y?: number;
  children?: string[];
  color?: string;
}
