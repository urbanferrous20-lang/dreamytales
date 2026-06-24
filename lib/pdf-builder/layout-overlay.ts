/**
 * Experimental overlay layout: full-bleed illustration with readable text band on the image.
 * Used for sample PDFs before switching production assembly.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import {
  COLORS,
  STORY_PAGE,
  drawCoverPage,
  drawWrappedText,
  type StoryPageInput,
} from "./layout";

/** Overlay text — slightly larger for phone reading on photographic backgrounds */
export const OVERLAY_TEXT = {
  fontSize: 16,
  lineHeight: 23,
  pageNumberSize: 10,
  paddingX: 14,
  paddingY: 14,
  minOverlayShare: 0.3,
  maxOverlayShare: 0.46,
} as const;

function estimateOverlayHeight(
  text: string,
  font: PDFFont,
  maxWidth: number,
  innerH: number
): number {
  const { fontSize, lineHeight, paddingY, minOverlayShare, maxOverlayShare } = OVERLAY_TEXT;
  let lines = 1;
  let line = "";

  for (const word of text.split(" ")) {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
      lines++;
      line = word;
    } else {
      line = testLine;
    }
  }

  const textBlock = lines * lineHeight + paddingY * 2;
  const minH = innerH * minOverlayShare;
  const maxH = innerH * maxOverlayShare;
  return Math.min(Math.max(textBlock, minH), maxH);
}

function drawImageCover(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument["addPage"]>,
  imageBytes: Buffer,
  x: number,
  y: number,
  w: number,
  h: number
) {
  return pdfDoc
    .embedPng(imageBytes)
    .catch(() => pdfDoc.embedJpg(imageBytes))
    .then((image) => {
      const dims = image.scale(1);
      const scale = Math.max(w / dims.width, h / dims.height);
      const drawW = dims.width * scale;
      const drawH = dims.height * scale;
      page.drawImage(image, {
        x: x + (w - drawW) / 2,
        y: y + (h - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    });
}

export async function drawStoryPageOverlay(
  pdfDoc: PDFDocument,
  fonts: { body: PDFFont; bold: PDFFont },
  params: {
    page: StoryPageInput;
    totalPages: number;
    imageBytes?: Buffer;
    variant?: "dark" | "light";
  }
) {
  const pdfPage = pdfDoc.addPage([STORY_PAGE.width, STORY_PAGE.height]);
  const { width, height, margin } = STORY_PAGE;
  const variant = params.variant ?? "dark";
  const isNight = params.page.pageNumber >= params.totalPages - 2;

  const innerX = margin;
  const innerY = margin;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;

  pdfPage.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.navy });

  if (params.imageBytes) {
    try {
      await drawImageCover(pdfDoc, pdfPage, params.imageBytes, innerX, innerY, innerW, innerH);
    } catch {
      pdfPage.drawRectangle({ x: innerX, y: innerY, width: innerW, height: innerH, color: COLORS.navyMid });
    }
  } else {
    pdfPage.drawRectangle({ x: innerX, y: innerY, width: innerW, height: innerH, color: COLORS.navyMid });
  }

  const textMaxWidth = innerW - OVERLAY_TEXT.paddingX * 2 - 24;
  const overlayH = estimateOverlayHeight(params.page.text, fonts.body, textMaxWidth, innerH);
  const overlayY = innerY;

  const useLightBand = variant === "light" && !isNight;
  const bandColor = useLightBand ? rgb(0.98, 0.97, 0.94) : rgb(0.06, 0.08, 0.14);
  const bandOpacity = useLightBand ? 0.92 : isNight ? 0.88 : 0.84;
  const textColor = useLightBand ? COLORS.text : COLORS.textLight;
  const accentColor = useLightBand ? COLORS.gold : COLORS.goldLight;

  pdfPage.drawRectangle({
    x: innerX,
    y: overlayY,
    width: innerW,
    height: overlayH,
    color: bandColor,
    opacity: bandOpacity,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: overlayY + overlayH - 3,
    width: innerW,
    height: 3,
    color: accentColor,
    opacity: 0.95,
  });

  drawWrappedText(
    pdfPage,
    params.page.text,
    innerX + OVERLAY_TEXT.paddingX,
    overlayY + overlayH - OVERLAY_TEXT.paddingY - OVERLAY_TEXT.fontSize,
    textMaxWidth,
    fonts.body,
    OVERLAY_TEXT.fontSize,
    OVERLAY_TEXT.lineHeight,
    textColor
  );

  const badgeR = 11;
  const badgeX = innerX + innerW - badgeR - 6;
  const badgeY = innerY + innerH - badgeR - 6;
  pdfPage.drawCircle({
    x: badgeX,
    y: badgeY,
    size: badgeR,
    color: accentColor,
    opacity: 0.95,
  });

  const numStr = `${params.page.pageNumber}`;
  const numW = fonts.bold.widthOfTextAtSize(numStr, OVERLAY_TEXT.pageNumberSize);
  pdfPage.drawText(numStr, {
    x: badgeX - numW / 2,
    y: badgeY - 3,
    size: OVERLAY_TEXT.pageNumberSize,
    font: fonts.bold,
    color: useLightBand ? COLORS.text : COLORS.navy,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: innerY,
    width: innerW,
    height: innerH,
    borderColor: accentColor,
    borderWidth: 2,
    opacity: 0.35,
  });
}

export async function assembleStoryPdfOverlay(params: {
  title: string;
  childName: string;
  pages: StoryPageInput[];
  loadImage?: (pageNumber: number) => Promise<Buffer | undefined>;
  variant?: "dark" | "light";
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const body = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fonts = { body, bold };

  await drawCoverPage(pdfDoc, { display: body, bold }, {
    title: params.title,
    childName: params.childName,
  });

  for (const page of params.pages) {
    const imageBytes = params.loadImage ? await params.loadImage(page.pageNumber) : undefined;
    await drawStoryPageOverlay(pdfDoc, fonts, {
      page,
      totalPages: params.pages.length,
      imageBytes,
      variant: params.variant,
    });
  }

  return pdfDoc.save();
}
