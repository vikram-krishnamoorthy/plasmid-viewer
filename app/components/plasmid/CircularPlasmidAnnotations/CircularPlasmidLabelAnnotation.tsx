import React from 'react';
import { Feature } from '../types';
import { createFeaturePath } from '../utils/pathUtils';
import { coordsToAngle } from '../utils/constants';

interface CircularPlasmidLabelAnnotationProps {
  feature: Feature;
  radius: number;
  isSelected: boolean;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  onHover: (label: string | null) => void;
  plasmidLength: number;
}

export const CircularPlasmidLabelAnnotation: React.FC<CircularPlasmidLabelAnnotationProps> = ({
  feature,
  radius,
  isSelected,
  color,
  onClick,
  onHover,
  plasmidLength,
}) => {
  // Calculate angles for the arc
  const startAngle = coordsToAngle(feature.start, plasmidLength);
  const endAngle = coordsToAngle(feature.end, plasmidLength);

  // Use the existing path creation utility
  const path = createFeaturePath(startAngle, endAngle, radius, feature.complement);

  return (
    <g
      data-feature-id={feature.id}
      data-feature-type={feature.type}
      onClick={onClick}
      onMouseEnter={() => onHover(feature.label)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      <path d={path} fill={color} opacity={isSelected ? 0.3 : 0.8} />
    </g>
  );
};
