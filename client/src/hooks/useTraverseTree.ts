import { IFileExplorerNode } from "@/interfaces/IFileExplorerNode";
import { v4 as uuid } from "uuid";

export const useTraverseTree = () => {
  const insertNode = (
    fileExplorerNode: IFileExplorerNode,
    nodeId: string,
    name: string,
    isFolder: boolean
  ): IFileExplorerNode => {
    if (fileExplorerNode.id === nodeId) {
      fileExplorerNode.nodes.unshift({
        id: uuid(),
        name,
        isFolder,
        path: `${fileExplorerNode.path}/${name}`,
        nodes: [],
      });
    }

    const latestNodes = fileExplorerNode.nodes.map(
      (node): IFileExplorerNode => insertNode(node, nodeId, name, isFolder)
    );

    return { ...fileExplorerNode, nodes: latestNodes };
  };

  const deleteNode = (
    nodeId: string,
    fileExplorerNode: IFileExplorerNode
  ): IFileExplorerNode | null => {
    if (nodeId === fileExplorerNode.id) {
      return null;
    }

    const updatedNodes = fileExplorerNode.nodes
      .map((node): IFileExplorerNode | null => deleteNode(nodeId, node))
      .filter((node) => node !== null);

    return { ...fileExplorerNode, nodes: updatedNodes as IFileExplorerNode[] };
  };

  return { insertNode, deleteNode };
};
