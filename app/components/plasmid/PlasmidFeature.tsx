import React from 'react';
import { Feature, LabelPosition } from './types';
import { createFeaturePath } from './utils/geometry';

interface PlasmidFeatureProps {
    labelPosition: LabelPosition;
    isSelected: boolean;
    onClick: () => void;
}

export const PlasmidFeature: React.FC<PlasmidFeatureProps> = ({
    labelPosition,
    isSelected,
    onClick
}) => {
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

    const startAngle = (feature.start / plasmidLength) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (feature.end / plasmidLength) * 2 * Math.PI - Math.PI / 2;

    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            <path
                d={createFeaturePath(startAngle, endAngle, radius, feature.complement)}
                fill={feature.color}
                stroke="none"
                className="transition-opacity duration-200"
                opacity={!isSelected ? "1" : "0.3"}
            />

            {feature.label && (
                <>
                    <path
                        d={`M ${featureX} ${featureY} L ${radialX} ${radialY} L ${labelX} ${labelY}`}
                        stroke="#999"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        fill="none"
                    />
                    <text
                        x={labelX}
                        y={labelY}
                        textAnchor={labelPosition.textAnchor}
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#333"
                    >
                        {feature.label}
                    </text>
                </>
            )}
        </g>
    );
}; 