import React, { useState } from 'react';
import { Feature, LabelPosition, SelectedRegion } from './types';
import { ColorManager } from './utils/featureColorManager';
import { PlasmidBackbone } from './PlasmidBackbone';
import { SelectionHighlight } from './SelectionHighlight';
import { PlasmidInfo } from './PlasmidInfo';
import { CircularGeometry } from './utils/geometry';
import { PLASMID_CONSTANTS } from './utils/constants';
import { CircularPlasmidLabelAnnotation, CircularPlasmidTranslationAnnotation } from './CircularPlasmidAnnotations';
import { assignCircularTracks, calculateFeatureRadius } from './CircularPlasmidAnnotations/utils';

interface CircularPlasmidViewerProps {
    features: Feature[];
    plasmidName: string;
    plasmidLength: number;
    visibleFeatureTypes: Set<string>;
    selectedRegion: SelectedRegion | null;
    geometry: CircularGeometry;
    colorManager: ColorManager;
    onFeatureClick: (feature: Feature) => void;
    onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

const MAX_FEATURE_TRACKS = 3;

export const CircularPlasmidViewer: React.FC<CircularPlasmidViewerProps> = ({
    features,
    plasmidName,
    plasmidLength,
    visibleFeatureTypes,
    selectedRegion,
    geometry,
    colorManager,
    onFeatureClick,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
}) => {
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
    const [hoveredFeatureDetails, setHoveredFeatureDetails] = useState<LabelPosition | undefined>(undefined);

    // Include all visible features - DON'T filter out translations!
    const visibleFeatures = features.filter(f => visibleFeatureTypes.has(f.type));
    const trackAssignments = assignCircularTracks(
        visibleFeatures,
        visibleFeatureTypes,
        plasmidLength,
        MAX_FEATURE_TRACKS
    );

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

                {visibleFeatures.map(feature => {
                    const track = trackAssignments.get(feature.id) ?? 0;
                    const radius = calculateFeatureRadius(track, MAX_FEATURE_TRACKS);
                    const isSelected = selectedRegion?.start === feature.start && 
                                     selectedRegion?.end === feature.end;

                    if (feature.type === 'translation' && feature.translation) {
                        return (
                            <CircularPlasmidTranslationAnnotation
                                key={feature.id}
                                feature={feature}
                                radius={radius}
                                isSelected={isSelected}
                                onClick={(_e) => onFeatureClick(feature)}
                                onHover={(label) => {
                                    setHoveredFeature(label);
                                    setHoveredFeatureDetails({
                                        feature,
                                        midAngle: 0,
                                        featureX: 0,
                                        featureY: 0,
                                        radialX: 0,
                                        radialY: 0,
                                        labelX: 0,
                                        labelY: 0,
                                        rotation: 0,
                                        textAnchor: "start",
                                        radius,
                                        plasmidLength
                                    });
                                }}
                                plasmidLength={plasmidLength}
                            />
                        );
                    }

                    return (
                        <CircularPlasmidLabelAnnotation
                            key={feature.id}
                            feature={feature}
                            radius={radius}
                            isSelected={isSelected}
                            color={colorManager.getFeatureColor(feature.type)}
                            onClick={(_e) => onFeatureClick(feature)}
                            onHover={(label) => {
                                setHoveredFeature(label);
                                setHoveredFeatureDetails({
                                    feature,
                                    midAngle: 0,
                                    featureX: 0,
                                    featureY: 0,
                                    radialX: 0,
                                    radialY: 0,
                                    labelX: 0,
                                    labelY: 0,
                                    rotation: 0,
                                    textAnchor: "start",
                                    radius,
                                    plasmidLength
                                });
                            }}
                            plasmidLength={plasmidLength}
                        />
                    );
                })}

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