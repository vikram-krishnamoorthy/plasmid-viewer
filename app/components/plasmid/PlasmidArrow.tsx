import React from 'react';
import { createArrowPath } from './utils/geometry';

interface PlasmidArrowProps {
    angle: number;
    radius: number;
    color: string;
    _isComplement: boolean;
}

export const PlasmidArrow: React.FC<PlasmidArrowProps> = ({
    angle,
    radius,
    color,
    _isComplement = false
}) => {
    return (
        <path
            d={createArrowPath(angle, radius)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}; 