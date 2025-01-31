interface IFileExplorerNode {
  id: string;
  name: string;
  isFolder: boolean;
  path: string;
  nodes: IFileExplorerNode[];
}

export type { IFileExplorerNode };
