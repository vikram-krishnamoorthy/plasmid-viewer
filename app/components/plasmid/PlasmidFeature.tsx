import React from 'react';
import { Feature, LabelPosition } from './types';

interface PlasmidFeatureProps {
    labelPosition: LabelPosition;
    path: string;
    arrow: string;
    isSelected: boolean;
    onClick: () => void;
}

export const PlasmidFeature: React.FC<PlasmidFeatureProps> = ({
    labelPosition,
    path,
    arrow,
    isSelected,
    onClick
}) => {
    const { feature, featureX, featureY, labelX, labelY, rotation, textAnchor } = labelPosition;
    
    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            <path
                d={path}
                fill="none"
                stroke={feature.color}
                strokeWidth="6"
                strokeLinecap="round"
                className="transition-opacity duration-200"
                opacity={!isSelected ? "1" : "0.3"}
            />

            <path
                d={arrow}
                fill="none"
                stroke={feature.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {feature.label && (
                <>
                    <line
                        x1={featureX}
                        y1={featureY}
                        x2={labelX}
                        y2={labelY}
                        stroke="#999"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />

                    <text
                        x={labelX}
                        y={labelY}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                        transform={`rotate(${rotation}, ${labelX}, ${labelY})`}
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