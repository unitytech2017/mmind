import { FC } from 'react';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import { Node } from '../types';

interface MindMapProps {
  nodes: Node[];
  updateNode: (id: string, data: { text?: string; x?: number; y?: number }) => void;
  addNode: (parentId: string) => void;
  deleteNode: (id: string) => void;
  scale: number;
}

const MindMap: FC<MindMapProps> = ({ nodes, updateNode, addNode, deleteNode, scale }) => {
  // Create connection lines between nodes and their parent
  const renderConnections = () => {
    return nodes
      .filter(node => node.parentId !== null)
      .map(node => {
        const parentNode = nodes.find(n => n.id === node.parentId);
        if (!parentNode) return null;

        return (
          <ConnectionLine
            key={`connection-${node.id}-${parentNode.id}`}
            startX={parentNode.x + 75} // Adjust based on node width
            startY={parentNode.y + 30} // Adjust based on node height
            endX={node.x + 75}
            endY={node.y + 30}
            color={node.color}
          />
        );
      });
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          No mind map found. Create a new one.
        </div>
      )}
      
      {/* Zoom container */}
      <div 
        className="absolute inset-0 origin-center transition-transform duration-200"
        style={{ 
          transform: `scale(${scale})`,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderConnections()}
        </svg>
        
        {/* Nodes */}
        {nodes.map(node => (
          <NodeComponent
            key={node.id}
            node={node}
            updateNode={updateNode}
            addNode={addNode}
            deleteNode={deleteNode}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
};

export default MindMap;
