export interface ClipboardManager {
    copySequence(sequence: string, start: number, end: number, length: number): void;
    showCopyFeedback(): void;
}

export class CircularClipboardManager implements ClipboardManager {
    private feedbackTimeout: number | null = null;

    constructor(private onCopyComplete?: () => void) {}

    private getSequenceSegment(sequence: string, start: number, end: number, length: number): string {
        // Normalize positions (keep 0-indexed for internal calculations)
        const startIndex = start % length;
        const endIndex = end % length;

        // Calculate both possible distances (inclusive)
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

    copySequence(sequence: string, start: number, end: number, length: number): void {
        const seq = this.getSequenceSegment(sequence, start, end, length);
        
        // Use the new Clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(seq).then(() => {
                this.showCopyFeedback();
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
                this.showCopyFeedback();
                this.onCopyComplete?.();
            } catch (err) {
                console.error('Failed to copy sequence:', err);
            }

            document.body.removeChild(textArea);
        }
    }

    showCopyFeedback(): void {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.textContent = 'Sequence copied!';
        feedbackDiv.style.position = 'fixed';
        feedbackDiv.style.bottom = '20px';
        feedbackDiv.style.left = '50%';
        feedbackDiv.style.transform = 'translateX(-50%)';
        feedbackDiv.style.backgroundColor = '#4CAF50';
        feedbackDiv.style.color = 'white';
        feedbackDiv.style.padding = '10px 20px';
        feedbackDiv.style.borderRadius = '5px';
        feedbackDiv.style.zIndex = '1000';

        document.body.appendChild(feedbackDiv);

        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }

        this.feedbackTimeout = window.setTimeout(() => {
            document.body.removeChild(feedbackDiv);
            this.feedbackTimeout = null;
        }, 2000);
    }
} 