import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Feature, SelectedRegion } from './types';
import { ColorManager } from './utils/featureColorManager';
import { AMINO_ACID_COLORS } from './utils/constants';

interface LinearPlasmidViewerProps {
    features: Feature[];
    plasmidLength: number;
    visibleFeatureTypes: Set<string>;
    selectedRegion: SelectedRegion | null;
    colorManager: ColorManager;
    onFeatureClick: (feature: Feature) => void;
    sequence: string;
    onMouseDown: (position: number, isTranslationLabel?: boolean) => void;
    onMouseMove: (position: number) => void;
    onMouseUp: () => void;
}

export interface LinearPlasmidViewerRef {
    scrollToPosition: (position: number) => void;
}

export const LinearPlasmidViewer = forwardRef<LinearPlasmidViewerRef, LinearPlasmidViewerProps>(({
    features,
    plasmidLength,
    visibleFeatureTypes,
    selectedRegion,
    colorManager,
    onFeatureClick,
    sequence,
    onMouseDown,
    onMouseMove,
    onMouseUp,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [basesPerLine, setBasesPerLine] = useState(100);

    // Constants for layout
    const CHAR_WIDTH = 8;
    const MARGIN_LEFT = 50;
    const MARGIN_RIGHT = 20;
    const MARGIN_TOP = 20;

    const FEATURE_TRACK_HEIGHT = 16;
    const MAX_FEATURE_TRACKS = 3;
    const SEQUENCE_HEIGHT = 12;
    const BACKBONE_HEIGHT = 2;
    const POSITION_HEIGHT = 12;
    const FEATURE_SECTION_GAP = 8;
    const LINE_SPACING = 40;
    const AMINO_ACID_HEIGHT = 16; // Height of amino acid background
    const AMINO_ACID_GAP = 4; // Gap between amino acids and features
    const TOTAL_LINE_HEIGHT = FEATURE_TRACK_HEIGHT * MAX_FEATURE_TRACKS +
        SEQUENCE_HEIGHT +
        POSITION_HEIGHT +
        FEATURE_SECTION_GAP +
        LINE_SPACING +
        AMINO_ACID_HEIGHT +
        AMINO_ACID_GAP;

    // Calculate totalLines
    const totalLines = Math.ceil(plasmidLength / basesPerLine);

    useEffect(() => {
        const updateBasesPerLine = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const newBasesPerLine = Math.floor((width - MARGIN_LEFT - MARGIN_RIGHT) / CHAR_WIDTH);
            setBasesPerLine(Math.max(50, newBasesPerLine));
        };

        updateBasesPerLine();
        window.addEventListener('resize', updateBasesPerLine);
        return () => window.removeEventListener('resize', updateBasesPerLine);
    }, []);

    useImperativeHandle(ref, () => ({
        scrollToPosition: (position: number) => {
            if (!containerRef.current) return;

            // Calculate which line contains this position
            const lineNumber = Math.floor(position / basesPerLine);
            const scrollPosition = lineNumber * TOTAL_LINE_HEIGHT;

            // Get the container's viewport height
            const viewportHeight = containerRef.current.clientHeight;
            // Get the total scrollable height
            const totalHeight = totalLines * TOTAL_LINE_HEIGHT;

            // Calculate maximum scroll position
            const maxScroll = totalHeight - viewportHeight;

            // Ensure we don't scroll past the end
            containerRef.current.scrollTop = Math.min(scrollPosition, maxScroll);
        }
    }), [basesPerLine, totalLines, TOTAL_LINE_HEIGHT]);

    // Calculate other dimensions based on basesPerLine
    const LINE_WIDTH = basesPerLine * CHAR_WIDTH;
    const TOTAL_WIDTH = LINE_WIDTH + MARGIN_LEFT + MARGIN_RIGHT;

    const visibleFeatures = features.filter(f => visibleFeatureTypes.has(f.type));

    // Add label width calculation
    const getLabelWidth = (feature: Feature): number => {
        const label = feature.label || '';
        // Approximate width based on character count (adjust CHAR_WIDTH as needed)
        return label.length * CHAR_WIDTH;
    };

    // Update overlap detection to include labels
    const doFeaturesOverlap = (f1: Feature, f2: Feature, lineStart: number, lineEnd: number): boolean => {
        // Get the visible portions of each feature in this line
        const f1VisibleStart = Math.max(lineStart, f1.start);
        const f1VisibleEnd = Math.min(lineEnd, f1.end < f1.start ? f1.end + plasmidLength : f1.end);
        const f2VisibleStart = Math.max(lineStart, f2.start);
        const f2VisibleEnd = Math.min(lineEnd, f2.end < f2.start ? f2.end + plasmidLength : f2.end);

        // Check if the visible portions overlap
        return f1VisibleStart < f2VisibleEnd && f2VisibleStart < f1VisibleEnd;
    };

    // Assign tracks to features within a line segment
    const assignTracks = (lineFeatures: Feature[]): Map<string, number> => {
        const trackAssignments = new Map<string, number>();

        // Helper to determine if two features overlap
        const doFeaturesOverlap = (f1: Feature, f2: Feature): boolean => {
            const f1End = f1.end < f1.start ? f1.end + plasmidLength : f1.end;
            const f2End = f2.end < f2.start ? f2.end + plasmidLength : f2.end;
            return f1.start <= f2End && f2.start <= f1End;
        };

        // Helper to get feature size
        const getSize = (f: Feature): number => {
            return f.end < f.start ? (plasmidLength - f.start) + f.end : f.end - f.start;
        };

        // Helper to determine which feature has priority to stay in current track
        const hasTrackPriority = (f1: Feature, f2: Feature): boolean => {
            const size1 = getSize(f1);
            const size2 = getSize(f2);
            
            // If sizes are different, larger size wins
            if (size1 !== size2) {
                return size1 > size2;
            }
            
            // If sizes are equal, translations win
            if (size1 === size2) {
                if (f1.type === 'translation' && f2.type !== 'translation') return true;
                if (f1.type !== 'translation' && f2.type === 'translation') return false;
            }
            
            // If everything is equal, maintain stable ordering using IDs
            return f1.id < f2.id;
        };

        // Start all features at track 0
        lineFeatures.forEach(feature => {
            if (visibleFeatureTypes.has(feature.type)) {
                trackAssignments.set(feature.id, 0);
            }
        });

        let hasOverlaps = true;
        let currentTrack = 0;

        while (hasOverlaps && currentTrack < MAX_FEATURE_TRACKS) {
            hasOverlaps = false;
            
            // Get all features in current track
            const featuresInTrack = lineFeatures.filter(f => 
                trackAssignments.get(f.id) === currentTrack
            );

            // Check each pair of features in this track for overlaps
            for (let i = 0; i < featuresInTrack.length; i++) {
                for (let j = i + 1; j < featuresInTrack.length; j++) {
                    const f1 = featuresInTrack[i];
                    const f2 = featuresInTrack[j];

                    if (doFeaturesOverlap(f1, f2)) {
                        hasOverlaps = true;
                        // Move the lower priority feature up one track
                        const featureToMove = hasTrackPriority(f1, f2) ? f2 : f1;
                        trackAssignments.set(featureToMove.id, currentTrack + 1);
                    }
                }
            }

            currentTrack++;
        }

        return trackAssignments;
    };

    // Convert SVG coordinates to sequence position
    const coordsToSequencePos = (mouseX: number, mouseY: number): number | null => {
        const lineIndex = Math.floor((mouseY - MARGIN_TOP) / TOTAL_LINE_HEIGHT);
        const xOffset = mouseX - MARGIN_LEFT;

        // Check if click is within valid sequence area
        if (lineIndex < 0 || lineIndex >= totalLines || xOffset < 0 || xOffset > LINE_WIDTH) {
            return null;
        }

        const baseIndex = Math.floor(xOffset / CHAR_WIDTH);
        const pos = lineIndex * basesPerLine + baseIndex;
        return Math.min(Math.max(0, pos), plasmidLength - 1);
    };

    // Get mouse coordinates in SVG space
    const getMouseCoords = (e: React.MouseEvent<SVGElement>): { x: number, y: number } => {
        const svgElement = e.currentTarget as SVGSVGElement;
        const rect = svgElement.getBoundingClientRect();
        const bbox = svgElement.getBBox();
        const scale = {
            x: bbox.width / rect.width,
            y: bbox.height / rect.height
        };

        return {
            x: (e.clientX - rect.left) * scale.x,
            y: (e.clientY - rect.top) * scale.y
        };
    };

    // Add state to track mouse movement
    const [isDragging, setIsDragging] = useState(false);
    const [mouseDownTime, setMouseDownTime] = useState<number>(0);
    const [mouseDownPos, setMouseDownPos] = useState<number | null>(null);

    // Handle mouse events with proper coordinate conversion
    const handleMouseDown = (e: React.MouseEvent<SVGElement>) => {
        const coords = getMouseCoords(e);
        const pos = coordsToSequencePos(coords.x, coords.y);

        if (pos !== null) {
            // Walk up the DOM tree to find the nearest feature group
            let target = e.target as Element;
            let featureGroup = null;
            while (target && target !== e.currentTarget) {
                if (target.getAttribute('data-feature-type') === 'translation') {
                    featureGroup = target;
                    break;
                }
                target = target.parentElement!;
            }

            const isTranslationLabel = featureGroup !== null;

            setMouseDownPos(pos);
            setMouseDownTime(Date.now());
            setIsDragging(false);
            onMouseDown(pos, isTranslationLabel);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const coords = getMouseCoords(e);
        const pos = coordsToSequencePos(coords.x, coords.y);

        if (pos !== null && mouseDownPos !== null) {
            setIsDragging(true);
            onMouseMove(pos);
        }
    };

    const handleFeatureClick = (feature: Feature, e: React.MouseEvent) => {
        // Only handle as feature click if it was a quick click without drag
        if (!isDragging && Date.now() - mouseDownTime < 200) {
            e.stopPropagation();
            onFeatureClick(feature);
        }
    };

    // Helper function to handle circular selection ranges
    const isBaseSelected = (position: number, start: number, end: number): boolean => {
        if (start <= end) {
            return position >= start && position <= end;
        } else {
            // Selection crosses origin
            return position >= start || position <= end;
        }
    };

    // Add these constants near the top of the file
    const LABEL_SPACING = 15; // Minimum vertical spacing between labels
    const LABEL_OFFSET = 5;  // Vertical offset from feature
    const LINE_HEIGHT = 100; // Total height of each line
    const SEQUENCE_Y = 80;   // Y position of the sequence line
    const HIGHLIGHT_PADDING = 10; // Padding above and below the sequence line

    // Modify these constants for better highlight padding
    const SELECTION_PADDING_TOP = 10; // Padding above the topmost feature
    const SELECTION_PADDING_BOTTOM = 10; // Padding below the sequence line

    // Render a single line of the sequence viewer
    const renderLine = (lineIndex: number) => {
        const lineStart = lineIndex * basesPerLine;
        const lineEnd = Math.min(lineStart + basesPerLine, plasmidLength);
        const lineSequence = sequence.slice(lineStart, lineEnd);
        const y = lineIndex * TOTAL_LINE_HEIGHT + MARGIN_TOP;

        // Adjust vertical spacing
        const featuresY = MARGIN_TOP; // Features start at the top
        const sequenceY = featuresY + (FEATURE_TRACK_HEIGHT * MAX_FEATURE_TRACKS) + FEATURE_SECTION_GAP;
        const backboneY = sequenceY + SEQUENCE_HEIGHT / 2;
        const positionY = backboneY;

        // Find features that overlap with this line
        const lineFeatures = visibleFeatures.filter(feature => {
            const featureEnd = feature.end < feature.start ? feature.end + plasmidLength : feature.end;
            return feature.start <= lineEnd && featureEnd >= lineStart;
        });

        const trackAssignments = assignTracks(lineFeatures);

        // Calculate selection highlight positions
        const selectionHighlights = [];
        if (selectedRegion) {
            for (let pos = lineStart; pos < lineEnd; pos++) {
                if (isBaseSelected(pos, selectedRegion.start, selectedRegion.end)) {
                    const x = (pos - lineStart) * CHAR_WIDTH;
                    selectionHighlights.push(
                        <rect
                            key={`selection-${pos}`}
                            className="selection-highlight"
                            x={x}
                            y={-SELECTION_PADDING_TOP}
                            width={CHAR_WIDTH}
                            height={backboneY + BACKBONE_HEIGHT + SELECTION_PADDING_BOTTOM + SELECTION_PADDING_TOP}
                            fill="#FFD700"
                            opacity="0.3"
                            pointerEvents="none"
                        />
                    );
                }
            }
        }

        return (
            <g key={lineIndex} transform={`translate(${MARGIN_LEFT}, ${y})`} style={{ userSelect: 'none' }}>
                {/* Render selection highlights first (below everything else) */}
                {selectionHighlights}

                {/* Background for sequence */}
                <rect
                    x={0}
                    y={sequenceY - SEQUENCE_HEIGHT / 2}
                    width={LINE_WIDTH}
                    height={SEQUENCE_HEIGHT}
                    fill="#fff"
                />

                {/* Features (including translations) */}
                {lineFeatures.map(feature => {
                    if (!visibleFeatureTypes.has(feature.type)) return null;

                    const track = trackAssignments.get(feature.id) ?? 0;
                    const invertedTrack = MAX_FEATURE_TRACKS - 1 - track;
                    const featureY = invertedTrack * (FEATURE_TRACK_HEIGHT + 2);

                    if (feature.type === 'translation' && feature.translation) {
                        return renderAminoAcidSequence(feature, featureY, lineStart, lineEnd, trackAssignments);
                    } else {
                        return renderRegularFeature(feature, featureY, lineStart, lineEnd, trackAssignments);
                    }
                })}

                {/* Backbone line */}
                <line
                    x1={0}
                    y1={backboneY}
                    x2={LINE_WIDTH}
                    y2={backboneY}
                    stroke="#000"
                    strokeWidth={BACKBONE_HEIGHT}
                    pointerEvents="none"
                />

                {/* Sequence */}
                <g transform={`translate(0, ${sequenceY})`} pointerEvents="none">
                    {lineSequence.split('').map((base, i) => {
                        const position = lineStart + i;
                        const isSelected = selectedRegion &&
                            isBaseSelected(position, selectedRegion.start, selectedRegion.end);

                        return (
                            <g key={i}>
                                {/* Background highlight for the letter */}
                                {isSelected && (
                                    <rect
                                        x={i * CHAR_WIDTH}
                                        y={-SEQUENCE_HEIGHT / 2}
                                        width={CHAR_WIDTH}
                                        height={SEQUENCE_HEIGHT}
                                        fill="#FFD700"
                                        opacity="0.3"
                                    />
                                )}
                                <text
                                    x={i * CHAR_WIDTH + CHAR_WIDTH / 2}
                                    y={0}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fill={isSelected ? '#000' : '#666'}
                                    fontWeight={isSelected ? 'bold' : 'normal'}
                                >
                                    {base}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* Position markers */}
                <g transform={`translate(0, ${positionY})`} pointerEvents="none">
                    <text
                        x="-5"
                        y={0}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#666"
                    >
                        {(lineStart + 1).toLocaleString()}
                    </text>
                </g>
            </g>
        );
    };

    // Helper function to render amino acid sequence
    const renderAminoAcidSequence = (
        feature: Feature, 
        y: number, 
        lineStart: number, 
        lineEnd: number,
        trackAssignments: Map<string, number>
    ) => {
        if (!feature.translation) return null;

        // Calculate the visible portion of the feature for this line
        const featureStart = Math.max(lineStart, feature.start);
        const featureEnd = Math.min(lineEnd, feature.end);

        if (featureStart >= featureEnd) return null;

        const isSelected = selectedRegion?.start === feature.start &&
            selectedRegion?.end === feature.end;

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
                posInCodon: relativePos % 3
            };
        });

        // Group bases by codon
        const codonGroups = visibleBases.reduce((groups, base) => {
            // Only include bases that are actually within our feature and line
            if (base.position >= featureStart && base.position < featureEnd) {
                if (!groups[base.codonIndex]) {
                    groups[base.codonIndex] = [];
                }
                groups[base.codonIndex].push(base);
            }
            return groups;
        }, {} as Record<number, typeof visibleBases>);

        return (
            <g
                key={`aa-${feature.id}`}
                data-feature-id={feature.id}
                data-feature-type="translation"
                onClick={(e) => handleFeatureClick(feature, e)}
                style={{ cursor: 'pointer' }}
            >
                {Object.entries(codonGroups).map(([codonIndex, bases]) => {
                    const aminoAcid = feature.translation?.[parseInt(codonIndex)];
                    if (!aminoAcid) return null;

                    const x = (bases[0].position - lineStart) * CHAR_WIDTH;
                    const width = bases.length * CHAR_WIDTH;
                    const showLabel = bases.length >= 2;

                    return (
                        <g
                            key={`${feature.id}-codon-${codonIndex}`}
                            data-feature-type="translation"
                        >
                            <rect
                                x={x}
                                y={y}
                                width={width}
                                height={FEATURE_TRACK_HEIGHT - 2}
                                fill={AMINO_ACID_COLORS[aminoAcid] || '#E6E6E6'}
                                opacity={isSelected ? 0.3 : 0.8}
                            />
                            {showLabel && (
                                <text
                                    x={x + (width / 2)}
                                    y={y + FEATURE_TRACK_HEIGHT / 2}
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

    // Helper function to render regular feature
    const renderRegularFeature = (
        feature: Feature, 
        y: number, 
        lineStart: number, 
        lineEnd: number,
        trackAssignments: Map<string, number>
    ) => {
        const featureStart = Math.max(0, feature.start - lineStart);
        const featureEnd = Math.min(basesPerLine, feature.end - lineStart);
        const startX = featureStart * CHAR_WIDTH;
        const width = (featureEnd - featureStart) * CHAR_WIDTH;

        const track = trackAssignments.get(feature.id) ?? 0;
        const invertedTrack = MAX_FEATURE_TRACKS - 1 - track;
        const featureY = invertedTrack * (FEATURE_TRACK_HEIGHT + 2);

        const isSelected = selectedRegion?.start === feature.start &&
            selectedRegion?.end === feature.end;

        // Calculate truncated label if needed
        let labelText = feature.label || '';
        const maxLabelWidth = width - 4; // Leave 2px padding on each side
        const approximateCharWidth = 6; // Approximate width of each character
        const maxChars = Math.floor(maxLabelWidth / approximateCharWidth);

        if (labelText.length * approximateCharWidth > maxLabelWidth) {
            labelText = labelText.slice(0, maxChars - 2) + '..';
        }

        return (
            <g
                key={feature.id}
                data-feature-id={feature.id}
                data-feature-type={feature.type}
                onClick={(e) => handleFeatureClick(feature, e)}
                style={{ cursor: 'pointer' }}
            >
                <rect
                    x={startX}
                    y={y}
                    width={width}
                    height={FEATURE_TRACK_HEIGHT - 2}
                    fill={colorManager.getFeatureColor(feature.type)}
                    opacity={isSelected ? 0.3 : 0.8}
                    rx={2}
                />
                {labelText && width > 10 && (
                    <text
                        x={startX + width / 2}
                        y={y + FEATURE_TRACK_HEIGHT / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#333"
                        style={{ userSelect: 'none' }}
                    >
                        {labelText}
                    </text>
                )}
            </g>
        );
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-auto"
            style={{
                minWidth: TOTAL_WIDTH,
            }}
        >
            <svg
                viewBox={`0 0 ${TOTAL_WIDTH} ${totalLines * TOTAL_LINE_HEIGHT + MARGIN_TOP}`}
                className="w-full select-none"
                style={{
                    minWidth: TOTAL_WIDTH,
                    cursor: 'text'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {/* Add a background rect to catch all mouse events */}
                <rect
                    x={0}
                    y={0}
                    width={TOTAL_WIDTH}
                    height={totalLines * TOTAL_LINE_HEIGHT + MARGIN_TOP}
                    fill="transparent"
                />
                {Array.from({ length: totalLines }).map((_, i) => renderLine(i))}
            </svg>
        </div>
    );
}); 