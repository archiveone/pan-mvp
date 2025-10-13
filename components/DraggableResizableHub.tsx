'use client';

import React, { useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/styles.css';
import { GripVertical } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableBox {
  id: string;
  title: string;
  content: React.ReactNode;
  gridPosition: { x: number; y: number; w: number; h: number };
}

interface DraggableResizableHubProps {
  boxes: DraggableBox[];
  onLayoutChange: (layout: Layout[]) => void;
  onEdit: (boxId: string) => void;
}

const DraggableResizableHub: React.FC<DraggableResizableHubProps> = ({
  boxes,
  onLayoutChange,
  onEdit
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const layouts = {
    lg: boxes.map(box => ({
      i: box.id,
      x: box.gridPosition.x,
      y: box.gridPosition.y,
      w: box.gridPosition.w,
      h: box.gridPosition.h,
      minW: 1,
      minH: 1,
      maxW: 2,
      maxH: 3
    }))
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 0 }}
      cols={{ lg: 2, md: 2, sm: 1, xs: 1 }}
      rowHeight={200}
      isDraggable={true}
      isResizable={true}
      onLayoutChange={(layout) => {
        if (!isDragging) {
          onLayoutChange(layout);
        }
      }}
      onDragStart={() => setIsDragging(true)}
      onDragStop={() => setIsDragging(false)}
      onResizeStart={() => setIsDragging(true)}
      onResizeStop={() => setIsDragging(false)}
      draggableHandle=".drag-handle"
      margin={[24, 24]}
      containerPadding={[0, 0]}
    >
      {boxes.map(box => (
        <div key={box.id} className="relative group">
          {/* Drag Handle */}
          <div className="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-20 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
            <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Resize Indicator */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <div className="w-6 h-6 border-r-2 border-b-2 border-gray-400 dark:border-gray-500" />
          </div>

          {/* Box Content */}
          <div className="h-full">
            {box.content}
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default DraggableResizableHub;

