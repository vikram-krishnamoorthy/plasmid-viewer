import { Feature } from '../types';
import { AnnotationDimensions, TrackAssignmentResult } from './types';

export const calculateAnnotationDimensions = (
    feature: Feature,
    lineStart: number,
    basesPerLine: number,
    charWidth: number
): AnnotationDimensions => {
    const featureStart = Math.max(0, feature.start - lineStart);
    const featureEnd = Math.min(basesPerLine, feature.end - lineStart);
    return {
        startX: featureStart * charWidth,
        width: (featureEnd - featureStart) * charWidth
    };
};

export const calculateTrackY = (
    track: number,
    maxTracks: number,
    trackHeight: number,
    spacing: number = 2
): number => {
    const invertedTrack = maxTracks - 1 - track;
    return invertedTrack * (trackHeight + spacing);
};

export const doFeaturesOverlap = (
    f1: Feature,
    f2: Feature,
    plasmidLength: number
): boolean => {
    const f1End = f1.end < f1.start ? f1.end + plasmidLength : f1.end;
    const f2End = f2.end < f2.start ? f2.end + plasmidLength : f2.end;
    return f1.start <= f2End && f2.start <= f1End;
};

export const getFeatureSize = (feature: Feature, plasmidLength: number): number => {
    return feature.end < feature.start
        ? (plasmidLength - feature.start) + feature.end
        : feature.end - feature.start;
};

export const hasTrackPriority = (
    f1: Feature,
    f2: Feature,
    plasmidLength: number
): boolean => {
    const size1 = getFeatureSize(f1, plasmidLength);
    const size2 = getFeatureSize(f2, plasmidLength);

    // If sizes are different, larger size wins
    if (size1 !== size2) {
        return size1 > size2;
    }

    // If sizes are equal, translations win
    if (f1.type === 'translation' && f2.type !== 'translation') return true;
    if (f1.type !== 'translation' && f2.type === 'translation') return false;

    // If everything is equal, maintain stable ordering using IDs
    return f1.id < f2.id;
};

export const assignTracks = (
    features: Feature[],
    visibleFeatureTypes: Set<string>,
    plasmidLength: number,
    maxTracks: number
): TrackAssignmentResult => {
    const trackAssignments = new Map<string, number>();
    let maxTrackUsed = 0;

    // Start all features at track 0
    features.forEach(feature => {
        if (visibleFeatureTypes.has(feature.type)) {
            trackAssignments.set(feature.id, 0);
        }
    });

    let hasOverlaps = true;
    let currentTrack = 0;

    while (hasOverlaps && currentTrack < maxTracks) {
        hasOverlaps = false;

        // Get all features in current track
        const featuresInTrack = features.filter(f =>
            trackAssignments.get(f.id) === currentTrack
        );

        // Check each pair of features in this track for overlaps
        for (let i = 0; i < featuresInTrack.length; i++) {
            for (let j = i + 1; j < featuresInTrack.length; j++) {
                const f1 = featuresInTrack[i];
                const f2 = featuresInTrack[j];

                if (doFeaturesOverlap(f1, f2, plasmidLength)) {
                    hasOverlaps = true;
                    // Move the lower priority feature up one track
                    const featureToMove = hasTrackPriority(f1, f2, plasmidLength) ? f2 : f1;
                    trackAssignments.set(featureToMove.id, currentTrack + 1);
                    maxTrackUsed = Math.max(maxTrackUsed, currentTrack + 1);
                }
            }
        }

        currentTrack++;
    }

    return { trackAssignments, maxTrackUsed };
}; 