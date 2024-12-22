import React from 'react';
import { Feature } from '../types';
import { AMINO_ACID_COLORS } from '../utils/constants';
import { createFeaturePath } from '../utils/pathUtils';
import { coordsToAngle, angleToCoords, PLASMID_CONSTANTS } from '../utils/constants';

interface CircularPlasmidTranslationAnnotationProps {
    feature: Feature;
    radius: number;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onHover: (label: string | null) => void;
    plasmidLength: number;
}

export const CircularPlasmidTranslationAnnotation: React.FC<CircularPlasmidTranslationAnnotationProps> = ({
    feature,
    radius,
    isSelected,
    onClick,
    onHover,
    plasmidLength,
}) => {
    if (!feature.translation) return null;

    // Calculate label position (same as label annotation)
    const midAngle = coordsToAngle((feature.start + feature.end) / 2, plasmidLength);
    const featureCoords = angleToCoords(midAngle, radius);
    const radialPoint = angleToCoords(midAngle, PLASMID_CONSTANTS.LABEL_RADIUS);
    const isRightSide = radialPoint.x > PLASMID_CONSTANTS.CENTER;
    const labelOffset = PLASMID_CONSTANTS.LABEL_OFFSET;
    const labelX = isRightSide ? radialPoint.x + labelOffset : radialPoint.x - labelOffset;

    // Create path for the entire translation feature
    const path = createFeaturePath(
        feature.start,
        feature.end,
        radius,
        feature.complement
    );

    return (
        <g
            data-feature-id={feature.id}
            data-feature-type="translation"
            onClick={onClick}
            onMouseEnter={() => onHover(feature.label)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
        >
            <path
                d={path}
                fill={AMINO_ACID_COLORS['*']} // Default color for the whole translation
                opacity={isSelected ? 0.3 : 0.8}
            />
            <line
                x1={featureCoords.x}
                y1={featureCoords.y}
                x2={radialPoint.x}
                y2={radialPoint.y}
                stroke="#666"
                strokeWidth="1"
            />
            <text
                x={labelX}
                y={radialPoint.y}
                textAnchor={isRightSide ? "start" : "end"}
                dominantBaseline="middle"
                fontSize="12"
                fill="#333"
            >
                {feature.label}
            </text>
        </g>
    );
}; 