export interface Feature {
    type: string;
    start: number;
    end: number;
    complement: boolean;
    label: string;
    color: string;
}

export interface SelectedRegion {
    start: number;
    end: number;
}

export interface LabelPosition {
    feature: Feature;
    midAngle: number;
    featureX: number;
    featureY: number;
    labelX: number;
    labelY: number;
    rotation: number;
    textAnchor: string;
}

export interface FeaturePath {
    path: string;
    arrow: string;
} 