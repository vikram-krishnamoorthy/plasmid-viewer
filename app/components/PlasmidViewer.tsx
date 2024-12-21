'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import _ from 'lodash';
import { Button } from "@/components/ui/button";
import { PlasmidBackbone } from './plasmid/PlasmidBackbone';
import { PlasmidFeature } from './plasmid/PlasmidFeature';
import { SelectionHighlight } from './plasmid/SelectionHighlight';
import { PlasmidInfo } from './plasmid/PlasmidInfo';
import type { Feature, SelectedRegion, LabelPosition } from './plasmid/types';
import { PLASMID_CONSTANTS } from './plasmid/utils/constants';
import { usePlasmidViewer } from '../hooks/usePlasmidViewer';

const PlasmidViewer: React.FC = () => {
    const {
        sequence,
        features,
        plasmidName,
        plasmidLength,
        dnaSequence,
        visibleFeatureTypes,
        selectedRegion,
        isLoading,
        featureTypes,
        geometry,
        labelPositioner,
        selectionHandler,
        clipboardManager,
        colorManager,
        handleFileUpload,
        handleTextInput,
        handleFeatureClick,
        handleCheckboxChange,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    } = usePlasmidViewer();

    const svgRef = useRef<SVGSVGElement>(null);

    // Handle copy event
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent): void => {
            if (selectedRegion && dnaSequence) {
                e.preventDefault();
                clipboardManager.copySequence(
                    dnaSequence,
                    selectedRegion.start,
                    selectedRegion.end,
                    plasmidLength
                );
            }
        };

        document.addEventListener('copy', handleCopy);
        return () => document.removeEventListener('copy', handleCopy);
    }, [selectedRegion, dnaSequence, plasmidLength, clipboardManager]);

    // Draw selection arc
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
                        onChange={(e) => handleTextInput(e.target.value)}
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
                                    '--checkbox-color': colorManager.getFeatureColor(type)
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

                        {labelPositioner.calculateLabelPositions(features, visibleFeatureTypes, plasmidLength)
                            .map((labelPosition) => (
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