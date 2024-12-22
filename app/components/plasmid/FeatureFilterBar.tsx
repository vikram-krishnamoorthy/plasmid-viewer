import React from 'react';
import { ColorManager } from './utils/featureColorManager';

interface FeatureFilterBarProps {
    featureTypes: string[];
    visibleFeatureTypes: Set<string>;
    colorManager: ColorManager;
    onToggleFeature: (type: string) => void;
}

export const FeatureFilterBar: React.FC<FeatureFilterBarProps> = ({
    featureTypes,
    visibleFeatureTypes,
    colorManager,
    onToggleFeature,
}) => {
    return (
        <div className="bg-gray-50 py-3">
            <div className="flex items-center gap-4">
                <span className="font-semibold pl-4">View/Hide Features:</span>
                <div className="flex">
                    {featureTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => onToggleFeature(type)}
                            className="px-3 py-1.5 text-sm font-medium border-r last:border-r-0 transition-colors"
                            style={{
                                backgroundColor: visibleFeatureTypes.has(type) ? colorManager.getFeatureColor(type) : 'transparent',
                                color: visibleFeatureTypes.has(type) ? 'white' : 'inherit',
                                borderColor: colorManager.getFeatureColor(type)
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}; 