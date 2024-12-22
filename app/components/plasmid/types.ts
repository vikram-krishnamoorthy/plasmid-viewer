export interface Feature {
    id: string;
    type: string;
    start: number;
    end: number;
    complement: boolean;
    label: string;
    color: string;
    translation?: string;
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
    radialX: number;
    radialY: number;
    labelX: number;
    labelY: number;
    rotation: number;
    textAnchor: string;
    radius: number;
    plasmidLength: number;
}

export interface FeaturePath {
    path: string;
    arrow: string;
} 