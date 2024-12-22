'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePlasmidViewer } from '../hooks/usePlasmidViewer';
import { LinearPlasmidViewer, LinearPlasmidViewerRef } from './plasmid/LinearPlasmidViewer';
import type { Feature } from './plasmid/types';
import { FeatureFilterBar } from './plasmid/FeatureFilterBar';
import { CircularPlasmidViewer } from './plasmid/CircularPlasmidViewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    selectionHandler: _selectionHandler,
    clipboardManager,
    colorManager,
    handleFileUpload,
    handleMouseUp,
    handleLinearViewerMouseDown,
    handleLinearViewerMouseMove,
  } = usePlasmidViewer();

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
      end: feature.end - 1,
    });
    linearViewerRef.current?.scrollToPosition(feature.start);
  };

  // Remove scrolling from linear viewer click handler
  const handleLinearFeatureClick = (feature: Feature) => {
    setSelectedRegion({
      start: feature.start,
      end: feature.end - 1,
    });
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
            'Plasmid Map Viewer'
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

      {/* Divider - Made darker */}
      <div className="border-b border-gray-300 mb-6" />

      {/* Main Content Section */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column - 1/3 width */}
        <div className="w-1/3 flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isLoading}
          >
            {isLoading
              ? 'Loading...'
              : plasmidLength > 0
                ? 'Upload new GenBank File'
                : 'Upload GenBank File'}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".gb,.gbk,.genbank"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Circular Viewer Container with Tabs - Darker border */}
          <div className="flex-1 border-2 border-gray-200 rounded-lg bg-white flex flex-col">
            <Tabs defaultValue="map" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-t-lg rounded-b-none px-2 pt-2 grid grid-cols-2 bg-gray-50">
                <TabsTrigger
                  value="map"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-t-lg rounded-b-none"
                >
                  Circular Map
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-t-lg rounded-b-none"
                >
                  Raw File Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="flex-1 p-0 m-0">
                {plasmidLength > 0 ? (
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
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    Upload file to view circular plasmid map
                  </div>
                )}
              </TabsContent>

              <TabsContent value="raw" className="flex-1 p-0 m-0 h-full relative">
                {plasmidLength > 0 ? (
                  <div className="absolute inset-0 overflow-auto p-4">
                    <pre className="text-[0.6rem] leading-[1.2] font-mono text-gray-700 whitespace-pre">
                      {sequence}
                    </pre>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    Upload file to view raw data
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - 2/3 width - Darker border */}
        <div className="w-2/3 border-2 border-gray-200 rounded-lg bg-white">
          {plasmidLength > 0 ? (
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
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
              Upload file to view linear plasmid map
            </div>
          )}
        </div>
      </div>

      {/* Selection Info - Darker border */}
      {selectedRegion && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-4 bg-white shadow-lg rounded-md border-2 border-gray-200">
          <p className="text-sm text-gray-700">
            Selected region: {selectedRegion.start + 1} - {selectedRegion.end + 1}(
            {selectedRegion.end >= selectedRegion.start
              ? selectedRegion.end - selectedRegion.start + 1
              : plasmidLength - selectedRegion.start + selectedRegion.end + 1}{' '}
            bp)
          </p>
          <p className="text-xs text-gray-600 mt-1">Press Ctrl+C to copy the sequence</p>
        </div>
      )}
    </div>
  );
};

export default PlasmidViewer;
