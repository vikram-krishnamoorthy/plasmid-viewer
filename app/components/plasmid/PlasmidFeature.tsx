import React, { useState } from 'react';
import { LabelPosition } from './types';
import { coordsToAngle } from './utils/constants';
import { CircularGeometry } from './utils/geometry';
import { PLASMID_CONSTANTS } from './utils/constants';

interface PlasmidFeatureProps {
    labelPosition: LabelPosition;
    isSelected: boolean;
    onClick: () => void;
    showLabels: boolean;
}

// Create a singleton instance for generating paths
const geometry = new CircularGeometry(PLASMID_CONSTANTS);

export const PlasmidFeature: React.FC<PlasmidFeatureProps> = ({
    labelPosition,
    isSelected,
    onClick,
    showLabels
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const {
        feature,
        featureX,
        featureY,
        radialX,
        radialY,
        labelX,
        labelY,
        radius,
        plasmidLength
    } = labelPosition;

    const startAngle = coordsToAngle(feature.start, plasmidLength);
    const endAngle = coordsToAngle(feature.end, plasmidLength);

    const shouldShowLabel = showLabels || isHovered;

    return (
        <g
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
        >
            <path
                d={geometry.createFeaturePath(startAngle, endAngle, radius, feature.complement)}
                fill={feature.color}
                stroke="none"
                className="transition-opacity duration-200"
                opacity={!isSelected ? "1" : "0.3"}
            />

            {feature.label && shouldShowLabel && (
                <>
                    <path
                        d={`M ${featureX} ${featureY} L ${radialX} ${radialY} L ${labelX} ${labelY}`}
                        stroke="#999"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        fill="none"
                        className="transition-opacity duration-200"
                        opacity={showLabels ? "1" : "0.6"}
                    />
                    <text
                        x={labelX}
                        y={labelY}
                        textAnchor={labelPosition.textAnchor}
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#333"
                        style={{ pointerEvents: 'none' }}
                        className="transition-opacity duration-200"
                        opacity={showLabels ? "1" : "0.8"}
                    >
                        {feature.label}
                    </text>
                </>
            )}
        </g>
    );
}; 