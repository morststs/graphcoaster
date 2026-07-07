export const MATH_MIN = -10;
export const MATH_MAX = 10;
export const MATH_RANGE = MATH_MAX - MATH_MIN;

export function toPixel(mathX: number, mathY: number, width: number, height: number) {
  return {
    px: ((mathX - MATH_MIN) / MATH_RANGE) * width,
    py: ((MATH_MAX - mathY) / MATH_RANGE) * height,
  };
}

export function toMath(pixelX: number, pixelY: number, width: number, height: number) {
  return {
    x: (pixelX / width) * MATH_RANGE + MATH_MIN,
    y: MATH_MAX - (pixelY / height) * MATH_RANGE,
  };
}
