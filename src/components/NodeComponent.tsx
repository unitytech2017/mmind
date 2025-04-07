import { FC, useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Node } from '../types';
import { Plus, Squircle, X } from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  updateNode: (id: string, data: { text?: string; x?: number; y?: number }) => void;
  addNode: (parentId: string) => void;
  deleteNode: (id: string) => void;
  scale: number;
}

const NodeComponent: FC<NodeComponentProps> = ({ node, updateNode, addNode, deleteNode, scale }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [editing]);

  // Update text when node text changes externally
  useEffect(() => {
    setText(node.text);
  }, [node.text]);

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    updateNode(node.id, { x: data.x, y: data.y });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleTextSubmit = () => {
    updateNode(node.id, { text });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    }
  };

  // Calculate the contrast color for text based on background
  const getContrastColor = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness (YIQ equation)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white or black based on brightness
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const textColor = getContrastColor(node.color);

  return (
    <Draggable
      position={{ x: node.x, y: node.y }}
      onStop={handleDragStop}
      bounds="parent"
      handle=".handle"
      scale={scale}
    >
      <div
        className="absolute flex flex-col items-center"
        style={{ width: '150px' }}
      >
        <div
          className="handle w-full p-4 rounded-lg shadow-md cursor-move"
          style={{ 
            backgroundColor: node.color, 
            color: textColor,
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {editing ? (
            <input
              ref={textInputRef}
              value={text}
              onChange={handleTextChange}
              onBlur={handleTextSubmit}
              onKeyDown={handleKeyDown}
              className="w-full bg-white text-gray-800 p-1 rounded focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="text-center font-medium">{node.text}</div>
          )}
        </div>
        
        <div className="flex mt-2 space-x-2">
          <button
            onClick={() => addNode(node.id)}
            className="p-1 bg-white text-gray-600 rounded-full shadow hover:bg-gray-100"
            title="Add child node"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1 bg-white text-gray-600 rounded-full shadow hover:bg-gray-100"
            title="Edit node"
          >
            <Squircle size={16} />
          </button>
          {node.parentId && (
            <button
              onClick={() => deleteNode(node.id)}
              className="p-1 bg-white text-red-500 rounded-full shadow hover:bg-red-50"
              title="Delete node"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default NodeComponent;
