import React from 'react';

interface PlasmidBackboneProps {
  plasmidLength: number;
}

export const PlasmidBackbone: React.FC<PlasmidBackboneProps> = ({ plasmidLength }) => {
  return (
    <g style={{ userSelect: 'none' }}>
      {/* Base circle */}
      <circle cx="300" cy="300" r="200" fill="none" stroke="#333" strokeWidth="1" />

      {/* Base pair markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const bp = Math.round((i / 12) * plasmidLength);
        return (
          <g key={i}>
            <line
              x1={300 + 195 * Math.cos(angle)}
              y1={300 + 195 * Math.sin(angle)}
              x2={300 + 205 * Math.cos(angle)}
              y2={300 + 205 * Math.sin(angle)}
              stroke="#333"
              strokeWidth="1"
            />
            <text
              x={300 + 220 * Math.cos(angle)}
              y={300 + 220 * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#666"
              style={{ pointerEvents: 'none' }}
            >
              {(bp === 0 ? 1 : bp).toLocaleString()}
            </text>
          </g>
        );
      })}
    </g>
  );
};
