import { Feature } from '../types';
import type { SequenceParser } from './genBankParser';

export interface SequenceInputResult {
    features: Feature[];
    name: string;
    definition: string;
    length: number;
    sequence: string;
}

export interface SequenceInputHandler {
    handleFileUpload(file: File): Promise<SequenceInputResult>;
    handleTextInput(content: string): SequenceInputResult;
    isValidInput(content: string): boolean;
}

export class GenBankInputHandler implements SequenceInputHandler {
    constructor(private parser: SequenceParser) {}

    async handleFileUpload(file: File): Promise<SequenceInputResult> {
        try {
            const content = await this.readFile(file);
            if (!this.isValidInput(content)) {
                throw new Error('Invalid GenBank format');
            }
            return this.parser.parse(content);
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    handleTextInput(content: string): SequenceInputResult {
        if (!this.isValidInput(content)) {
            throw new Error('Invalid GenBank format');
        }
        return this.parser.parse(content);
    }

    isValidInput(content: string): boolean {
        // Basic validation for GenBank format
        return content.includes('LOCUS') && 
               content.includes('FEATURES') && 
               content.includes('ORIGIN');
    }

    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                resolve(content);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
} 