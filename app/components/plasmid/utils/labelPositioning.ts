import _ from 'lodash';
import { Feature, LabelPosition } from '../types';
import { PLASMID_CONSTANTS, coordsToAngle, angleToCoords } from './constants';

export interface LabelPositioner {
  calculateLabelPositions(
    features: Feature[],
    visibleFeatureTypes: Set<string>,
    plasmidLength: number
  ): LabelPosition[];
}

export class CircularLabelPositioner implements LabelPositioner {
  private getFeatureRadius(
    feature: Feature,
    sortedFeatures: Feature[],
    plasmidLength: number
  ): number {
    const baseRadius = PLASMID_CONSTANTS.FEATURE_BASE_RADIUS;
    const NEARBY_THRESHOLD = 10; // bases

    // Find features that overlap with this one
    const overlappingFeatures = sortedFeatures.filter((f) => {
      if (f.id === feature.id) return false;

      // Handle circular plasmid wrapping
      const start1 = feature.start;
      let end1 = feature.end;
      const start2 = f.start;
      let end2 = f.end;

      // Normalize positions for circular comparison
      if (end1 < start1) end1 += plasmidLength;
      if (end2 < start2) end2 += plasmidLength;

      // Check if features overlap or are within threshold
      const overlapStart = Math.max(start1, start2);
      const overlapEnd = Math.min(end1, end2);

      return overlapEnd - overlapStart + NEARBY_THRESHOLD >= 0;
    });

    if (overlappingFeatures.length === 0) return baseRadius;

    // Calculate the size of this feature
    const featureSize =
      feature.end > feature.start
        ? feature.end - feature.start
        : plasmidLength - feature.start + feature.end;

    // Count how many larger features this one is contained within
    const containingFeatures = overlappingFeatures.filter((f) => {
      const otherSize = f.end > f.start ? f.end - f.start : plasmidLength - f.start + f.end;

      // Check if this feature is fully contained within the other feature
      const start1 = feature.start;
      let end1 = feature.end;
      const start2 = f.start;
      let end2 = f.end;

      // Normalize positions for circular comparison
      if (end1 < start1) end1 += plasmidLength;
      if (end2 < start2) end2 += plasmidLength;

      return otherSize > featureSize && start1 >= start2 && end1 <= end2;
    });

    // Move feature inward based on how many features contain it
    return baseRadius - containingFeatures.length * 15;
  }

  calculateLabelPositions(
    features: Feature[],
    visibleFeatureTypes: Set<string>,
    plasmidLength: number
  ): LabelPosition[] {
    const visibleFeatures = features.filter((f) => visibleFeatureTypes.has(f.type));

    // Sort features by size (largest first) and then by start position
    const sortedFeatures = _.orderBy(
      visibleFeatures,
      [(feature) => Math.abs(feature.end - feature.start), 'start'],
      ['desc', 'asc']
    );

    let labels = sortedFeatures.map((feature) => {
      const radius = this.getFeatureRadius(feature, sortedFeatures, plasmidLength);
      const midAngle = coordsToAngle((feature.start + feature.end) / 2, plasmidLength);

      // Calculate feature point on the arc
      const featureCoords = angleToCoords(midAngle, radius);

      // Calculate the perpendicular point extending from the circle
      const radialPoint = angleToCoords(midAngle, PLASMID_CONSTANTS.LABEL_RADIUS);

      // Determine if label should be on left or right side
      const isRightSide = radialPoint.x > PLASMID_CONSTANTS.CENTER;
      const labelOffset = PLASMID_CONSTANTS.LABEL_OFFSET;

      // Calculate final label position
      const labelX = isRightSide ? radialPoint.x + labelOffset : radialPoint.x - labelOffset;

      return {
        feature,
        midAngle,
        featureX: featureCoords.x,
        featureY: featureCoords.y,
        radialX: radialPoint.x,
        radialY: radialPoint.y,
        labelX,
        labelY: radialPoint.y,
        rotation: 0,
        textAnchor: isRightSide ? 'start' : 'end',
        radius,
        plasmidLength,
      };
    });

    // Sort labels by Y position for overlap prevention
    labels = _.sortBy(labels, 'labelY');

    // Adjust overlapping labels
    for (let i = 1; i < labels.length; i++) {
      const prevLabel = labels[i - 1];
      const currentLabel = labels[i];

      if (Math.abs(currentLabel.labelY - prevLabel.labelY) < PLASMID_CONSTANTS.MIN_LABEL_SPACING) {
        currentLabel.labelY = prevLabel.labelY + PLASMID_CONSTANTS.MIN_LABEL_SPACING;
        currentLabel.radialY = currentLabel.labelY;
      }
    }

    return labels;
  }
}
