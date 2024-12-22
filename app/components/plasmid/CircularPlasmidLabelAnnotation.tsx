import React from 'react';
import { Feature } from '../types';
import { createFeaturePath } from '../utils/pathUtils';
import { PLASMID_CONSTANTS } from '../utils/constants';

interface CircularPlasmidLabelAnnotationProps {
    feature: Feature;
    radius: number;
    isSelected: boolean;
    color: string;
    onClick: (e: React.MouseEvent) => void;
    onHover: (label: string | null) => void;
    plasmidLength: number;
}

export const CircularPlasmidLabelAnnotation: React.FC<CircularPlasmidLabelAnnotationProps> = ({
    feature,
    radius,
    isSelected,
    color,
    onClick,
    onHover,
    plasmidLength,
}) => {
    // Calculate arc path
    const startAngle = (feature.start / plasmidLength) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (feature.end / plasmidLength) * 2 * Math.PI - Math.PI / 2;
    
    // Calculate path points
    const pathWidth = 10; // Width of the feature arc
    const outerRadius = radius + pathWidth/2;
    const innerRadius = radius - pathWidth/2;

    // Create arc path
    const path = (() => {
        const actualStartAngle = startAngle;
        let actualEndAngle = endAngle;
        if (actualEndAngle < actualStartAngle) {
            actualEndAngle += 2 * Math.PI;
        }

        const largeArc = (actualEndAngle - actualStartAngle) > Math.PI ? 1 : 0;

        // Calculate points
        const startOuter = {
            x: PLASMID_CONSTANTS.CENTER + outerRadius * Math.cos(actualStartAngle),
            y: PLASMID_CONSTANTS.CENTER + outerRadius * Math.sin(actualStartAngle)
        };
        const endOuter = {
            x: PLASMID_CONSTANTS.CENTER + outerRadius * Math.cos(actualEndAngle),
            y: PLASMID_CONSTANTS.CENTER + outerRadius * Math.sin(actualEndAngle)
        };
        const startInner = {
            x: PLASMID_CONSTANTS.CENTER + innerRadius * Math.cos(actualStartAngle),
            y: PLASMID_CONSTANTS.CENTER + innerRadius * Math.sin(actualStartAngle)
        };
        const endInner = {
            x: PLASMID_CONSTANTS.CENTER + innerRadius * Math.cos(actualEndAngle),
            y: PLASMID_CONSTANTS.CENTER + innerRadius * Math.sin(actualEndAngle)
        };

        return `M ${startOuter.x} ${startOuter.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
                L ${endInner.x} ${endInner.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}
                Z`;
    })();

    return (
        <g
            data-feature-id={feature.id}
            data-feature-type={feature.type}
            onClick={onClick}
            onMouseEnter={() => onHover(feature.label)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
        >
            <path
                d={path}
                fill={color}
                opacity={isSelected ? 0.3 : 0.8}
                stroke={color}
                strokeWidth="1"
            />
        </g>
    );
}; 