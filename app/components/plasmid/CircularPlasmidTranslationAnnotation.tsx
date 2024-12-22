import React from 'react';
import { Feature } from '../types';
import { AMINO_ACID_COLORS } from '../utils/constants';
import { createFeaturePath } from '../utils/pathUtils';
import { coordsToAngle } from '../utils/constants';

// Bright, saturated versions of amino acid colors for circular view
const CIRCULAR_AMINO_ACID_COLORS: { [key: string]: string } = {
    'A': '#FF0000', // Alanine - bright red
    'R': '#00FF00', // Arginine - bright green
    'N': '#0000FF', // Asparagine - bright blue
    'D': '#FFFF00', // Aspartic acid - bright yellow
    'C': '#FF00FF', // Cysteine - bright magenta
    'E': '#00FFFF', // Glutamic acid - bright cyan
    'Q': '#FF8000', // Glutamine - bright orange
    'G': '#8000FF', // Glycine - bright purple
    'H': '#00FF80', // Histidine - bright mint
    'I': '#FF0080', // Isoleucine - bright pink
    'L': '#80FF00', // Leucine - bright lime
    'K': '#0080FF', // Lysine - bright sky blue
    'M': '#FF4040', // Methionine - bright light red
    'F': '#40FF40', // Phenylalanine - bright light green
    'P': '#4040FF', // Proline - bright light blue
    'S': '#FFFF40', // Serine - bright light yellow
    'T': '#FF40FF', // Threonine - bright light magenta
    'W': '#40FFFF', // Tryptophan - bright light cyan
    'Y': '#FFB040', // Tyrosine - bright light orange
    'V': '#B040FF', // Valine - bright light purple
    '*': '#808080', // Stop codon - gray
};

// ... rest of the component code ...
return (
    <path
        key={`${feature.id}-codon-${index}`}
        d={path}
        fill={CIRCULAR_AMINO_ACID_COLORS[aminoAcid] || '#808080'}
        opacity={isSelected ? 0.3 : 0.8}
    />
);
  </rewritten_file > 