'use client'

import React, { useRef, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePlasmidViewer } from '../hooks/usePlasmidViewer';
import { LinearPlasmidViewer, LinearPlasmidViewerRef } from './plasmid/LinearPlasmidViewer';
import type { Feature } from './plasmid/types';
import { FeatureFilterBar } from './plasmid/FeatureFilterBar';
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
        handleMouseUp,
        handleLinearViewerMouseDown,
        handleLinearViewerMouseMove,
        handleCopy,
    } = usePlasmidViewer();

    const svgRef = useRef<SVGSVGElement>(null);
    const linearViewerRef = useRef<LinearPlasmidViewerRef>(null);

    // Update selection handler features when they change
    useEffect(() => {
        _selectionHandler.setFeatures(features);
    }, [features, _selectionHandler]);

    // Handle copy event
    useEffect(() => {
        const handleCopyEvent = (e: ClipboardEvent): void => {
            if (selectedRegion && dnaSequence) {
                e.preventDefault();
                clipboardManager.copySequence(
                    dnaSequence,
                    selectedRegion.start,
                    selectedRegion.end,
                    plasmidLength,
                    features
                );
            }
        };

        document.addEventListener('copy', handleCopyEvent);
        return () => document.removeEventListener('copy', handleCopyEvent);
    }, [selectedRegion, dnaSequence, plasmidLength, clipboardManager, features]);

    // This handler is for the circular viewer only
    const handleCircularViewerMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const position = _selectionHandler.mouseToPosition(e, svg);
        _selectionHandler.handleSelectionStart(position, false);
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

    // Add this handler for the FeatureFilterBar
    const handleToggleFeature = (type: string) => {
        const newVisibleFeatures = new Set(visibleFeatureTypes);
        if (newVisibleFeatures.has(type)) {
            newVisibleFeatures.delete(type);
        } else {
            newVisibleFeatures.add(type);
        }
        setVisibleFeatureTypes(newVisibleFeatures);
    };

    // Add this handler for the circular viewer
    const handleCircularViewerMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!_selectionHandler.isSelecting()) return;
        const position = _selectionHandler.mouseToPosition(e, e.currentTarget);
        const newSelection = _selectionHandler.handleSelectionMove(position);
        if (newSelection) {
            setSelectedRegion(newSelection);
        }
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
                        colorManager={colorManager}
                        onFeatureClick={handleCircularFeatureClick}
                        onMouseDown={handleCircularViewerMouseDown}
                        onMouseMove={handleCircularViewerMouseMove}
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
                                onFeatureClick={handleCircularFeatureClick}
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