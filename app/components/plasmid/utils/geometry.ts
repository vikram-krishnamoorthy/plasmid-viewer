import {
    PLASMID_CONSTANTS,
    TWO_PI,
    coordsToAngle,
    angleToCoords,
    type Point
} from './constants';

export interface ViewerGeometry {
    coordsToPosition: (pos: number, length: number) => Point;
    positionToCoords: (position: Point, length: number) => number;
    createFeaturePath: (startAngle: number, endAngle: number, radius: number, isComplement: boolean) => string;
    createSelectionPath: (start: number, end: number, radius: number, length: number) => string;
}

export class CircularGeometry implements ViewerGeometry {
    constructor(private readonly constants: typeof PLASMID_CONSTANTS) { }

    coordsToPosition(pos: number, length: number): Point {
        const angle = coordsToAngle(pos, length);
        return angleToCoords(angle, this.constants.BACKBONE_RADIUS);
    }

    positionToCoords(position: Point, length: number): number {
        const dx = position.x - this.constants.CENTER;
        const dy = position.y - this.constants.CENTER;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const normalizedAngle = (angle + TWO_PI) % TWO_PI;
        const pos = Math.round(normalizedAngle * length / TWO_PI);
        return pos === length ? 0 : pos;
    }

    createFeaturePath(startAngle: number, endAngle: number, radius: number, _isComplement: boolean): string {
        // Normalize angles
        const actualStartAngle = startAngle;
        let actualEndAngle = endAngle;
        if (actualEndAngle < actualStartAngle) {
            actualEndAngle += TWO_PI;
        }

        // Calculate path radii
        const outerRadius = radius + PLASMID_CONSTANTS.PATH_WIDTH / 2;
        const innerRadius = radius - PLASMID_CONSTANTS.PATH_WIDTH / 2;

        // Calculate main arc points
        const outerStart = angleToCoords(actualStartAngle, outerRadius);
        const outerEnd = angleToCoords(actualEndAngle, outerRadius);
        const innerStart = angleToCoords(actualStartAngle, innerRadius);
        const innerEnd = angleToCoords(actualEndAngle, innerRadius);

        const largeArc = (actualEndAngle - actualStartAngle) > Math.PI ? 1 : 0;

        return `M ${outerStart.x} ${outerStart.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
                L ${innerEnd.x} ${innerEnd.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
                Z`;
    }

    createSelectionPath(start: number, end: number, radius: number, length: number): string {
        // Convert positions to angles (in radians)
        const startAngle = coordsToAngle(start, length);
        let endAngle = coordsToAngle(end, length);

        // If selection crosses origin counterclockwise
        if (end < start) {
            endAngle += TWO_PI;
        }

        const startPoint = angleToCoords(startAngle, radius);
        const endPoint = angleToCoords(endAngle % TWO_PI, radius);

        // Calculate the actual angle difference
        const angleDiff = endAngle - startAngle;
        const largeArc = Math.abs(angleDiff) > Math.PI ? 1 : 0;
        
        // For SVG arc, we need:
        // 1. Both radii (rx and ry) equal for a perfect circle
        // 2. No rotation (0 after the radii)
        // 3. Proper large-arc and sweep flags
        return `M ${startPoint.x} ${startPoint.y} 
                A ${radius} ${radius} 
                0 
                ${largeArc} 
                1 
                ${endPoint.x} ${endPoint.y}`;
    }
}

export const createArrowPath = (angle: number, radius: number): string => {
    const arrowLength = PLASMID_CONSTANTS.ARROW_HEAD_LENGTH;
    const arrowWidth = PLASMID_CONSTANTS.ARROW_HEAD_WIDTH;
    
    const point = angleToCoords(angle, radius);
    const tipPoint = angleToCoords(angle, radius + arrowLength);
    
    const leftPoint = {
        x: tipPoint.x - Math.sin(angle) * arrowWidth,
        y: tipPoint.y + Math.cos(angle) * arrowWidth
    };
    
    const rightPoint = {
        x: tipPoint.x + Math.sin(angle) * arrowWidth,
        y: tipPoint.y - Math.cos(angle) * arrowWidth
    };
    
    return `M ${point.x} ${point.y} L ${tipPoint.x} ${tipPoint.y} L ${leftPoint.x} ${leftPoint.y} M ${tipPoint.x} ${tipPoint.y} L ${rightPoint.x} ${rightPoint.y}`;
}; 