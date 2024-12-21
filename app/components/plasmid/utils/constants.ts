export const PLASMID_CONSTANTS = {
    CENTER: 300,
    BACKBONE_RADIUS: 200,
    FEATURE_BASE_RADIUS: 170,
    PATH_WIDTH: 6,
    ARROW_HEAD_LENGTH: 12,
    ARROW_HEAD_WIDTH: 8,
    LABEL_RADIUS: 250,
    LABEL_OFFSET: 10,
    MIN_LABEL_SPACING: 15,
    MARKER_COUNT: 12
} as const;

export const TWO_PI = 2 * Math.PI;

// Helper functions that depend on these constants
export const coordsToAngle = (pos: number, length: number): number => {
    return (pos / length) * TWO_PI - Math.PI / 2;
};

export const angleToCoords = (angle: number, radius: number): Point => {
    return {
        x: PLASMID_CONSTANTS.CENTER + radius * Math.cos(angle),
        y: PLASMID_CONSTANTS.CENTER + radius * Math.sin(angle)
    };
};

export interface Point {
    x: number;
    y: number;
} 