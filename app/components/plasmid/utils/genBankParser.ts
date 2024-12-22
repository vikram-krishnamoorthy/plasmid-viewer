import { Feature } from '../types';

export interface SequenceParser {
    parse(input: string): {
        features: Feature[];
        name: string;
        definition: string;
        length: number;
        sequence: string;
    };
}

export class GenBankParser implements SequenceParser {
    private cleanSequenceLine(line: string): string {
        return line.replace(/^\s*\d+\s+/, '').replace(/\s+/g, '').toUpperCase();
    }

    private parseFeatureLocation(location: string): { start: number; end: number; complement: boolean } {
        let start = 0;
        let end = 0;
        let complement = false;

        if (location.includes('complement')) {
            complement = true;
            const matches = location.match(/\d+/g);
            if (matches) {
                start = parseInt(matches[0]);
                end = parseInt(matches[1] || matches[0]);
            }
        } else {
            const matches = location.match(/\d+/g);
            if (matches) {
                start = parseInt(matches[0]);
                end = parseInt(matches[1] || matches[0]);
            }
        }

        return { start, end, complement };
    }

    parse(input: string) {
        const features: Feature[] = [];
        let featureCounter = 0;
        const lines = input.split('\n');
        let currentFeature: Feature | null = null;
        let inFeatures = false;
        let inSequence = false;
        let name = '';
        let seqLength = 0;
        let sequence = '';
        let definition = '';

        lines.forEach(line => {
            if (line.startsWith('LOCUS')) {
                const matches = line.match(/^LOCUS\s+(\S+)\s+(\d+)/);
                if (matches) {
                    name = matches[1];
                    seqLength = parseInt(matches[2]);
                }
            }

            if (line.startsWith('FEATURES')) {
                inFeatures = true;
                return;
            }

            if (line.startsWith('ORIGIN')) {
                inFeatures = false;
                inSequence = true;
                return;
            }

            if (inSequence && !line.startsWith('//')) {
                const seqLine = this.cleanSequenceLine(line);
                if (seqLine.match(/^[ATCG]+$/)) {
                    sequence += seqLine;
                }
            }

            if (inFeatures) {
                if (line.match(/^\s{5}\w/)) {
                    if (currentFeature) {
                        features.push(currentFeature);
                    }
                    const [type, location] = line.trim().split(/\s+/);
                    const { start, end, complement } = this.parseFeatureLocation(location);

                    currentFeature = {
                        id: `feature-${featureCounter++}`,
                        type,
                        start,
                        end,
                        complement,
                        label: '',
                        color: '#BDC3C7'
                    };
                } else if (line.match(/^\s{21}/) && currentFeature) {
                    const qualifier = line.trim();
                    if (qualifier.startsWith('/label=')) {
                        currentFeature.label = qualifier.split('=')[1].replace(/["']/g, '');
                    } else if (!currentFeature.label && qualifier.startsWith('/note=')) {
                        currentFeature.label = qualifier.split('=')[1].replace(/["']/g, '');
                    }
                }
            }
        });

        if (currentFeature) {
            features.push(currentFeature);
        }

        const definitionMatch = input.match(/DEFINITION\s+(.*?)(?=\n\w+\s+|$)/s);
        if (definitionMatch) {
            definition = definitionMatch[1].trim().replace(/\n\s+/g, ' ');
        }

        return {
            features,
            name,
            definition,
            length: seqLength,
            sequence: sequence.toUpperCase()
        };
    }
} 