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
    onMouseDown: (position: number) => void;
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

    // Function to check if features overlap
    const doFeaturesOverlap = (f1: Feature, f2: Feature): boolean => {
        const f1End = f1.end < f1.start ? f1.end + plasmidLength : f1.end;
        const f2End = f2.end < f2.start ? f2.end + plasmidLength : f2.end;
        return f1.start <= f2End && f2.start <= f1End;
    };

    // Assign tracks to features within a line segment with priority for longer features
    const assignTracks = (lineFeatures: Feature[]): Map<string, number> => {
        const trackAssignments = new Map<string, number>();

        // Sort features by size (largest first) and then by start position
        const sortedFeatures = [...lineFeatures].sort((a, b) => {
            const getSize = (f: Feature) => {
                const size = f.end < f.start ?
                    (plasmidLength - f.start) + f.end :
                    f.end - f.start;
                return size;
            };

            const sizeA = getSize(a);
            const sizeB = getSize(b);

            // Sort by size first (descending)
            if (sizeB !== sizeA) {
                return sizeB - sizeA;
            }
            // Then by start position (ascending)
            return a.start - b.start;
        });

        // Assign tracks based on sorted order and available space
        sortedFeatures.forEach(feature => {
            if (!visibleFeatureTypes.has(feature.type)) return;

            // Try tracks from bottom (closest to sequence) up
            for (let track = MAX_FEATURE_TRACKS - 1; track >= 0; track--) {
                const canUseTrack = ![...trackAssignments.entries()].some(
                    ([id, t]) => {
                        const existingFeature = lineFeatures.find(f => f.id === id);
                        return t === track && existingFeature && doFeaturesOverlap(feature, existingFeature);
                    }
                );

                if (canUseTrack) {
                    trackAssignments.set(feature.id, track);
                    break;
                }
            }
        });

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
            setMouseDownTime(Date.now());
            setMouseDownPos(pos);
            setIsDragging(false);
            onMouseDown(pos);
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

        // Adjust vertical spacing to account for amino acids
        const aminoAcidsY = 0; // Put amino acids at the top
        const featuresY = aminoAcidsY + AMINO_ACID_HEIGHT + AMINO_ACID_GAP; // Move features down
        const sequenceY = featuresY + (FEATURE_TRACK_HEIGHT * MAX_FEATURE_TRACKS) + FEATURE_SECTION_GAP;
        const backboneY = sequenceY + SEQUENCE_HEIGHT / 2;
        const positionY = backboneY;

        // Find features that overlap with this line
        const lineFeatures = visibleFeatures.filter(feature => {
            const featureEnd = feature.end < feature.start ? feature.end + plasmidLength : feature.end;
            return feature.start <= lineEnd && featureEnd >= lineStart;
        });

        const trackAssignments = assignTracks(lineFeatures);

        // Track label positions for this line to prevent overlaps
        const labelPositions: { x: number, width: number, y: number }[] = [];

        const findAvailableY = (x: number, width: number, baseY: number) => {
            let y = baseY;
            let hasOverlap;

            do {
                hasOverlap = labelPositions.some(pos => {
                    // Check if labels overlap horizontally
                    const horizontalOverlap = !(
                        x + width < pos.x - LABEL_SPACING ||
                        x > pos.x + pos.width + LABEL_SPACING
                    );
                    // Check if labels are too close vertically
                    const verticalOverlap = Math.abs(y - pos.y) < LABEL_SPACING;
                    return horizontalOverlap && verticalOverlap;
                });

                if (hasOverlap) {
                    y -= LABEL_SPACING; // Move label up if there's overlap
                }
            } while (hasOverlap);

            return y;
        };

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

        // Find CDS features with translations that overlap with this line
        const cdsFeatures = lineFeatures.filter(f =>
            f.type === 'CDS' &&
            f.translation &&
            visibleFeatureTypes.has(f.type)
        );

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

                {/* Amino Acid Sequence */}
                {cdsFeatures.map(feature => {
                    if (!feature.translation) return null;

                    // Calculate the visible portion of the feature for this line
                    const featureStart = Math.max(lineStart, feature.start);
                    const featureEnd = Math.min(lineEnd, feature.end);

                    if (featureStart >= featureEnd) return null;

                    const isSelected = selectedRegion?.start === feature.start &&
                        selectedRegion?.end === feature.end;

                    // For each base position in the visible region, determine which codon it belongs to
                    const visibleBases = Array.from({ length: featureEnd - featureStart }, (_, i) => {
                        const absolutePos = featureStart + i;
                        const relativePos = absolutePos - feature.start;
                        return {
                            position: absolutePos,
                            codonIndex: Math.floor(relativePos / 3),
                            posInCodon: relativePos % 3
                        };
                    });

                    // Group bases by codon
                    const codonGroups = visibleBases.reduce((groups, base) => {
                        if (!groups[base.codonIndex]) {
                            groups[base.codonIndex] = [];
                        }
                        groups[base.codonIndex].push(base);
                        return groups;
                    }, {} as Record<number, typeof visibleBases>);

                    return (
                        <g
                            key={`aa-${feature.id}`}
                            onClick={() => onFeatureClick(feature)}
                            style={{ cursor: 'pointer' }}
                        >
                            {Object.entries(codonGroups).map(([codonIndex, bases]) => {
                                const aminoAcid = feature.translation?.[parseInt(codonIndex)];
                                if (!aminoAcid) return null;

                                const x = (bases[0].position - lineStart) * CHAR_WIDTH;
                                const width = bases.length * CHAR_WIDTH;
                                const showLabel = bases.length >= 2;

                                return (
                                    <g key={`${feature.id}-codon-${codonIndex}`}>
                                        <rect
                                            x={x}
                                            y={aminoAcidsY}
                                            width={width}
                                            height={AMINO_ACID_HEIGHT}
                                            fill={AMINO_ACID_COLORS[aminoAcid] || '#E6E6E6'}
                                            opacity={isSelected ? 0.3 : 0.8}
                                        />
                                        {showLabel && (
                                            <text
                                                x={x + (width / 2)}
                                                y={aminoAcidsY + AMINO_ACID_HEIGHT / 2}
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
                })}

                {/* Features */}
                {lineFeatures.map(feature => {
                    if (!visibleFeatureTypes.has(feature.type)) return null;

                    const track = trackAssignments.get(feature.id) ?? 0;
                    const featureY = track * (FEATURE_TRACK_HEIGHT + 2); // Add 2px gap between tracks

                    const featureStart = Math.max(0, feature.start - lineStart);
                    const featureEnd = Math.min(basesPerLine, feature.end - lineStart);
                    const startX = featureStart * CHAR_WIDTH;
                    const width = (featureEnd - featureStart) * CHAR_WIDTH;

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
                            onMouseDown={(e) => {
                                // Allow both selection and click handling
                                handleMouseDown(e);
                                // Don't stop propagation - let the event bubble
                            }}
                            onClick={(e) => handleFeatureClick(feature, e)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect
                                x={startX}
                                y={featureY}
                                width={width}
                                height={FEATURE_TRACK_HEIGHT - 2}
                                fill={colorManager.getFeatureColor(feature.type)}
                                opacity={isSelected ? 0.3 : 0.8}
                                rx={2}
                            />
                            {labelText && width > 10 && (
                                <text
                                    x={startX + width / 2}
                                    y={featureY + FEATURE_TRACK_HEIGHT / 2}
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

                {/* Position markers - only on left side */}
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