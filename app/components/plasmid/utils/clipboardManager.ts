import { Feature } from '../types';

export interface ClipboardManager {
    copySequence(sequence: string, start: number, end: number, length: number, features: Feature[]): void;
}

export class CircularClipboardManager implements ClipboardManager {
    private feedbackTimeout: number | null = null;

    constructor(private onCopyComplete?: () => void) {}

    private findTranslationFeature(start: number, end: number, features: Feature[]): Feature | null {
        // Look for any translation feature that overlaps with our selection
        return features.find(f => 
            f.type === 'translation' && 
            start >= f.start && 
            end <= f.end
        ) || null;
    }

    private snapToCodonBoundaries(start: number, end: number, feature: Feature): { start: number; end: number } {
        // Calculate codon positions relative to feature start
        const relativeStart = start - feature.start;
        const relativeEnd = end - feature.start;
        
        // Snap to nearest codon boundaries
        const codonStart = feature.start + (Math.floor(relativeStart / 3) * 3);
        const codonEnd = feature.start + (Math.ceil((relativeEnd + 1) / 3) * 3) - 1;
        
        return {
            start: codonStart,
            end: Math.min(codonEnd, feature.end)
        };
    }

    private getSequenceSegment(sequence: string, start: number, end: number, length: number, features: Feature[]): string {
        // Check if this selection corresponds to a translation feature
        const translationFeature = this.findTranslationFeature(start, end, features);
        
        if (translationFeature) {
            // Snap to codon boundaries for translation features
            const { start: codonStart, end: codonEnd } = this.snapToCodonBoundaries(start, end, translationFeature);
            start = codonStart;
            end = codonEnd;
        }

        // Normalize positions (keep 0-indexed for internal calculations)
        const startIndex = start % length;
        const endIndex = (end + 1) % length; // Add 1 to make the selection inclusive

        // Calculate both possible distances
        const directDistance = (endIndex - startIndex + length) % length;
        const complementDistance = length - directDistance;

        if (complementDistance < directDistance) {
            // Selection crosses origin - take the complement path
            return sequence.substring(startIndex) + sequence.substring(0, endIndex);
        } else {
            // Normal selection or equal distances
            if (startIndex <= endIndex) {
                return sequence.substring(startIndex, endIndex);
            } else {
                return sequence.substring(startIndex) + sequence.substring(0, endIndex);
            }
        }
    }

    copySequence(sequence: string, start: number, end: number, length: number, features: Feature[]): void {
        const seq = this.getSequenceSegment(sequence, start, end, length, features);
        
        // Use the new Clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(seq).then(() => {
                this.onCopyComplete?.();
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = seq;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                this.onCopyComplete?.();
            } catch (err) {
                console.error('Failed to copy sequence:', err);
            }

            document.body.removeChild(textArea);
        }
    }
} 