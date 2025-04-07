import { FC } from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

const ConnectionLine: FC<ConnectionLineProps> = ({ startX, startY, endX, endY, color }) => {
  return (
    <line
      x1={startX}
      y1={startY}
      x2={endX}
      y2={endY}
      stroke={color}
      strokeWidth="2"
      strokeDasharray="4 2"
    />
  );
};

export default ConnectionLine;
