'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PlasmidBackbone } from './plasmid/PlasmidBackbone';
import { PlasmidFeature } from './plasmid/PlasmidFeature';
import { SelectionHighlight } from './plasmid/SelectionHighlight';
import { PlasmidInfo } from './plasmid/PlasmidInfo';
import { PLASMID_CONSTANTS } from './plasmid/utils/constants';
import { usePlasmidViewer } from '../hooks/usePlasmidViewer';
import { LinearPlasmidViewer } from './plasmid/LinearPlasmidViewer';

const PlasmidViewer: React.FC = () => {
    const {
        sequence,
        features,
        plasmidName,
        plasmidLength,
        dnaSequence,
        visibleFeatureTypes,
        setVisibleFeatureTypes,
        selectedRegion,
        setSelectedRegion,
        isLoading,
        featureTypes,
        geometry,
        labelPositioner,
        selectionHandler: _selectionHandler,
        clipboardManager,
        colorManager,
        handleFileUpload,
        handleTextInput,
        handleFeatureClick,
        handleCheckboxChange,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        showLabels,
        setShowLabels,
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

    const handleLinearViewerMouseDown = (position: number) => {
        _selectionHandler.handleSelectionStart(position);
    };

    const handleLinearViewerMouseMove = (position: number) => {
        if (!_selectionHandler.isSelecting()) return;
        const newSelection = _selectionHandler.handleSelectionMove(position);
        if (newSelection) {
            setSelectedRegion(newSelection);
        }
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

                <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-4">
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="show-labels"
                            checked={showLabels}
                            onCheckedChange={(checked) => setShowLabels(!!checked)}
                        />
                        <label
                            htmlFor="show-labels"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Show Labels
                        </label>
                    </div>
                </div>

                <div className="relative w-full aspect-square bg-white mb-8">
                    <svg
                        ref={svgRef}
                        viewBox="0 0 600 600"
                        className="w-full h-full select-none"
                        style={{ userSelect: 'none' }}
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
                                    showLabels={showLabels}
                                />
                            ))}

                        <PlasmidInfo name={plasmidName} length={plasmidLength} />
                    </svg>
                </div>

                {plasmidLength > 0 && (
                    <div className="relative w-full overflow-x-auto">
                        <LinearPlasmidViewer
                            features={features}
                            plasmidLength={plasmidLength}
                            visibleFeatureTypes={visibleFeatureTypes}
                            selectedRegion={selectedRegion}
                            colorManager={colorManager}
                            onFeatureClick={handleFeatureClick}
                            sequence={dnaSequence}
                            onMouseDown={handleLinearViewerMouseDown}
                            onMouseMove={handleLinearViewerMouseMove}
                            onMouseUp={handleMouseUp}
                        />
                    </div>
                )}

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