import React from 'react';
import { LabelPosition } from './types';

interface PlasmidInfoProps {
    name: string;
    length: number;
    hoveredFeature: string | null;
    hoveredFeatureDetails?: LabelPosition;
}

export const PlasmidInfo: React.FC<PlasmidInfoProps> = ({ 
    name, 
    length, 
    hoveredFeature,
    hoveredFeatureDetails 
}) => {
    return (
        <g style={{ userSelect: 'none' }}>
            <text
                x="300"
                y="280"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#333"
                style={{ pointerEvents: 'none' }}
            >
                {name}
            </text>

            <text
                x="300"
                y="300"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#666"
                style={{ pointerEvents: 'none' }}
            >
                {length ? `${length.toLocaleString()} bp` : ''}
            </text>

            {hoveredFeature && hoveredFeatureDetails && (
                <>
                    <rect
                        x="225"
                        y="320"
                        width="150"
                        height="60"
                        fill="white"
                        stroke="#ddd"
                        strokeWidth="1"
                        rx="4"
                    />
                    
                    <text
                        x="300"
                        y="335"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#333"
                        style={{ pointerEvents: 'none' }}
                    >
                        {hoveredFeature}
                    </text>

                    <text
                        x="300"
                        y="350"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fill="#666"
                        style={{ pointerEvents: 'none' }}
                    >
                        {hoveredFeatureDetails.feature.type}
                    </text>

                    <text
                        x="300"
                        y="365"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fill="#666"
                        style={{ pointerEvents: 'none' }}
                    >
                        {`${hoveredFeatureDetails.feature.start + 1} - ${hoveredFeatureDetails.feature.end + 1}`}
                    </text>
                </>
            )}
        </g>
    );
}; 