import React from 'react';
import { FloatingItem } from '../types/emotion';

interface FloatingParticlesProps {
  items: FloatingItem[];
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({ items }) => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-float-up absolute flex flex-col items-center justify-center font-bold filter drop-shadow-lg"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            style={{ fontSize: `${item.size}px` }}
            className="select-none leading-none transform transition-transform"
          >
            {item.emoji}
          </span>
          <span
            className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md border-2 border-white whitespace-nowrap"
            style={{
              backgroundColor: item.color,
              color: '#ffffff',
            }}
          >
            +1 {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
