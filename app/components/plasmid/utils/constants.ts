export const TWO_PI = 2 * Math.PI;

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

// Helper functions that depend on these constants
export const coordsToAngle = (pos: number, length: number): number => {
    return (pos / length) * TWO_PI - Math.PI / 2;
};

export interface Point {
    x: number;
    y: number;
}

export const angleToCoords = (angle: number, radius: number): Point => {
    return {
        x: PLASMID_CONSTANTS.CENTER + radius * Math.cos(angle),
        y: PLASMID_CONSTANTS.CENTER + radius * Math.sin(angle)
    };
};

// Update the amino acid color mapping with more muted/pastel colors
export const AMINO_ACID_COLORS: { [key: string]: string } = {
    'A': '#E6D3D3', // Alanine - muted red
    'R': '#D3E6D3', // Arginine - muted green
    'N': '#D3D3E6', // Asparagine - muted blue
    'D': '#E6E6D3', // Aspartic acid - muted yellow
    'C': '#E6D3E6', // Cysteine - muted magenta
    'E': '#D3E6E6', // Glutamic acid - muted cyan
    'Q': '#E6DCD3', // Glutamine - muted orange
    'G': '#DCD3E6', // Glycine - muted purple
    'H': '#D3E6DC', // Histidine - muted mint
    'I': '#E6D3DC', // Isoleucine - muted pink
    'L': '#DCE6D3', // Leucine - muted lime
    'K': '#D3DCE6', // Lysine - muted sky blue
    'M': '#E6D9D9', // Methionine - muted light red
    'F': '#D9E6D9', // Phenylalanine - muted light green
    'P': '#D9D9E6', // Proline - muted light blue
    'S': '#E6E6D9', // Serine - muted light yellow
    'T': '#E6D9E6', // Threonine - muted light magenta
    'W': '#D9E6E6', // Tryptophan - muted light cyan
    'Y': '#E6E0D9', // Tyrosine - muted light orange
    'V': '#E0D9E6', // Valine - muted light purple
    '*': '#E6E6E6', // Stop codon - light gray
}; 