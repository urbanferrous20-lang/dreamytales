/** Public Meta Pixel ID — safe to expose in the browser. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

export function metaPixelEnabled(): boolean {
  return META_PIXEL_ID.length > 0;
}
