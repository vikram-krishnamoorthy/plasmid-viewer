import { Feature } from '../types';
import { PLASMID_CONSTANTS } from '../utils/constants';

const TRACK_SPACING = 15; // Space between tracks
const INITIAL_RADIUS_OFFSET = 30; // Distance from backbone to first track

export const calculateFeatureRadius = (
    track: number,
    _maxTracks: number
): number => {
    // Start from an offset inside the backbone radius and go inward
    return PLASMID_CONSTANTS.BACKBONE_RADIUS - INITIAL_RADIUS_OFFSET - (track * TRACK_SPACING);
};

export const doFeaturesOverlap = (
    f1: Feature,
    f2: Feature,
    plasmidLength: number
): boolean => {
    // Handle features that cross the origin
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

    // If sizes are equal, translations lose (opposite of linear viewer)
    if (f1.type === 'translation' && f2.type !== 'translation') return false;
    if (f1.type !== 'translation' && f2.type === 'translation') return true;

    // If everything is equal, maintain stable ordering using IDs
    return f1.id < f2.id;
};

export const assignCircularTracks = (
    features: Feature[],
    visibleFeatureTypes: Set<string>,
    plasmidLength: number,
    _maxTracks: number
): Map<string, number> => {
    const trackAssignments = new Map<string, number>();

    // Start all features at track 0 (outermost)
    features.forEach(feature => {
        if (visibleFeatureTypes.has(feature.type)) {
            trackAssignments.set(feature.id, 0);
        }
    });

    let hasOverlaps = true;
    let currentTrack = 0;

    while (hasOverlaps && currentTrack < _maxTracks) {
        hasOverlaps = false;

        const featuresInTrack = features.filter(f =>
            trackAssignments.get(f.id) === currentTrack
        );

        for (let i = 0; i < featuresInTrack.length; i++) {
            for (let j = i + 1; j < featuresInTrack.length; j++) {
                const f1 = featuresInTrack[i];
                const f2 = featuresInTrack[j];

                if (doFeaturesOverlap(f1, f2, plasmidLength)) {
                    hasOverlaps = true;
                    // Move the lower priority feature to inner track
                    const featureToMove = hasTrackPriority(f1, f2, plasmidLength) ? f2 : f1;
                    trackAssignments.set(featureToMove.id, currentTrack + 1);
                }
            }
        }

        currentTrack++;
    }

    return trackAssignments;
}; 