import React from 'react';
import { LabelPosition } from './types';
import { Feature, SelectedRegion } from './types';

interface PlasmidInfoProps {
  name: string;
  length: number;
  hoveredFeature: string | null;
  hoveredFeatureDetails?: LabelPosition;
  selectedRegion: SelectedRegion | null;
  features: Feature[];
}

export const PlasmidInfo: React.FC<PlasmidInfoProps> = ({
  name,
  length,
  hoveredFeature,
  hoveredFeatureDetails,
  selectedRegion,
  features,
}) => {
  // Function to find a feature that matches the selection
  const findSelectedFeature = (): Feature | null => {
    if (!selectedRegion) return null;
    return (
      features.find((f) => f.start === selectedRegion.start && f.end === selectedRegion.end) || null
    );
  };

  const selectedFeature = findSelectedFeature();

  return (
    <g style={{ userSelect: 'none' }}>
      {/* Plasmid name */}
      <text
        x="300"
        y="280"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
        style={{ pointerEvents: 'none' }}
      >
        {name}
      </text>

      {/* Base pair count */}
      <text
        x="300"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#666"
        style={{ pointerEvents: 'none' }}
      >
        {length ? `${length.toLocaleString()} bp` : ''}
      </text>

      {/* Info box - show hover state if present, otherwise show selection if present */}
      {(hoveredFeature || selectedRegion) && (
        <>
          <rect
            x="225"
            y="320"
            width="150"
            height="60"
            fill="white"
            stroke="#ddd"
            strokeWidth="1"
            rx="4"
          />

          {hoveredFeature && hoveredFeatureDetails ? (
            // Hover state - show feature details
            <>
              <text
                x="300"
                y="335"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
                style={{ pointerEvents: 'none' }}
              >
                {hoveredFeature}
              </text>

              <text
                x="300"
                y="350"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill="#666"
                style={{ pointerEvents: 'none' }}
              >
                {hoveredFeatureDetails.feature.type}
              </text>

              <text
                x="300"
                y="365"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill="#666"
                style={{ pointerEvents: 'none' }}
              >
                {`${hoveredFeatureDetails.feature.start + 1} - ${hoveredFeatureDetails.feature.end}`}
              </text>
            </>
          ) : (
            selectedRegion && (
              // Selection state - show either feature details or selection range
              <>
                <text
                  x="300"
                  y="335"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#333"
                  style={{ pointerEvents: 'none' }}
                >
                  {selectedFeature ? selectedFeature.label : 'Highlighted Section'}
                </text>

                {selectedFeature ? (
                  <text
                    x="300"
                    y="350"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {selectedFeature.type}
                  </text>
                ) : null}

                <text
                  x="300"
                  y={selectedFeature ? 365 : 350}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="#666"
                  style={{ pointerEvents: 'none' }}
                >
                  {`${selectedRegion.start + 1} - ${selectedRegion.end}`}
                </text>

                {/* Add copy instruction only for non-feature selections */}
                {!selectedFeature && (
                  <text
                    x="300"
                    y="365"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {`(${navigator.platform.toLowerCase().includes('mac') ? 'cmd' : 'ctrl'} + c to copy)`}
                  </text>
                )}
              </>
            )
          )}
        </>
      )}
    </g>
  );
};
