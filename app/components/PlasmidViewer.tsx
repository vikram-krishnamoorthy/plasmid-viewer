'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import _ from 'lodash';
import { Button } from "@/components/ui/button";
import { PlasmidBackbone } from './plasmid/PlasmidBackbone';
import { PlasmidFeature } from './plasmid/PlasmidFeature';
import { SelectionHighlight } from './plasmid/SelectionHighlight';
import { PlasmidInfo } from './plasmid/PlasmidInfo';
import type { Feature, SelectedRegion, LabelPosition } from './plasmid/types';
import { coordsToAngle, angleToCoords, normalizeAngle } from './plasmid/utils/geometry';
import { PLASMID_CONSTANTS, TWO_PI } from './plasmid/utils/constants';

const generateDistinctColors = (count: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        // Use HSL to generate evenly spaced colors with good saturation and lightness
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 45%)`);
    }
    return colors;
};

const PlasmidViewer: React.FC = () => {
    const [sequence, setSequence] = useState<string>('');
    const [features, setFeatures] = useState<Feature[]>([]);
    const [plasmidName, setPlasmidName] = useState<string>('');
    const [plasmidLength, setPlasmidLength] = useState<number>(0);
    const [dnaSequence, setDnaSequence] = useState<string>('');
    const [visibleFeatureTypes, setVisibleFeatureTypes] = useState<Set<string>>(() => {
        const initialTypes = new Set<string>();
        return initialTypes;
    });
    const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [featureColors, setFeatureColors] = useState<Record<string, string>>({});

    // Extract unique feature types
    const featureTypes: string[] = _.uniq(features.map(f => f.type));

    const parseGenBank = (input: string): void => {
        const features: Feature[] = [];
        let featureCounter = 0;
        const lines = input.split('\n');
        let currentFeature: Feature | null = null;
        let inFeatures = false;
        let inSequence = false;
        let name = '';
        let seqLength = 0;
        let sequence = '';

        // Helper function to clean sequence line
        const cleanSequenceLine = (line: string): string => {
            return line.replace(/^\s*\d+\s+/, '').replace(/\s+/g, '').toUpperCase();
        };

        lines.forEach(line => {
            if (line.startsWith('LOCUS')) {
                const matches = line.match(/^LOCUS\s+(\S+)\s+(\d+)/);
                if (matches) {
                    name = matches[1];
                    seqLength = parseInt(matches[2]);
                }
            }

            if (line.startsWith('FEATURES')) {
                inFeatures = true;
                return;
            }

            if (line.startsWith('ORIGIN')) {
                inFeatures = false;
                inSequence = true;
                return;
            }

            if (inSequence && !line.startsWith('//')) {
                // Extract sequence data, handling the number prefix and spaces
                const seqLine = cleanSequenceLine(line);
                if (seqLine.match(/^[ATCG]+$/)) {
                    sequence += seqLine;
                }
            }

            if (inFeatures) {
                if (line.match(/^\s{5}\w/)) {
                    if (currentFeature) {
                        features.push(currentFeature);
                    }
                    const [type, location] = line.trim().split(/\s+/);

                    let start = 0;
                    let end = 0;
                    let complement = false;

                    if (location.includes('complement')) {
                        complement = true;
                        const matches = location.match(/\d+/g);
                        if (matches) {
                            start = parseInt(matches[0]);
                            end = parseInt(matches[1] || matches[0]);
                        }
                    } else {
                        const matches = location.match(/\d+/g);
                        if (matches) {
                            start = parseInt(matches[0]);
                            end = parseInt(matches[1] || matches[0]);
                        }
                    }

                    currentFeature = {
                        id: `feature-${featureCounter++}`,
                        type,
                        start,
                        end,
                        complement,
                        label: '',
                        color: '#BDC3C7'
                    };
                } else if (line.match(/^\s{21}/) && currentFeature) {
                    const qualifier = line.trim();
                    if (qualifier.startsWith('/label=')) {
                        currentFeature.label = qualifier.split('=')[1].replace(/["']/g, '');
                    } else if (!currentFeature.label && qualifier.startsWith('/note=')) {
                        currentFeature.label = qualifier.split('=')[1].replace(/["']/g, '');
                    }
                }
            }
        });

        if (currentFeature) {
            features.push(currentFeature);
        }

        setPlasmidName(name);
        setPlasmidLength(seqLength);
        setFeatures(features);
        setDnaSequence(sequence.toUpperCase());
        setVisibleFeatureTypes(new Set(_.uniq(features.map(f => f.type))));
    };

    const mouseToCirclePosition = (e: React.MouseEvent<SVGSVGElement>, svg: SVGSVGElement | null): number => {
        if (!svg) return 0;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return 0;

        const svgP = pt.matrixTransform(matrix.inverse());

        const dx = svgP.x - PLASMID_CONSTANTS.CENTER;
        const dy = svgP.y - PLASMID_CONSTANTS.CENTER;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const pos = Math.round((normalizeAngle(angle)) * plasmidLength / TWO_PI);
        return pos === plasmidLength ? 0 : pos;
    };

    // Handle mouse events for selection
    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>): void => {
        if (!plasmidLength || !svgRef.current) return;
        const pos = mouseToCirclePosition(e, svgRef.current);
        setDragStart(pos);
        setIsDragging(true);
        setSelectedRegion(null);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>): void => {
        if (!isDragging || dragStart === null || !svgRef.current) return;
        const currentPos = mouseToCirclePosition(e, svgRef.current);

        setSelectedRegion({
            start: dragStart,
            end: currentPos
        });
    };

    const handleMouseUp = (): void => {
        setIsDragging(false);
    };

    // Handle feature selection
    const handleFeatureClick = (feature: Feature): void => {
        setSelectedRegion({
            start: feature.start,
            end: feature.end
        });
    };

    // Handle copy event
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent & { clipboardData: DataTransfer }): void => {
            if (selectedRegion && dnaSequence) {
                e.preventDefault();
                let seq = '';

                // Normalize positions to be within sequence length
                const start = selectedRegion.start - 1;
                const end = selectedRegion.end - 1;

                if (start <= end) {
                    seq = dnaSequence.substring(start, end + 1);
                } else {
                    // Wrap around the origin
                    seq = dnaSequence.substring(start) + dnaSequence.substring(0, end + 1);
                }

                e.clipboardData.setData('text/plain', seq);

                // Visual feedback
                const feedbackDiv = document.createElement('div');
                feedbackDiv.textContent = 'Sequence copied!';
                feedbackDiv.style.position = 'fixed';
                feedbackDiv.style.bottom = '20px';
                feedbackDiv.style.left = '50%';
                feedbackDiv.style.transform = 'translateX(-50%)';
                feedbackDiv.style.backgroundColor = '#4CAF50';
                feedbackDiv.style.color = 'white';
                feedbackDiv.style.padding = '10px 20px';
                feedbackDiv.style.borderRadius = '5px';
                feedbackDiv.style.zIndex = '1000';

                document.body.appendChild(feedbackDiv);
                setTimeout(() => {
                    document.body.removeChild(feedbackDiv);
                }, 2000);
            }
        };

        document.addEventListener('copy', handleCopy as EventListener);
        return () => document.removeEventListener('copy', handleCopy as EventListener);
    }, [selectedRegion, dnaSequence]);

    // Draw selection arc
    const getSelectionPath = (): string => {
        if (!selectedRegion) return '';
        const startAngle = coordsToAngle(selectedRegion.start, plasmidLength);
        const endAngle = coordsToAngle(selectedRegion.end, plasmidLength);
        const radius = PLASMID_CONSTANTS.BACKBONE_RADIUS;
        const start = angleToCoords(startAngle, radius);
        const end = angleToCoords(endAngle, radius);

        let angleDiff = endAngle - startAngle;
        if (angleDiff < 0) angleDiff += TWO_PI;

        const largeArc = angleDiff > Math.PI ? 1 : 0;
        const sweep = 1;

        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
    };

    const calculateLabelPositions = (): LabelPosition[] => {
        const visibleFeatures = features.filter(f => visibleFeatureTypes.has(f.type));

        // Sort features by size (largest first) and then by start position
        const sortedFeatures = _.orderBy(visibleFeatures,
            [
                feature => Math.abs(feature.end - feature.start),
                'start'
            ],
            ['desc', 'asc']
        );

        let labels = sortedFeatures.map((feature) => {
            const radius = getFeatureRadius(feature, sortedFeatures);
            const midAngle = coordsToAngle((feature.start + feature.end) / 2, plasmidLength);

            // Calculate feature point on the arc
            const featureCoords = angleToCoords(midAngle, radius);

            // Calculate the perpendicular point extending from the circle
            // This maintains perpendicularity by using the same angle
            const radialPoint = angleToCoords(midAngle, PLASMID_CONSTANTS.LABEL_RADIUS);

            // Determine if label should be on left or right side
            const isRightSide = radialPoint.x > PLASMID_CONSTANTS.CENTER;
            const labelOffset = PLASMID_CONSTANTS.LABEL_OFFSET;

            // Calculate final label position
            // Keep it at the same height as the radial point for horizontal alignment
            const labelX = isRightSide
                ? radialPoint.x + labelOffset
                : radialPoint.x - labelOffset;

            return {
                feature,
                midAngle,
                featureX: featureCoords.x,
                featureY: featureCoords.y,
                // Use the actual radial point to maintain perpendicularity
                radialX: radialPoint.x,
                radialY: radialPoint.y,
                labelX,
                labelY: radialPoint.y,
                rotation: 0,
                textAnchor: isRightSide ? "start" : "end",
                radius,
                plasmidLength
            };
        });

        // Sort labels by Y position for overlap prevention
        labels = _.sortBy(labels, 'labelY');

        // Adjust overlapping labels
        for (let i = 1; i < labels.length; i++) {
            const prevLabel = labels[i - 1];
            const currentLabel = labels[i];

            if (Math.abs(currentLabel.labelY - prevLabel.labelY) < PLASMID_CONSTANTS.MIN_LABEL_SPACING) {
                currentLabel.labelY = prevLabel.labelY + PLASMID_CONSTANTS.MIN_LABEL_SPACING;
                // Update the radial point's Y coordinate to match the new label position
                currentLabel.radialY = currentLabel.labelY;
            }
        }

        return labels;
    };

    const getFeatureRadius = (feature: Feature, sortedFeatures: Feature[]): number => {
        const baseRadius = PLASMID_CONSTANTS.FEATURE_BASE_RADIUS;
        const NEARBY_THRESHOLD = 10; // bases

        // Find features that overlap with this one
        const overlappingFeatures = sortedFeatures.filter(f => {
            if (f.id === feature.id) return false;

            // Handle circular plasmid wrapping
            let start1 = feature.start;
            let end1 = feature.end;
            let start2 = f.start;
            let end2 = f.end;

            // Normalize positions for circular comparison
            if (end1 < start1) end1 += plasmidLength;
            if (end2 < start2) end2 += plasmidLength;

            // Check if features overlap or are within threshold
            const overlapStart = Math.max(start1, start2);
            const overlapEnd = Math.min(end1, end2);

            return (overlapEnd - overlapStart + NEARBY_THRESHOLD) >= 0;
        });

        if (overlappingFeatures.length === 0) return baseRadius;

        // Calculate the size of this feature
        const featureSize = feature.end > feature.start
            ? feature.end - feature.start
            : (plasmidLength - feature.start) + feature.end;

        // Count how many larger features this one is contained within
        const containingFeatures = overlappingFeatures.filter(f => {
            const otherSize = f.end > f.start
                ? f.end - f.start
                : (plasmidLength - f.start) + f.end;

            // Check if this feature is fully contained within the other feature
            let start1 = feature.start;
            let end1 = feature.end;
            let start2 = f.start;
            let end2 = f.end;

            // Normalize positions for circular comparison
            if (end1 < start1) end1 += plasmidLength;
            if (end2 < start2) end2 += plasmidLength;

            // A feature is contained if:
            // 1. It's smaller than the other feature
            // 2. Its start and end positions fall within the other feature's range
            return otherSize > featureSize &&
                start1 >= start2 &&
                end1 <= end2;
        });

        // Move feature inward based on how many features contain it
        return baseRadius - (containingFeatures.length * 15);
    };

    // Add file handling function
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                setSequence(content);
                parseGenBank(content);
            } catch (error) {
                console.error('Error parsing file:', error);
                // You might want to add a toast or error message here
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            setIsLoading(false);
            // You might want to add a toast or error message here
        };

        reader.readAsText(file);
    };

    // Update useEffect to handle feature colors when features change
    useEffect(() => {
        if (features.length > 0) {
            const types = new Set(features
                .map(f => f.type)
                .filter(type => type.toLowerCase() !== 'source')
            );

            // Generate colors for unique feature types
            const uniqueTypes = Array.from(types);
            const colors = generateDistinctColors(uniqueTypes.length);
            const colorMap = Object.fromEntries(
                uniqueTypes.map((type, index) => [type, colors[index]])
            );

            setFeatureColors(colorMap);

            // Update existing features with new colors
            const updatedFeatures = features.map(feature => ({
                ...feature,
                color: colorMap[feature.type] || '#BDC3C7'
            }));

            setFeatures(updatedFeatures);
            setVisibleFeatureTypes(types);
        }
    }, [features.length]); // Only run when number of features changes

    // Fix Checkbox onCheckedChange type
    const handleCheckboxChange = (checked: boolean | "indeterminate", type: string) => {
        const newTypes = new Set(visibleFeatureTypes);
        if (checked === true) {
            newTypes.add(type);
        } else {
            newTypes.delete(type);
        }
        setVisibleFeatureTypes(newTypes);
    };

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle>Plasmid Map Viewer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Upload GenBank File"}
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".gb,.gbk,.genbank"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <span className="text-sm text-gray-500">
                            or
                        </span>
                    </div>
                    <textarea
                        className="w-full h-48 p-2 border rounded"
                        placeholder="Paste GenBank format sequence here..."
                        value={sequence}
                        onChange={(e) => {
                            setSequence(e.target.value);
                            parseGenBank(e.target.value);
                        }}
                    />
                </div>

                <div className="mb-4 flex flex-wrap gap-4">
                    {featureTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                                id={`feature-${type}`}
                                checked={visibleFeatureTypes.has(type)}
                                onCheckedChange={(checked) => handleCheckboxChange(checked, type)}
                                style={{
                                    '--checkbox-color': featureColors[type] || '#BDC3C7'
                                } as React.CSSProperties}
                                className="data-[state=checked]:bg-[var(--checkbox-color)] data-[state=checked]:border-[var(--checkbox-color)]"
                            />
                            <label
                                htmlFor={`feature-${type}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {type}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="relative w-full aspect-square bg-white">
                    <svg
                        ref={svgRef}
                        viewBox="0 0 600 600"
                        className="w-full h-full"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <PlasmidBackbone plasmidLength={plasmidLength} />

                        {selectedRegion && (
                            <SelectionHighlight selectionPath={getSelectionPath()} />
                        )}

                        {/* Features are now rendered in order from largest to smallest */}
                        {calculateLabelPositions().map((labelPosition) => (
                            <PlasmidFeature
                                key={labelPosition.feature.id}
                                labelPosition={labelPosition}
                                isSelected={selectedRegion?.start === labelPosition.feature.start &&
                                    selectedRegion?.end === labelPosition.feature.end}
                                onClick={() => handleFeatureClick(labelPosition.feature)}
                            />
                        ))}

                        <PlasmidInfo name={plasmidName} length={plasmidLength} />
                    </svg>
                </div>

                {selectedRegion && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                            Selected region: {selectedRegion.start} - {selectedRegion.end}
                            ({selectedRegion.end - selectedRegion.start + 1} bp)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Press Ctrl+C to copy the sequence
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PlasmidViewer;