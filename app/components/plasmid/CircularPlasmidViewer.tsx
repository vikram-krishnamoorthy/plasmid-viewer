import React, { useState } from 'react';
import { Feature, LabelPosition, SelectedRegion } from './types';
import { ColorManager } from './utils/featureColorManager';
import { CircularLabelPositioner } from './utils/labelPositioning';
import { PlasmidBackbone } from './PlasmidBackbone';
import { SelectionHighlight } from './SelectionHighlight';
import { PlasmidFeature } from './PlasmidFeature';
import { PlasmidInfo } from './PlasmidInfo';
import { CircularGeometry } from './utils/geometry';
import { PLASMID_CONSTANTS } from './utils/constants';

interface CircularPlasmidViewerProps {
    features: Feature[];
    plasmidName: string;
    plasmidLength: number;
    visibleFeatureTypes: Set<string>;
    selectedRegion: SelectedRegion | null;
    geometry: CircularGeometry;
    labelPositioner: CircularLabelPositioner;
    colorManager: ColorManager;
    onFeatureClick: (feature: Feature) => void;
    onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

export const CircularPlasmidViewer: React.FC<CircularPlasmidViewerProps> = ({
    features,
    plasmidName,
    plasmidLength,
    visibleFeatureTypes,
    selectedRegion,
    geometry,
    labelPositioner,
    colorManager,
    onFeatureClick,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
}) => {
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
    const [hoveredFeatureDetails, setHoveredFeatureDetails] = useState<LabelPosition | undefined>(undefined);

    const getSelectionPath = (): string => {
        if (!selectedRegion) return '';
        return geometry.createSelectionPath(
            selectedRegion.start,
            selectedRegion.end,
            PLASMID_CONSTANTS.BACKBONE_RADIUS,
            plasmidLength
        );
    };

    return (
        <div className="relative flex-1 bg-white">
            <svg
                viewBox="0 0 600 600"
                className="w-full h-full select-none"
                style={{ userSelect: 'none' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            >
                <PlasmidBackbone plasmidLength={plasmidLength} />

                {selectedRegion && (
                    <SelectionHighlight selectionPath={getSelectionPath()} />
                )}

                {labelPositioner.calculateLabelPositions(features, visibleFeatureTypes, plasmidLength)
                    .map((labelPosition) => (
                        <PlasmidFeature
                            key={labelPosition.feature.id}
                            labelPosition={labelPosition}
                            isSelected={selectedRegion?.start === labelPosition.feature.start &&
                                selectedRegion?.end === labelPosition.feature.end - 1}
                            onClick={() => onFeatureClick(labelPosition.feature)}
                            onHover={(label) => {
                                setHoveredFeature(label);
                                setHoveredFeatureDetails(label ? labelPosition : undefined);
                            }}
                        />
                    ))}

                <PlasmidInfo
                    name={plasmidName}
                    length={plasmidLength}
                    hoveredFeature={hoveredFeature}
                    hoveredFeatureDetails={hoveredFeatureDetails}
                    selectedRegion={selectedRegion}
                    features={features}
                />
            </svg>
        </div>
    );
}; 