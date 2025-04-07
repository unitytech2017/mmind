import { useState, useEffect } from 'react';
import './index.css';
import MindMap from './components/MindMap';
import { Node, NodeData } from './types';
import { v4 as uuidv4 } from 'uuid';
import { LayoutGrid, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [title, setTitle] = useState<string>('Untitled Mind Map');
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    // Load from localStorage if available
    const savedMap = localStorage.getItem('mindmap');
    if (savedMap) {
      try {
        const parsed = JSON.parse(savedMap);
        setNodes(parsed.nodes || []);
        setTitle(parsed.title || 'Untitled Mind Map');
        setScale(parsed.scale || 1);
      } catch (e) {
        console.error('Failed to load mind map from localStorage');
      }
    } else {
      // Create a default central node if no saved data
      createCentralNode();
    }
  }, []);

  useEffect(() => {
    // Save to localStorage when nodes change
    if (nodes.length > 0) {
      localStorage.setItem('mindmap', JSON.stringify({ nodes, title, scale }));
    }
  }, [nodes, title, scale]);

  const createCentralNode = () => {
    const centerNode: Node = {
      id: uuidv4(),
      text: 'Central Topic',
      x: window.innerWidth / 2 - 75,
      y: window.innerHeight / 2 - 30,
      children: [],
      parentId: null,
      color: '#a5b4fc' // Pastel indigo
    };
    
    setNodes([centerNode]);
  };

  const addNode = (parentId: string) => {
    const parentNode = findNode(parentId, nodes);
    if (!parentNode) return;

    const offset = 180;
    const childCount = parentNode.children.length;
    const angle = (childCount * (Math.PI / 4)) % (2 * Math.PI);
    
    const newNodeId = uuidv4();
    const newNode: Node = {
      id: newNodeId,
      text: 'New Topic',
      x: parentNode.x + offset * Math.cos(angle),
      y: parentNode.y + offset * Math.sin(angle),
      children: [],
      parentId: parentId,
      color: getPastelColor()
    };

    const updatedNodes = updateNodeInTree(parentId, nodes, (node) => {
      return {
        ...node,
        children: [...node.children, newNodeId]
      };
    });

    setNodes([...updatedNodes, newNode]);
  };

  const updateNode = (nodeId: string, data: NodeData) => {
    setNodes(nodes.map(node => node.id === nodeId ? { ...node, ...data } : node));
  };

  const deleteNode = (nodeId: string) => {
    const nodeToDelete = findNode(nodeId, nodes);
    if (!nodeToDelete) return;
    
    // Can't delete the central node (node with no parent)
    if (!nodeToDelete.parentId) return;

    // Remove node from its parent's children array
    const updatedNodes = updateNodeInTree(nodeToDelete.parentId, nodes, (node) => {
      return {
        ...node,
        children: node.children.filter(id => id !== nodeId)
      };
    });

    // Remove the node and all its descendants
    const nodesToKeep = updatedNodes.filter(node => !isDescendantOf(node.id, nodeId, nodes));
    setNodes(nodesToKeep);
  };

  // Check if a node is a descendant of another node
  const isDescendantOf = (nodeId: string, ancestorId: string, nodeList: Node[]): boolean => {
    if (nodeId === ancestorId) return true;
    
    const node = findNode(nodeId, nodeList);
    if (!node || !node.parentId) return false;
    
    return isDescendantOf(node.parentId, ancestorId, nodeList);
  };

  const findNode = (nodeId: string, nodeList: Node[]): Node | undefined => {
    return nodeList.find(node => node.id === nodeId);
  };

  const updateNodeInTree = (nodeId: string, nodeList: Node[], updateFn: (node: Node) => Node): Node[] => {
    return nodeList.map(node => node.id === nodeId ? updateFn(node) : node);
  };

  const getPastelColor = () => {
    const pastelColors = [
      '#a5b4fc', // Pastel indigo
      '#bfdbfe', // Pastel blue
      '#a7f3d0', // Pastel green
      '#fde68a', // Pastel yellow
      '#fed7aa', // Pastel orange
      '#fecaca', // Pastel red
      '#ddd6fe', // Pastel purple
      '#fbcfe8', // Pastel pink
      '#e5e7eb', // Pastel gray
      '#c4b5fd', // Pastel violet
      '#99f6e4', // Pastel teal
      '#d8b4fe', // Pastel fuchsia
    ];
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const clearMindMap = () => {
    if (window.confirm('Are you sure you want to clear this mind map and start a new one?')) {
      localStorage.removeItem('mindmap');
      createCentralNode();
      setScale(1);
    }
  };

  const autoArrangeNodes = () => {
    // Find the central node (node with no parent)
    const centralNode = nodes.find(node => !node.parentId);
    if (!centralNode) return;

    // Create a deep copy of nodes to work with
    const newNodes = [...nodes];
    
    // Set the central node position
    const centerX = window.innerWidth / 2 - 75;
    const centerY = window.innerHeight / 2 - 30;
    
    // Update central node position
    const centralNodeIndex = newNodes.findIndex(node => node.id === centralNode.id);
    newNodes[centralNodeIndex] = {
      ...centralNode,
      x: centerX,
      y: centerY
    };

    // First, determine which nodes are on the left vs right side of the central node
    const nodesPosition = new Map<string, 'left' | 'right'>();
    
    // For all direct children of the central node, determine if they're left or right
    centralNode.children.forEach(childId => {
      const child = findNode(childId, newNodes);
      if (child) {
        // If child is to the left of central node, mark as 'left', otherwise 'right'
        const position = child.x < centralNode.x ? 'left' : 'right';
        nodesPosition.set(childId, position);
        
        // Mark all descendants with same position
        markDescendantsPosition(childId, position, newNodes, nodesPosition);
      }
    });
    
    // For nodes not yet positioned (new nodes), default to alternating sides
    newNodes.forEach(node => {
      if (node.parentId && !nodesPosition.has(node.id)) {
        const parentPosition = nodesPosition.get(node.parentId);
        nodesPosition.set(node.id, parentPosition || 'right');
      }
    });

    // Organize nodes by their levels
    const nodesByLevel = organizeNodesByLevel(centralNode.id, newNodes);
    
    // Position nodes at each level
    for (let level = 1; level < nodesByLevel.length; level++) {
      const nodesAtLevel = nodesByLevel[level];
      
      // Separate nodes by left/right side
      const leftNodes: string[] = [];
      const rightNodes: string[] = [];
      
      nodesAtLevel.forEach(nodeId => {
        const position = nodesPosition.get(nodeId);
        if (position === 'left') leftNodes.push(nodeId);
        else rightNodes.push(nodeId);
      });
      
      // Position left nodes in semi-circle on left side
      positionNodesInSemiCircle(leftNodes, newNodes, level, 'left');
      
      // Position right nodes in semi-circle on right side
      positionNodesInSemiCircle(rightNodes, newNodes, level, 'right');
    }
    
    setNodes(newNodes);
  };
  
  // Helper function to mark all descendants with same left/right position
  const markDescendantsPosition = (
    nodeId: string, 
    position: 'left' | 'right', 
    nodeList: Node[], 
    positionMap: Map<string, 'left' | 'right'>
  ) => {
    const node = findNode(nodeId, nodeList);
    if (!node) return;
    
    positionMap.set(nodeId, position);
    
    node.children.forEach(childId => {
      markDescendantsPosition(childId, position, nodeList, positionMap);
    });
  };
  
  // Helper function to position nodes in a semi-circle
  const positionNodesInSemiCircle = (
    nodeIds: string[], 
    nodeList: Node[], 
    level: number, 
    side: 'left' | 'right'
  ) => {
    if (nodeIds.length === 0) return;
    
    const radius = 200 * level; // Increase radius for each level
    const centralNode = nodeList.find(node => !node.parentId);
    if (!centralNode) return;
    
    const centerX = centralNode.x + 75; // Center X
    const centerY = centralNode.y + 30; // Center Y
    
    nodeIds.forEach((nodeId, index) => {
      const node = findNode(nodeId, nodeList);
      if (!node || !node.parentId) return;
      
      // Get the parent node
      const parentNode = findNode(node.parentId, nodeList);
      if (!parentNode) return;
      
      // Calculate angle based on index and total count
      // For left side: angles from π to 2π (bottom to top)
      // For right side: angles from 0 to π (top to bottom)
      const totalNodes = nodeIds.length;
      let startAngle, endAngle;
      
      if (side === 'left') {
        startAngle = Math.PI;
        endAngle = 2 * Math.PI;
      } else { // right side
        startAngle = 0;
        endAngle = Math.PI;
      }
      
      const angleRange = endAngle - startAngle;
      const angle = startAngle + (angleRange * index) / Math.max(1, totalNodes - 1);
      
      // Calculate new position
      const parentX = parentNode.x + 75; // Add half node width
      const parentY = parentNode.y + 30; // Add half node height
      
      const newX = centerX + radius * Math.cos(angle) - 75; // Subtract half node width
      const newY = centerY + radius * Math.sin(angle) - 30; // Subtract half node height
      
      // Update the node's position
      const nodeIndex = nodeList.findIndex(n => n.id === nodeId);
      nodeList[nodeIndex] = {
        ...node,
        x: newX,
        y: newY
      };
    });
  };

  // Helper function to organize nodes by their level in the hierarchy
  const organizeNodesByLevel = (rootId: string, nodeList: Node[]): string[][] => {
    const levels: string[][] = []; // Array of arrays, each containing node IDs at that level
    
    // First level is just the root node
    levels.push([rootId]);
    
    // Function to recursively add children
    const addChildrenToLevel = (parentIds: string[], currentLevel: number) => {
      const childrenIds: string[] = [];
      
      parentIds.forEach(parentId => {
        const parent = findNode(parentId, nodeList);
        if (parent && parent.children.length > 0) {
          childrenIds.push(...parent.children);
        }
      });
      
      if (childrenIds.length > 0) {
        levels[currentLevel] = childrenIds;
        addChildrenToLevel(childrenIds, currentLevel + 1);
      }
    };
    
    // Start adding children from level 1
    addChildrenToLevel([rootId], 1);
    
    return levels;
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">Mind Map</h1>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mind Map Title"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="Reset zoom"
              >
                <RotateCcw size={18} />
              </button>
            </div>
            <button
              onClick={autoArrangeNodes}
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              title="Auto-arrange nodes"
            >
              <LayoutGrid className="mr-2" size={18} />
              Auto Arrange
            </button>
            <button
              onClick={clearMindMap}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              New Mind Map
            </button>
          </div>
        </div>
      </header>
      
      <main className="p-4">
        <MindMap
          nodes={nodes}
          updateNode={updateNode}
          addNode={addNode}
          deleteNode={deleteNode}
          scale={scale}
        />
      </main>
    </div>
  );
}

export default App;
