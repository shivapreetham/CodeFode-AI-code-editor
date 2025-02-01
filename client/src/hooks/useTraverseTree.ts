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

  const renameNode = (
    nodeId: string,
    newName: string,
    fileExplorerNode: IFileExplorerNode
  ): IFileExplorerNode => {
    if (nodeId === fileExplorerNode.id) {
      const newPath = fileExplorerNode.path.replace(fileExplorerNode.name, newName);
      return { ...fileExplorerNode, name: newName, path: newPath };
    }

    const updatedNodes = fileExplorerNode.nodes.map(
      (node) => renameNode(nodeId, newName, node)
    );

    return { ...fileExplorerNode, nodes: updatedNodes };
  };

  const moveNode = (
    sourceId: string,
    targetId: string,
    fileExplorerNode: IFileExplorerNode
  ): IFileExplorerNode => {
    let nodeToMove: IFileExplorerNode | null = null;
    
    const removeNode = (node: IFileExplorerNode): IFileExplorerNode => {
      if (node.id === sourceId) {
        nodeToMove = { ...node };
        return {
          ...node,
          nodes: []
        };
      }
      return {
        ...node,
        nodes: node.nodes
          .map(removeNode)
          .filter((n) => n.id !== sourceId),
      };
    };

    const tempTree = removeNode(fileExplorerNode);
    
    const insertNode = (node: IFileExplorerNode): IFileExplorerNode => {
      if (node.id === targetId && nodeToMove) {
        const newPath = `${node.path}/${nodeToMove.name}`;
        return {
          ...node,
          nodes: [{ ...nodeToMove, path: newPath }, ...node.nodes],
        };
      }
      return {
        ...node,
        nodes: node.nodes.map(insertNode),
      };
    };

    return nodeToMove ? insertNode(tempTree) : fileExplorerNode;
  };

  return { insertNode, deleteNode, renameNode, moveNode };
};
