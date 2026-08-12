import Svg, { Path } from 'react-native-svg';

type Props = {
  d: string;
  size?: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
};

/** Линейная иконка из path прототипа (viewBox 0 0 24 24). */
export function IconPath({
  d,
  size = 21,
  color,
  strokeWidth = 1.8,
  fill = 'none',
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill === 'none' ? 'none' : fill}
      />
    </Svg>
  );
}
