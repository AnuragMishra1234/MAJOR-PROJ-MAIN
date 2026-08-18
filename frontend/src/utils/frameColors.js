import frameColorsData from './frameColors.json';

export const FRAME_COUNT = 192;

export const getFramePath = (index) => {
  const frameNumber = Math.min(Math.max(1, index + 1), FRAME_COUNT);
  const padded = String(frameNumber).padStart(5, '0');
  return `/KB-FRAMES/${padded}.png`;
};

export const getFrameBgColor = (index) => {
  const safeIndex = Math.min(Math.max(0, index), FRAME_COUNT - 1);
  const rgb = frameColorsData[safeIndex] || [106, 109, 114];
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
};

export default frameColorsData;
