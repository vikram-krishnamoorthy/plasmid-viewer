import React from 'react';
import { Feature } from '../types';

interface LinearPlasmidLabelAnnotationProps {
  feature: Feature;
  startX: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const LinearPlasmidLabelAnnotation: React.FC<LinearPlasmidLabelAnnotationProps> = ({
  feature,
  startX,
  y,
  width,
  height,
  color,
  isSelected,
  onClick,
}) => {
  // Calculate truncated label if needed
  let labelText = feature.label || '';
  const approximateCharWidth = 6; // Approximate width of each character
  const maxLabelWidth = width - 4; // Leave 2px padding on each side
  const maxChars = Math.floor(maxLabelWidth / approximateCharWidth);

  if (labelText.length * approximateCharWidth > maxLabelWidth) {
    labelText = labelText.slice(0, maxChars - 2) + '..';
  }

  return (
    <g
      data-feature-id={feature.id}
      data-feature-type={feature.type}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={startX}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={isSelected ? 0.3 : 0.8}
        rx={2}
      />
      {labelText && width > 10 && (
        <text
          x={startX + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#333"
          style={{ userSelect: 'none' }}
        >
          {labelText}
        </text>
      )}
    </g>
  );
};
