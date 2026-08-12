import { createElement, type ReactElement } from 'react';

type Props = {
  d: string;
  size?: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
};

/**
 * Web: DOM SVG без react-native-svg.
 * В webpack/metro web пакет падает на extensionless-импорте Matrix2D.
 */
export function IconPath({
  d,
  size = 21,
  color,
  strokeWidth = 1.8,
  fill = 'none',
}: Props): ReactElement {
  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: fill === 'none' ? 'none' : fill,
      xmlns: 'http://www.w3.org/2000/svg',
      style: { display: 'block' },
    },
    createElement('path', {
      d,
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      fill: fill === 'none' ? 'none' : fill,
    }),
  );
}
