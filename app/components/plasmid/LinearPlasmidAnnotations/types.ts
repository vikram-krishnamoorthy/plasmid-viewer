import { Feature } from '../types';

export interface AnnotationTrackAssignment {
    trackNumber: number;
    y: number;
}

export interface AnnotationDimensions {
    startX: number;
    width: number;
}

export interface TrackAssignmentResult {
    trackAssignments: Map<string, number>;
    maxTrackUsed: number;
}

export interface FeatureOverlap {
    feature1: Feature;
    feature2: Feature;
} 