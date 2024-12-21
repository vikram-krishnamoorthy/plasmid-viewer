import React from 'react';

interface PlasmidInfoProps {
    name: string;
    length: number;
}

export const PlasmidInfo: React.FC<PlasmidInfoProps> = ({ name, length }) => {
    return (
        <g style={{ userSelect: 'none' }}>
            <text
                x="300"
                y="290"
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
                y="310"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#666"
                style={{ pointerEvents: 'none' }}
            >
                {length ? `${length.toLocaleString()} bp` : ''}
            </text>
        </g>
    );
}; 