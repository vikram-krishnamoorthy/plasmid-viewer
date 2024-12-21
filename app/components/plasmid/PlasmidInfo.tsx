import React from 'react';

interface PlasmidInfoProps {
    name: string;
    length: number;
}

export const PlasmidInfo: React.FC<PlasmidInfoProps> = ({ name, length }) => {
    return (
        <>
            <text
                x="300"
                y="290"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#333"
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
            >
                {length ? `${length.toLocaleString()} bp` : ''}
            </text>
        </>
    );
}; 