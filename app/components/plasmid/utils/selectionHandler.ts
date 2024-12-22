import { ViewerGeometry } from './geometry';
import { SelectedRegion, Feature } from '../types';

export interface SelectionHandler {
    mouseToPosition(e: React.MouseEvent<SVGSVGElement>, svg: SVGSVGElement | null): number;
    handleSelectionStart(position: number, isTranslationLabel?: boolean): void;
    handleSelectionMove(position: number): SelectedRegion | null;
    handleSelectionEnd(): void;
    isSelecting(): boolean;
}

export class CircularSelectionHandler implements SelectionHandler {
    private isDragging: boolean = false;
    private dragStart: number | null = null;
    private initialFeature: Feature | null = null;
    private currentSelection: SelectedRegion | null = null;
    private features: Feature[] = [];
    private isSelectingTranslation: boolean = false;

    constructor(
        private geometry: ViewerGeometry,
        private plasmidLength: number,
        private onSelectionChange: (selection: SelectedRegion | null) => void
    ) { }

    setFeatures(features: Feature[]) {
        this.features = features;
    }

    private findTranslationFeature(position: number): Feature | null {
        return this.features.find(f =>
            f.type === 'translation' &&
            position >= f.start &&
            position <= f.end
        ) || null;
    }

    private snapToCodonBoundaries(start: number, end: number, feature: Feature): { start: number; end: number } {
        const relativeStart = start - feature.start;
        const relativeEnd = end - feature.start;

        const codonStart = feature.start + (Math.floor(relativeStart / 3) * 3);
        const codonEnd = feature.start + (Math.ceil((relativeEnd + 1) / 3) * 3) - 1;

        return {
            start: codonStart,
            end: Math.min(codonEnd, feature.end)
        };
    }

    mouseToPosition(e: React.MouseEvent<SVGSVGElement>, svg: SVGSVGElement | null): number {
        if (!svg) return 0;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return 0;

        const svgP = pt.matrixTransform(matrix.inverse());
        return this.geometry.positionToCoords({ x: svgP.x, y: svgP.y }, this.plasmidLength);
    }

    handleSelectionStart(position: number, isTranslationLabel: boolean = false): void {
        this.isSelectingTranslation = isTranslationLabel;

        if (isTranslationLabel) {
            const feature = this.findTranslationFeature(position);
            if (feature) {
                this.initialFeature = feature;
                position = this.snapToCodonBoundaries(position, position, feature).start;
            }
        }

        this.dragStart = position;
        this.isDragging = true;
        this.currentSelection = null;
        this.onSelectionChange(null);
    }

    handleSelectionMove(position: number): SelectedRegion | null {
        if (!this.isDragging || this.dragStart === null) return null;

        if (this.isSelectingTranslation && this.initialFeature) {
            const start = Math.min(this.dragStart, position);
            const end = Math.max(this.dragStart, position);
            const snapped = this.snapToCodonBoundaries(start, end, this.initialFeature);
            return snapped;
        }

        position = ((position % this.plasmidLength) + this.plasmidLength) % this.plasmidLength;
        const start = this.dragStart % this.plasmidLength;

        const clockwiseDistance = position >= start
            ? position - start
            : this.plasmidLength - start + position;
            
        const counterclockwiseDistance = position >= start
            ? this.plasmidLength - position + start
            : start - position;

        if (clockwiseDistance <= counterclockwiseDistance) {
            return {
                start,
                end: position >= start ? position : position
            };
        } else {
            return {
                start: position,
                end: start
            };
        }
    }

    handleSelectionEnd(): void {
        this.isDragging = false;
        this.dragStart = null;
        this.initialFeature = null;
        this.isSelectingTranslation = false;
    }

    isSelecting(): boolean {
        return this.isDragging;
    }
} 