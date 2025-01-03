import { useState, useMemo } from 'react';
import _ from 'lodash';
import type { Feature, SelectedRegion } from '../components/plasmid/types';
import { PLASMID_CONSTANTS } from '../components/plasmid/utils/constants';
import { CircularGeometry } from '../components/plasmid/utils/geometry';
import { GenBankParser } from '../components/plasmid/utils/genBankParser';
import { CircularSelectionHandler } from '../components/plasmid/utils/selectionHandler';
import { FeatureColorManager } from '../components/plasmid/utils/featureColorManager';
import { CircularClipboardManager } from '../components/plasmid/utils/clipboardManager';
import {
  GenBankInputHandler,
  type SequenceInputResult,
} from '../components/plasmid/utils/sequenceInputHandler';
import { toast } from '@/components/ui/use-toast';

export function usePlasmidViewer() {
  // State
  const [sequence, setSequence] = useState<string>('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [plasmidName, setPlasmidName] = useState<string>('');
  const [plasmidLength, setPlasmidLength] = useState<number>(0);
  const [dnaSequence, setDnaSequence] = useState<string>('');
  const [visibleFeatureTypes, setVisibleFeatureTypes] = useState<Set<string>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_featureColors, setFeatureColors] = useState<Record<string, string>>({});
  const [plasmidDefinition, setPlasmidDefinition] = useState<string>('');

  // Services
  const geometry = useMemo(() => new CircularGeometry(PLASMID_CONSTANTS), []);
  const parser = useMemo(() => new GenBankParser(), []);
  const colorManager = useMemo(() => new FeatureColorManager(), []);
  const selectionHandler = useMemo(
    () => new CircularSelectionHandler(geometry, plasmidLength, setSelectedRegion),
    [geometry, plasmidLength, setSelectedRegion]
  );
  const clipboardManager = useMemo(() => new CircularClipboardManager(), []);
  const inputHandler = useMemo(() => new GenBankInputHandler(parser), [parser]);

  // Derived state
  const featureTypes = _.uniq(features.map((f) => f.type));

  const updatePlasmidData = (result: SequenceInputResult) => {
    setPlasmidName(result.name);
    setPlasmidDefinition(result.definition);
    setPlasmidLength(result.length);
    const colorMap = colorManager.generateColors(result.features);
    setFeatureColors(colorMap);
    setFeatures(
      result.features.map((feature) => ({
        ...feature,
        color: colorMap[feature.type] || '#BDC3C7',
      }))
    );
    setDnaSequence(result.sequence);

    // Set visible feature types, excluding 'source' by default
    const newFeatureTypes = new Set(
      _.uniq(result.features.map((f) => f.type)).filter((type) => type.toLowerCase() !== 'source')
    );
    setVisibleFeatureTypes(newFeatureTypes);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await inputHandler.handleFileUpload(file);
      setSequence(await file.text());
      updatePlasmidData(result);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse GenBank file. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedRegion({
      start: feature.start,
      end: feature.end - 1,
    });
  };

  const handleLinearViewerMouseDown = (position: number, isTranslationLabel: boolean = false) => {
    selectionHandler.handleSelectionStart(position, isTranslationLabel);
  };

  const handleLinearViewerMouseMove = (position: number) => {
    if (!selectionHandler.isSelecting()) return;
    const newSelection = selectionHandler.handleSelectionMove(position);
    if (newSelection) {
      setSelectedRegion(newSelection);
    }
  };

  const handleMouseUp = () => {
    selectionHandler.handleSelectionEnd();
  };

  return {
    // State
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
    // Services
    geometry,
    selectionHandler,
    clipboardManager,
    colorManager,
    // Event handlers
    handleFileUpload,
    handleFeatureClick,
    handleLinearViewerMouseDown,
    handleLinearViewerMouseMove,
    handleMouseUp,
    plasmidDefinition,
  };
}
