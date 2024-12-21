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

    createFeaturePath(startAngle: number, endAngle: number, radius: number, isComplement: boolean): string {
        // Normalize angles
        let actualStartAngle = startAngle;
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
        const startAngle = coordsToAngle(start, length);
        const endAngle = coordsToAngle(end, length);

        let angleDiff = endAngle - startAngle;
        if (angleDiff < 0) angleDiff += TWO_PI;

        const largeArc = angleDiff > Math.PI ? 1 : 0;
        const sweep = 1;

        const startPoint = angleToCoords(startAngle, radius);
        const endPoint = angleToCoords(endAngle, radius);

        return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endPoint.x} ${endPoint.y}`;
    }
} 