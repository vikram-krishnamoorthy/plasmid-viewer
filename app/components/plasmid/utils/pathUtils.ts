import { TWO_PI, PLASMID_CONSTANTS, angleToCoords } from './constants';

export const createFeaturePath = (
  startAngle: number,
  endAngle: number,
  radius: number,
  _isComplement: boolean
): string => {
  // Normalize angles
  const actualStartAngle = startAngle;
  let actualEndAngle = endAngle;
  if (actualEndAngle < actualStartAngle) {
    actualEndAngle += TWO_PI;
  }

  // Calculate path radii
  const outerRadius = radius + PLASMID_CONSTANTS.PATH_WIDTH / 2;
  const innerRadius = radius - PLASMID_CONSTANTS.PATH_WIDTH / 2;

  // Calculate main arc points
  const outerStart = angleToCoords(actualStartAngle, outerRadius);
  const outerEnd = angleToCoords(actualEndAngle, outerRadius);
  const innerStart = angleToCoords(actualStartAngle, innerRadius);
  const innerEnd = angleToCoords(actualEndAngle, innerRadius);

  const largeArc = actualEndAngle - actualStartAngle > Math.PI ? 1 : 0;

  return `M ${outerStart.x} ${outerStart.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
            Z`;
};
