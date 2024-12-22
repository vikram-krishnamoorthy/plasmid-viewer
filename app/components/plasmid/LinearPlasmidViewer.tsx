import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Feature, SelectedRegion } from './types';
import { ColorManager } from './utils/featureColorManager';
import { LinearPlasmidLabelAnnotation, LinearPlasmidTranslationAnnotation } from './LinearPlasmidAnnotations';
import { calculateAnnotationDimensions, calculateTrackY, assignTracks } from './LinearPlasmidAnnotations/utils';

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
    const _getLabelWidth = (feature: Feature): number => {
        const label = feature.label || '';
        // Approximate width based on character count (adjust CHAR_WIDTH as needed)
        return label.length * CHAR_WIDTH;
    };

    // Update overlap detection to include labels
    const _doFeaturesOverlap = (f1: Feature, f2: Feature, lineStart: number, lineEnd: number): boolean => {
        // Get the visible portions of each feature in this line
        const f1VisibleStart = Math.max(lineStart, f1.start);
        const f1VisibleEnd = Math.min(lineEnd, f1.end < f1.start ? f1.end + plasmidLength : f1.end);
        const f2VisibleStart = Math.max(lineStart, f2.start);
        const f2VisibleEnd = Math.min(lineEnd, f2.end < f2.start ? f2.end + plasmidLength : f2.end);

        // Check if the visible portions overlap
        return f1VisibleStart < f2VisibleEnd && f2VisibleStart < f1VisibleEnd;
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
    const _LABEL_SPACING = 15; // Minimum vertical spacing between labels
    const _LABEL_OFFSET = 5;  // Vertical offset from feature
    const _LINE_HEIGHT = 100; // Total height of each line
    const _SEQUENCE_Y = 80;   // Y position of the sequence line
    const _HIGHLIGHT_PADDING = 10; // Padding above and below the sequence line

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

        const { trackAssignments } = assignTracks(
            lineFeatures, 
            visibleFeatureTypes, 
            plasmidLength, 
            MAX_FEATURE_TRACKS
        );

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
                    const featureY = calculateTrackY(track, MAX_FEATURE_TRACKS, FEATURE_TRACK_HEIGHT);

                    if (feature.type === 'translation' && feature.translation) {
                        return (
                            <LinearPlasmidTranslationAnnotation
                                key={`aa-${feature.id}`}
                                feature={feature}
                                y={featureY}
                                lineStart={lineStart}
                                lineEnd={lineEnd}
                                charWidth={CHAR_WIDTH}
                                height={FEATURE_TRACK_HEIGHT}
                                isSelected={selectedRegion?.start === feature.start && 
                                           selectedRegion?.end === feature.end}
                                onClick={(e) => handleFeatureClick(feature, e)}
                            />
                        );
                    } else {
                        const dimensions = calculateAnnotationDimensions(
                            feature, 
                            lineStart, 
                            basesPerLine, 
                            CHAR_WIDTH
                        );
                        return (
                            <LinearPlasmidLabelAnnotation
                                key={feature.id}
                                feature={feature}
                                startX={dimensions.startX}
                                y={featureY}
                                width={dimensions.width}
                                height={FEATURE_TRACK_HEIGHT - 2}
                                color={colorManager.getFeatureColor(feature.type)}
                                isSelected={selectedRegion?.start === feature.start && 
                                           selectedRegion?.end === feature.end}
                                onClick={(e) => handleFeatureClick(feature, e)}
                            />
                        );
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
LinearPlasmidViewer.displayName = "LinearPlasmidViewer"; 