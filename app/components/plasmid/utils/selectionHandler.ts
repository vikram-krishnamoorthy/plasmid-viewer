import { ViewerGeometry } from './geometry';
import { SelectedRegion } from '../types';

export interface SelectionHandler {
    mouseToPosition(e: React.MouseEvent<SVGSVGElement>, svg: SVGSVGElement | null): number;
    handleSelectionStart(position: number): void;
    handleSelectionMove(position: number): SelectedRegion | null;
    handleSelectionEnd(): void;
    isSelecting(): boolean;
}

export class CircularSelectionHandler implements SelectionHandler {
    private isDragging: boolean = false;
    private dragStart: number | null = null;
    private currentSelection: SelectedRegion | null = null;

    constructor(
        private geometry: ViewerGeometry,
        private plasmidLength: number,
        private onSelectionChange: (selection: SelectedRegion | null) => void
    ) {}

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

    handleSelectionStart(position: number): void {
        this.dragStart = position;
        this.isDragging = true;
        this.currentSelection = null;
        this.onSelectionChange(null);
    }

    handleSelectionMove(position: number): SelectedRegion | null {
        if (!this.isDragging || this.dragStart === null) return null;

        const distance = Math.abs(position - this.dragStart);
        const complementDistance = this.plasmidLength - distance;
        
        let start: number, end: number;
        
        if (distance <= complementDistance) {
            start = Math.min(this.dragStart, position);
            end = Math.max(this.dragStart, position);
        } else {
            if (position > this.dragStart) {
                start = position;
                end = this.dragStart;
            } else {
                start = this.dragStart;
                end = position;
            }
        }

        this.currentSelection = { start, end };
        this.onSelectionChange(this.currentSelection);
        return this.currentSelection;
    }

    handleSelectionEnd(): void {
        this.isDragging = false;
        this.dragStart = null;
    }

    isSelecting(): boolean {
        return this.isDragging;
    }
} 