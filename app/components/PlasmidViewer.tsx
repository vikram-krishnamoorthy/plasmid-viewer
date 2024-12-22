'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePlasmidViewer } from '../hooks/usePlasmidViewer';
import { LinearPlasmidViewer, LinearPlasmidViewerRef } from './plasmid/LinearPlasmidViewer';
import type { Feature } from './plasmid/types';
import { FeatureFilterBar } from './plasmid/FeatureFilterBar';
import { LabelPosition } from './plasmid/types';
import { CircularPlasmidViewer } from './plasmid/CircularPlasmidViewer';

const PlasmidViewer: React.FC = () => {
    const {
        sequence,
        features,
        plasmidName,
        plasmidDefinition,
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
        handleCheckboxChange,
        handleMouseMove,
        handleMouseUp,
    } = usePlasmidViewer();

    const svgRef = useRef<SVGSVGElement>(null);
    const linearViewerRef = useRef<LinearPlasmidViewerRef>(null);

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

    // This handler is for the circular viewer only
    const handleCircularViewerMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const position = _selectionHandler.mouseToPosition(e, svg);
        _selectionHandler.handleSelectionStart(position);
        linearViewerRef.current?.scrollToPosition(position);
    };

    // This handler is for the circular viewer only
    const handleCircularFeatureClick = (feature: Feature) => {
        setSelectedRegion({
            start: feature.start,
            end: feature.end - 1
        });
        linearViewerRef.current?.scrollToPosition(feature.start);
    };

    // Linear viewer handlers - NO SCROLLING HERE
    const handleLinearViewerMouseDown = (position: number) => {
        _selectionHandler.handleSelectionStart(position);
        // NO SCROLLING!
    };

    const handleLinearViewerMouseMove = (position: number) => {
        if (!_selectionHandler.isSelecting()) return;
        const newSelection = _selectionHandler.handleSelectionMove(position);
        if (newSelection) {
            setSelectedRegion(newSelection);
        }
        // NO SCROLLING!
    };

    // Separate handler for linear feature clicks (no scrolling)
    const handleLinearFeatureClick = (feature: Feature) => {
        setSelectedRegion({
            start: feature.start,
            end: feature.end - 1
        });
        // No scrolling!
    };

    // Add this handler for the FeatureFilterBar
    const handleToggleFeature = (type: string) => {
        setVisibleFeatureTypes(types => {
            const newTypes = new Set(types);
            if (newTypes.has(type)) {
                newTypes.delete(type);
            } else {
                newTypes.add(type);
            }
            return newTypes;
        });
    };

    return (
        <div className="w-full h-screen p-6 flex flex-col">
            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    {plasmidLength > 0 ? (
                        <>Viewing Plasmid: {plasmidDefinition || plasmidName}</>
                    ) : (
                        "Plasmid Map Viewer"
                    )}
                </h1>
            </div>

            {/* Feature Filter Bar - Always show container */}
            <div className="mb-6">
                {featureTypes.length > 0 ? (
                    <FeatureFilterBar
                        featureTypes={featureTypes}
                        visibleFeatureTypes={visibleFeatureTypes}
                        colorManager={colorManager}
                        onToggleFeature={handleToggleFeature}
                    />
                ) : (
                    <div className="bg-gray-50 py-3">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold pl-4 text-gray-400">View/Hide Features:</span>
                            <span className="text-sm text-gray-400">Upload a file to view features</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-b mb-6" />

            {/* Main Content Section */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Column */}
                <div className="w-[600px] flex flex-col gap-4">
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
                    </div>

                    <CircularPlasmidViewer
                        features={features}
                        plasmidName={plasmidName}
                        plasmidLength={plasmidLength}
                        visibleFeatureTypes={visibleFeatureTypes}
                        selectedRegion={selectedRegion}
                        geometry={geometry}
                        labelPositioner={labelPositioner}
                        colorManager={colorManager}
                        onFeatureClick={handleCircularFeatureClick}
                        onMouseDown={handleCircularViewerMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>

                {/* Right Column - Linear View */}
                {plasmidLength > 0 && (
                    <div className="flex-1 border rounded">
                        <div className="w-full h-full">
                            <LinearPlasmidViewer
                                ref={linearViewerRef}
                                features={features}
                                plasmidLength={plasmidLength}
                                visibleFeatureTypes={visibleFeatureTypes}
                                selectedRegion={selectedRegion}
                                colorManager={colorManager}
                                onFeatureClick={handleLinearFeatureClick}
                                sequence={dnaSequence}
                                onMouseDown={handleLinearViewerMouseDown}
                                onMouseMove={handleLinearViewerMouseMove}
                                onMouseUp={handleMouseUp}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Info */}
            {selectedRegion && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-4 bg-white shadow-lg rounded-md border">
                    <p className="text-sm text-gray-600">
                        Selected region: {selectedRegion.start + 1} - {selectedRegion.end + 1}
                        ({selectedRegion.end >= selectedRegion.start ?
                            selectedRegion.end - selectedRegion.start + 1 :
                            plasmidLength - selectedRegion.start + selectedRegion.end + 1} bp)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Press Ctrl+C to copy the sequence
                    </p>
                </div>
            )}
        </div>
    );
};

export default PlasmidViewer;