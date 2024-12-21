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
    const { feature, featureX, featureY, labelX, labelY, radius, plasmidLength } = labelPosition;

    const startAngle = (feature.start / plasmidLength) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (feature.end / plasmidLength) * 2 * Math.PI - Math.PI / 2;

    const isRightSide = labelX > 300;
    const labelOffset = 10;
    const adjustedLabelX = isRightSide ? labelX + labelOffset : labelX - labelOffset;

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
                    <line
                        x1={featureX}
                        y1={featureY}
                        x2={adjustedLabelX}
                        y2={labelY}
                        stroke="#999"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                    <text
                        x={adjustedLabelX}
                        y={labelY}
                        textAnchor={isRightSide ? "start" : "end"}
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