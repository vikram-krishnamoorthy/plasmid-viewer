'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import _ from 'lodash';

interface Feature {
    type: string;
    start: number;
    end: number;
    complement: boolean;
    label: string;
    color: string;
}

interface SelectedRegion {
    start: number;
    end: number;
}

interface LabelPosition {
    feature: Feature;
    midAngle: number;
    featureX: number;
    featureY: number;
    labelX: number;
    labelY: number;
    rotation: number;
    textAnchor: string;
}

interface FeaturePath {
    path: string;
    arrow: string;
}

const PlasmidViewer: React.FC = () => {
    const [sequence, setSequence] = useState<string>('');
    const [features, setFeatures] = useState<Feature[]>([]);
    const [plasmidName, setPlasmidName] = useState<string>('');
    const [plasmidLength, setPlasmidLength] = useState<number>(0);
    const [dnaSequence, setDnaSequence] = useState<string>('');
    const [visibleFeatureTypes, setVisibleFeatureTypes] = useState<Set<string>>(new Set());
    const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Extract unique feature types
    const featureTypes: string[] = _.uniq(features.map(f => f.type));

    const parseGenBank = (input: string): void => {
        const features: Feature[] = [];
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
                        type,
                        start,
                        end,
                        complement,
                        label: '',
                        color: getFeatureColor(type)
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

    const getFeatureColor = (type: string): string => {
        const colorMap: Record<string, string> = {
            CDS: '#4C9BE6',
            promoter: '#45B649',
            terminator: '#E74C3C',
            misc_feature: '#9B59B6',
            rep_origin: '#F1C40F',
            gene: '#2ECC71',
            primer_bind: '#E67E22',
            regulatory: '#95A5A6',
            polyA_signal: '#1ABC9C'
        };
        return colorMap[type.toLowerCase()] || '#BDC3C7';
    };

    // Convert plasmid coordinates to SVG coordinates
    const coordsToAngle = (pos: number): number => {
        return (pos / plasmidLength) * 2 * Math.PI - Math.PI / 2;
    };

    const angleToCoords = (angle: number, radius: number): { x: number, y: number } => {
        return {
            x: 300 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle)
        };
    };

    // Convert mouse position to plasmid position
    const mouseToCirclePosition = (e: React.MouseEvent): number => {
        const svg = svgRef.current;
        if (!svg) return 0;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        const dx = svgP.x - 300;
        const dy = svgP.y - 300;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const pos = Math.round(((angle + 2 * Math.PI) % (2 * Math.PI)) * plasmidLength / (2 * Math.PI));
        return pos === plasmidLength ? 0 : pos;
    };

    // Handle mouse events for selection
    const handleMouseDown = (e: React.MouseEvent): void => {
        if (!plasmidLength) return;
        const pos = mouseToCirclePosition(e);
        setDragStart(pos);
        setIsDragging(true);
        setSelectedRegion(null);
    };

    const handleMouseMove = (e: React.MouseEvent): void => {
        if (!isDragging || dragStart === null) return;
        const currentPos = mouseToCirclePosition(e);
        
        // Always set start and end based on actual positions
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
        const handleCopy = (e: ClipboardEvent): void => {
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
                
                e.clipboardData?.setData('text/plain', seq);

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

        document.addEventListener('copy', handleCopy);
        return () => document.removeEventListener('copy', handleCopy);
    }, [selectedRegion, dnaSequence]);

    // Draw selection arc
    const getSelectionPath = (): string => {
        if (!selectedRegion) return '';
        const startAngle = coordsToAngle(selectedRegion.start);
        const endAngle = coordsToAngle(selectedRegion.end);
        const radius = 200;
        const start = angleToCoords(startAngle, radius);
        const end = angleToCoords(endAngle, radius);
        
        // Determine if we need to draw the arc clockwise or counterclockwise
        let largeArc = 0;
        let sweep = 1;
        
        // Calculate the angular distance between start and end
        let angleDiff = endAngle - startAngle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;
        
        if (angleDiff > Math.PI) {
            largeArc = 1;
        }

        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
    };

    // Feature rendering logic remains mostly the same, just filtered by visibility
    const getFeaturePath = (feature: Feature, radius: number): FeaturePath => {
        const startAngle = coordsToAngle(feature.start);
        const endAngle = coordsToAngle(feature.end);
        const arcRadius = radius;

        const startX = 300 + arcRadius * Math.cos(startAngle);
        const startY = 300 + arcRadius * Math.sin(startAngle);
        const endX = 300 + arcRadius * Math.cos(endAngle);
        const endY = 300 + arcRadius * Math.sin(endAngle);

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        const arrowSize = 6;
        const arrowAngle = feature.complement ? startAngle : endAngle;
        const arrowX = 300 + arcRadius * Math.cos(arrowAngle);
        const arrowY = 300 + arcRadius * Math.sin(arrowAngle);

        const arrowTip = {
            x: arrowX + arrowSize * Math.cos(arrowAngle),
            y: arrowY + arrowSize * Math.sin(arrowAngle)
        };

        const arrowBase1 = {
            x: arrowX + arrowSize * Math.cos(arrowAngle - Math.PI / 6),
            y: arrowY + arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        };

        const arrowBase2 = {
            x: arrowX + arrowSize * Math.cos(arrowAngle + Math.PI / 6),
            y: arrowY + arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        };

        return {
            path: `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${endX} ${endY}`,
            arrow: `M ${arrowBase1.x} ${arrowBase1.y} L ${arrowTip.x} ${arrowTip.y} L ${arrowBase2.x} ${arrowBase2.y}`
        };
    };

    const calculateLabelPositions = (): LabelPosition[] => {
        const labelRadius = 250;
        const visibleFeatures = features.filter(f => visibleFeatureTypes.has(f.type));
        const labels = visibleFeatures.map((feature, index) => {
            const midAngle = ((feature.start + feature.end) / 2 / plasmidLength) * 2 * Math.PI - Math.PI / 2;
            const radius = getFeatureRadius(feature, index);

            const featureX = 300 + radius * Math.cos(midAngle);
            const featureY = 300 + radius * Math.sin(midAngle);
            const labelX = 300 + labelRadius * Math.cos(midAngle);
            const labelY = 300 + labelRadius * Math.sin(midAngle);

            let rotation = (midAngle * 180 / Math.PI + 90) % 360;
            let textAnchor = "start";
            if (rotation > 90 && rotation < 270) {
                rotation += 180;
                textAnchor = "end";
            }

            return {
                feature,
                midAngle,
                featureX,
                featureY,
                labelX,
                labelY,
                rotation,
                textAnchor
            };
        });

        return _.sortBy(labels, 'midAngle');
    };

    const getFeatureRadius = (feature: Feature, index: number): number => {
        const baseRadius = 180;
        const visibleFeatures = features.filter(f => visibleFeatureTypes.has(f.type));
        const overlap = visibleFeatures.filter(f =>
            (f.start <= feature.end && f.end >= feature.start) ||
            (f.start <= feature.end + plasmidLength && f.end >= feature.start)
        );
        const layer = overlap.indexOf(feature);
        return baseRadius - layer * 15;
    };

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle>Plasmid Map Viewer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
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
                                onCheckedChange={(checked) => {
                                    const newTypes = new Set(visibleFeatureTypes);
                                    if (checked) {
                                        newTypes.add(type);
                                    } else {
                                        newTypes.delete(type);
                                    }
                                    setVisibleFeatureTypes(newTypes);
                                }}
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
                        {/* Backbone circle */}
                        <circle
                            cx="300"
                            cy="300"
                            r="200"
                            fill="none"
                            stroke="#333"
                            strokeWidth="1"
                        />

                        {/* Selection highlight */}
                        {selectedRegion && (
                            <path
                                d={getSelectionPath()}
                                fill="none"
                                stroke="#FFD700"
                                strokeWidth="8"
                                opacity="0.5"
                            />
                        )}

                        {/* Base pair markers */}
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                            const bp = Math.round((i / 12) * plasmidLength);
                            return (
                                <g key={i}>
                                    <line
                                        x1={300 + 195 * Math.cos(angle)}
                                        y1={300 + 195 * Math.sin(angle)}
                                        x2={300 + 205 * Math.cos(angle)}
                                        y2={300 + 205 * Math.sin(angle)}
                                        stroke="#333"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={300 + 220 * Math.cos(angle)}
                                        y={300 + 220 * Math.sin(angle)}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="10"
                                        fill="#666"
                                    >
                                        {bp.toLocaleString()}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Features */}
                        {calculateLabelPositions().map(({
                            feature,
                            midAngle,
                            featureX,
                            featureY,
                            labelX,
                            labelY,
                            rotation,
                            textAnchor
                        }, index) => {
                            const radius = getFeatureRadius(feature, index);
                            const { path, arrow } = getFeaturePath(feature, radius);

                            return (
                                <g
                                    key={index}
                                    onClick={() => handleFeatureClick(feature)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Feature arc */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={feature.color}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        className="transition-opacity duration-200"
                                        opacity={selectedRegion &&
                                            !(selectedRegion.start === feature.start &&
                                                selectedRegion.end === feature.end) ? "0.3" : "1"}
                                    />

                                    {/* Direction arrow */}
                                    <path
                                        d={arrow}
                                        fill="none"
                                        stroke={feature.color}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {feature.label && (
                                        <>
                                            {/* Label line */}
                                            <line
                                                x1={featureX}
                                                y1={featureY}
                                                x2={labelX}
                                                y2={labelY}
                                                stroke="#999"
                                                strokeWidth="1"
                                                strokeDasharray="2,2"
                                            />

                                            {/* Label text */}
                                            <text
                                                x={labelX}
                                                y={labelY}
                                                textAnchor={textAnchor}
                                                dominantBaseline="middle"
                                                transform={`rotate(${rotation}, ${labelX}, ${labelY})`}
                                                fontSize="10"
                                                fill="#333"
                                            >
                                                {feature.label}
                                            </text>
                                        </>
                                    )}
                                </g>
                            );
                        })}

                        {/* Plasmid name and size */}
                        <text
                            x="300"
                            y="290"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="14"
                            fontWeight="bold"
                            fill="#333"
                        >
                            {plasmidName}
                        </text>
                        <text
                            x="300"
                            y="310"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fill="#666"
                        >
                            {plasmidLength ? `${plasmidLength.toLocaleString()} bp` : ''}
                        </text>
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