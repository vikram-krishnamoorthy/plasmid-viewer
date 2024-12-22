import React from 'react';
import { Feature } from '../types';
import { AMINO_ACID_COLORS } from '../utils/constants';

interface LinearPlasmidTranslationAnnotationProps {
  feature: Feature;
  y: number;
  lineStart: number;
  lineEnd: number;
  charWidth: number;
  height: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const LinearPlasmidTranslationAnnotation: React.FC<
  LinearPlasmidTranslationAnnotationProps
> = ({ feature, y, lineStart, lineEnd, charWidth, height, isSelected, onClick }) => {
  if (!feature.translation) return null;

  // Calculate the visible portion of the feature for this line
  const featureStart = Math.max(lineStart, feature.start);
  const featureEnd = Math.min(lineEnd, feature.end);

  if (featureStart >= featureEnd) return null;

  // Calculate the offset to ensure codons align properly
  const relativeStart = featureStart - feature.start;
  const codonOffset = relativeStart % 3;

  // Adjust featureStart to align with codon boundaries
  const alignedStart = featureStart - codonOffset;

  // For each base position in the visible region, determine which codon it belongs to
  const visibleBases = Array.from({ length: featureEnd - alignedStart }, (_, i) => {
    const absolutePos = alignedStart + i;
    const relativePos = absolutePos - feature.start;
    return {
      position: absolutePos,
      codonIndex: Math.floor(relativePos / 3),
      posInCodon: relativePos % 3,
    };
  });

  // Group bases by codon
  const codonGroups = visibleBases.reduce(
    (groups, base) => {
      // Only include bases that are actually within our feature and line
      if (base.position >= featureStart && base.position < featureEnd) {
        if (!groups[base.codonIndex]) {
          groups[base.codonIndex] = [];
        }
        groups[base.codonIndex].push(base);
      }
      return groups;
    },
    {} as Record<number, typeof visibleBases>
  );

  return (
    <g
      data-feature-id={feature.id}
      data-feature-type="translation"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {Object.entries(codonGroups).map(([codonIndex, bases]) => {
        const aminoAcid = feature.translation?.[parseInt(codonIndex)];
        if (!aminoAcid) return null;

        const x = (bases[0].position - lineStart) * charWidth;
        const width = bases.length * charWidth;
        const showLabel = bases.length >= 2;

        return (
          <g key={`${feature.id}-codon-${codonIndex}`} data-feature-type="translation">
            <rect
              x={x}
              y={y}
              width={width}
              height={height - 2}
              fill={AMINO_ACID_COLORS[aminoAcid] || '#E6E6E6'}
              opacity={isSelected ? 0.3 : 0.8}
            />
            {showLabel && (
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#000"
                style={{ pointerEvents: 'none' }}
              >
                {aminoAcid}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
