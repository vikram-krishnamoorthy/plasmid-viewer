import React, { useState } from 'react';
import { LabelPosition } from './types';
import { coordsToAngle } from './utils/constants';
import { CircularGeometry } from './utils/geometry';
import { PLASMID_CONSTANTS } from './utils/constants';

interface PlasmidFeatureProps {
    labelPosition: LabelPosition;
    isSelected: boolean;
    onClick: () => void;
    onHover: (label: string | null) => void;
}

// Create a singleton instance for generating paths
const geometry = new CircularGeometry(PLASMID_CONSTANTS);

export const PlasmidFeature: React.FC<PlasmidFeatureProps> = ({
    labelPosition,
    isSelected,
    onClick,
    onHover
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

    return (
        <g
            onClick={onClick}
            onMouseEnter={() => onHover(feature.label)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
        >
            <path
                d={geometry.createFeaturePath(startAngle, endAngle, radius, feature.complement)}
                fill={feature.color}
                stroke="none"
                className="transition-opacity duration-200"
                opacity={!isSelected ? "1" : "0.3"}
            />

            {feature.label && isHovered && (
                <>
                    <path
                        d={`M ${featureX} ${featureY} L ${radialX} ${radialY} L ${labelX} ${labelY}`}
                        stroke="#999"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        fill="none"
                        className="transition-opacity duration-200"
                        opacity="1"
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
                        opacity="1"
                    >
                        {feature.label}
                    </text>
                </>
            )}
        </g>
    );
}; 