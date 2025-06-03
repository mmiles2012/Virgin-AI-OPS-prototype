import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DraggablePanelProps {
  children: ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export function DraggablePanel({ 
  children, 
  className = '', 
  initialPosition = { x: 0, y: 0 },
  onPositionChange 
}: DraggablePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('drag-handle')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };

    // Constrain to viewport
    const panel = panelRef.current;
    if (panel) {
      const rect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newPosition.x = Math.max(0, Math.min(maxX, newPosition.x));
      newPosition.y = Math.max(0, Math.min(maxY, newPosition.y));
    }

    setPosition(newPosition);
    onPositionChange?.(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing bg-transparent z-10" />
      {children}
    </div>
  );
}