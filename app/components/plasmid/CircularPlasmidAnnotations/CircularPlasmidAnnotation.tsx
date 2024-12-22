import React from 'react';
import { Feature, LabelPosition } from '../types';
import { createFeaturePath } from '../utils/pathUtils';

interface CircularPlasmidAnnotationProps {
    feature: Feature;
    labelPosition: LabelPosition;
    isSelected: boolean;
    color: string;
    onClick: (e: React.MouseEvent) => void;
    onHover: (label: string | null) => void;
}

export const CircularPlasmidAnnotation: React.FC<CircularPlasmidAnnotationProps> = ({
    feature,
    labelPosition,
    isSelected,
    color,
    onClick,
    onHover,
}) => {
    const path = createFeaturePath(
        feature.start,
        feature.end,
        labelPosition.radius,
        feature.complement
    );

    return (
        <g
            key={feature.id}
            data-feature-id={feature.id}
            data-feature-type={feature.type}
            onClick={onClick}
            onMouseEnter={() => onHover(feature.label)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
        >
            <path
                d={path}
                fill={color}
                opacity={isSelected ? 0.3 : 0.8}
            />
            <line
                x1={labelPosition.featureX}
                y1={labelPosition.featureY}
                x2={labelPosition.radialX}
                y2={labelPosition.radialY}
                stroke="#666"
                strokeWidth="1"
            />
            <text
                x={labelPosition.labelX}
                y={labelPosition.labelY}
                textAnchor={labelPosition.textAnchor}
                dominantBaseline="middle"
                fontSize="12"
                fill="#333"
                transform={`rotate(${labelPosition.rotation}, ${labelPosition.labelX}, ${labelPosition.labelY})`}
            >
                {feature.label}
            </text>
        </g>
    );
}; 