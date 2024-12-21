import { PLASMID_CONSTANTS, TWO_PI } from './constants';
const { CENTER, PATH_WIDTH, ARROW_HEAD_LENGTH, ARROW_HEAD_WIDTH } = PLASMID_CONSTANTS;

export interface Point {
    x: number;
    y: number;
}

export const coordsToAngle = (pos: number, plasmidLength: number): number => {
    return (pos / plasmidLength) * TWO_PI - Math.PI / 2;
};

export const angleToCoords = (angle: number, radius: number): Point => {
    return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle)
    };
};

export const normalizeAngle = (angle: number): number => {
    return (angle + TWO_PI) % TWO_PI;
};

export const createFeaturePath = (
    startAngle: number,
    endAngle: number,
    radius: number,
    isComplement: boolean
): string => {
    // Normalize angles
    let actualStartAngle = startAngle;
    let actualEndAngle = endAngle;
    if (actualEndAngle < actualStartAngle) {
        actualEndAngle += TWO_PI;
    }

    // Calculate path radii
    const outerRadius = radius + PATH_WIDTH / 2;
    const innerRadius = radius - PATH_WIDTH / 2;

    // Calculate main arc points
    const outerStart = angleToCoords(actualStartAngle, outerRadius);
    const outerEnd = angleToCoords(actualEndAngle, outerRadius);
    const innerStart = angleToCoords(actualStartAngle, innerRadius);
    const innerEnd = angleToCoords(actualEndAngle, innerRadius);

    const largeArc = (actualEndAngle - actualStartAngle) > Math.PI ? 1 : 0;

    // Simple path without arrow head
    return `M ${outerStart.x} ${outerStart.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
            Z`;
};

export const createArrowPath = (angle: number, radius: number): string => {
    // Example arrow shape: a small triangle
    const { ARROW_HEAD_LENGTH, ARROW_HEAD_WIDTH, CENTER } = PLASMID_CONSTANTS;

    // Tip of the arrow
    const arrowTip = angleToCoords(angle, radius + ARROW_HEAD_LENGTH);
    // Base center of the arrow
    const arrowBase = angleToCoords(angle, radius);
    // Perpendicular angle for left/right edges
    const perpAngle = angle + Math.PI / 2;

    const arrowLeft = {
        x: arrowBase.x + (ARROW_HEAD_WIDTH / 2) * Math.cos(perpAngle),
        y: arrowBase.y + (ARROW_HEAD_WIDTH / 2) * Math.sin(perpAngle),
    };
    const arrowRight = {
        x: arrowBase.x - (ARROW_HEAD_WIDTH / 2) * Math.cos(perpAngle),
        y: arrowBase.y - (ARROW_HEAD_WIDTH / 2) * Math.sin(perpAngle),
    };

    // Draw a triangle from left edge -> tip -> right edge -> back to left
    return `M ${arrowLeft.x} ${arrowLeft.y}
            L ${arrowTip.x} ${arrowTip.y}
            L ${arrowRight.x} ${arrowRight.y}
            Z`;
}; 