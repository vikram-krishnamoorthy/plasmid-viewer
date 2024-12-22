import { Feature } from '../types';

export interface ColorManager {
  generateColors(features: Feature[]): Record<string, string>;
  getFeatureColor(featureType: string): string;
  setFeatureColor(featureType: string, color: string): void;
}

export class FeatureColorManager implements ColorManager {
  private colorMap: Record<string, string> = {};
  private readonly defaultColor = '#BDC3C7';

  private generateDistinctColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      // Use HSL to generate evenly spaced colors with good saturation and lightness
      const hue = ((i * 360) / count) % 360;
      colors.push(`hsl(${hue}, 70%, 45%)`);
    }
    return colors;
  }

  generateColors(features: Feature[]): Record<string, string> {
    // Get unique feature types, excluding 'source'
    const types = new Set(
      features.map((f) => f.type).filter((type) => type.toLowerCase() !== 'source')
    );

    // Generate colors for unique feature types
    const uniqueTypes = Array.from(types);
    const colors = this.generateDistinctColors(uniqueTypes.length);

    // Create and store the color mapping
    this.colorMap = Object.fromEntries(uniqueTypes.map((type, index) => [type, colors[index]]));

    return this.colorMap;
  }

  getFeatureColor(featureType: string): string {
    return this.colorMap[featureType] || this.defaultColor;
  }

  setFeatureColor(featureType: string, color: string): void {
    this.colorMap[featureType] = color;
  }
}
