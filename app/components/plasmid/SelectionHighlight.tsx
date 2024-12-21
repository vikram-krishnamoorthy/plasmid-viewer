import React from 'react';
import { SelectedRegion } from './types';

interface SelectionHighlightProps {
    selectionPath: string;
}

export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({ selectionPath }) => {
    return (
        <path
            d={selectionPath}
            fill="none"
            stroke="#FFD700"
            strokeWidth="8"
            opacity="0.5"
        />
    );
}; 