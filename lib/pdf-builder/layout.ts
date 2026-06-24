import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";

/** Compact storybook page — smaller than A4, less empty space */
export const STORY_PAGE = {
  width: 480,
  height: 640,
  margin: 16,
  border: 3,
} as const;

export const COLORS = {
  cream: rgb(0.98, 0.96, 0.91),
  navy: rgb(0.12, 0.16, 0.29),
  navyMid: rgb(0.18, 0.24, 0.42),
  gold: rgb(0.79, 0.66, 0.38),
  goldLight: rgb(0.91, 0.84, 0.65),
  lavender: rgb(0.91, 0.88, 0.96),
  moon: rgb(0.85, 0.9, 0.98),
  text: rgb(0.15, 0.18, 0.28),
  textLight: rgb(0.95, 0.94, 0.98),
} as const;

/** Story text band below illustration — tuned for phone PDF readers */
export const STORY_TEXT = {
  fontSize: 15,
  lineHeight: 22,
  pageNumberSize: 10,
  paddingX: 14,
  paddingY: 12,
  /** Gap between illustration and text band */
  imageTextGap: 4,
  /** Text band height caps (share of inner page height) */
  minTextBandShare: 0.14,
  maxTextBandShare: 0.38,
  imageShare: 0.5,
} as const;

export type StoryPageInput = {
  pageNumber: number;
  text: string;
  imagePath?: string;
};

function getPagePalette(pageNumber: number, totalPages: number) {
  const isNight = pageNumber >= totalPages - 2;
  if (isNight) {
    return {
      outer: COLORS.navyMid,
      inner: COLORS.navy,
      textPanel: rgb(0.22, 0.28, 0.45),
      textColor: COLORS.textLight,
      accent: COLORS.goldLight,
    };
  }
  const warm = pageNumber % 2 === 0;
  return {
    outer: COLORS.gold,
    inner: warm ? COLORS.cream : COLORS.moon,
    textPanel: warm ? COLORS.lavender : rgb(0.88, 0.93, 0.98),
    textColor: COLORS.text,
    accent: COLORS.gold,
  };
}

export function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
  lineHeight: number,
  color: ReturnType<typeof rgb>
): number {
  let line = "";
  let cursorY = y;

  for (const word of text.split(" ")) {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size: fontSize, font, color });
      line = word;
      cursorY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cursorY, size: fontSize, font, color });
    cursorY -= lineHeight;
  }
  return cursorY;
}

function drawPageFrame(
  page: PDFPage,
  palette: ReturnType<typeof getPagePalette>
) {
  const { width, height, margin, border } = STORY_PAGE;

  page.drawRectangle({ x: 0, y: 0, width, height, color: palette.outer });

  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    color: palette.inner,
  });

  page.drawRectangle({
    x: margin + border,
    y: margin + border,
    width: width - margin * 2 - border * 2,
    height: height - margin * 2 - border * 2,
    borderColor: palette.accent,
    borderWidth: 1.5,
    color: palette.inner,
  });
}

export async function drawCoverPage(
  pdfDoc: PDFDocument,
  fonts: { display: PDFFont; bold: PDFFont },
  params: { title: string; childName: string }
) {
  const page = pdfDoc.addPage([STORY_PAGE.width, STORY_PAGE.height]);
  const { width, height } = STORY_PAGE;

  page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.navy });

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: COLORS.gold,
    borderWidth: 2,
    color: rgb(0.16, 0.22, 0.38),
  });

  page.drawRectangle({
    x: 36,
    y: height * 0.52,
    width: width - 72,
    height: 2,
    color: COLORS.gold,
  });

  const titleSize = 22;
  const titleLines = wrapTitle(params.title, fonts.bold, titleSize, width - 80);
  let titleY = height * 0.58;
  for (const line of titleLines) {
    const lineW = fonts.bold.widthOfTextAtSize(line, titleSize);
    page.drawText(line, {
      x: (width - lineW) / 2,
      y: titleY,
      size: titleSize,
      font: fonts.bold,
      color: COLORS.goldLight,
    });
    titleY -= 28;
  }

  const subtitle = `A bedtime short story for ${params.childName}`;
  const subSize = 15;
  const subW = fonts.display.widthOfTextAtSize(subtitle, subSize);
  page.drawText(subtitle, {
    x: (width - subW) / 2,
    y: height * 0.38,
    size: subSize,
    font: fonts.display,
    color: COLORS.textLight,
  });

  const brand = "Dreamy Tales";
  const brandW = fonts.bold.widthOfTextAtSize(brand, 11);
  page.drawText(brand, {
    x: (width - brandW) / 2,
    y: 48,
    size: 11,
    font: fonts.bold,
    color: COLORS.gold,
  });

  page.drawCircle({
    x: width / 2,
    y: height - 64,
    size: 14,
    color: COLORS.goldLight,
  });
}

function wrapTitle(title: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function estimateTextBandHeight(
  text: string,
  font: PDFFont,
  maxWidth: number,
  innerH: number
): number {
  const { fontSize, lineHeight, paddingY, minTextBandShare, maxTextBandShare } = STORY_TEXT;
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
  const minH = innerH * minTextBandShare;
  const maxH = innerH * maxTextBandShare;
  return Math.min(Math.max(textBlock, minH), maxH);
}

async function drawImageContain(
  pdfDoc: PDFDocument,
  page: PDFPage,
  imageBytes: Buffer,
  x: number,
  y: number,
  w: number,
  h: number,
  backdrop: ReturnType<typeof rgb>
) {
  page.drawRectangle({ x, y, width: w, height: h, color: backdrop });
  const image = await pdfDoc.embedPng(imageBytes).catch(() => pdfDoc.embedJpg(imageBytes));
  const dims = image.scale(1);
  const scale = Math.min(w / dims.width, h / dims.height);
  const drawW = dims.width * scale;
  const drawH = dims.height * scale;
  page.drawImage(image, {
    x: x + (w - drawW) / 2,
    y: y + (h - drawH) / 2,
    width: drawW,
    height: drawH,
  });
}

async function drawImageCover(
  pdfDoc: PDFDocument,
  page: PDFPage,
  imageBytes: Buffer,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const image = await pdfDoc.embedPng(imageBytes).catch(() => pdfDoc.embedJpg(imageBytes));
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
}

/** Legacy split-panel layout (kept for layout comparison samples). */
export async function drawStoryPageClassic(
  pdfDoc: PDFDocument,
  fonts: { body: PDFFont; bold: PDFFont },
  params: {
    page: StoryPageInput;
    totalPages: number;
    imageBytes?: Buffer;
  }
) {
  const pdfPage = pdfDoc.addPage([STORY_PAGE.width, STORY_PAGE.height]);
  const { width, height, margin, border } = STORY_PAGE;
  const palette = getPagePalette(params.page.pageNumber, params.totalPages);

  drawPageFrame(pdfPage, palette);

  const innerX = margin + border + 6;
  const innerY = margin + border + 6;
  const innerW = width - (margin + border + 6) * 2;
  const innerH = height - (margin + border + 6) * 2;

  const imageHeight = Math.floor(innerH * STORY_TEXT.imageShare);
  const textPanelHeight = innerH - imageHeight - 8;
  const textPanelY = innerY;

  const imageBottom = innerY + textPanelHeight + 8;

  if (params.imageBytes) {
    try {
      const image = await pdfDoc.embedPng(params.imageBytes).catch(() =>
        pdfDoc.embedJpg(params.imageBytes!)
      );
      const imgDims = image.scale(1);
      const scale = Math.min(innerW / imgDims.width, imageHeight / imgDims.height);
      const w = imgDims.width * scale;
      const h = imgDims.height * scale;

      pdfPage.drawRectangle({
        x: innerX,
        y: imageBottom,
        width: innerW,
        height: imageHeight,
        color: palette.textPanel,
      });

      pdfPage.drawImage(image, {
        x: innerX + (innerW - w) / 2,
        y: imageBottom + (imageHeight - h) / 2,
        width: w,
        height: h,
      });
    } catch {
      pdfPage.drawRectangle({
        x: innerX,
        y: imageBottom,
        width: innerW,
        height: imageHeight,
        color: palette.textPanel,
      });
    }
  } else {
    pdfPage.drawRectangle({
      x: innerX,
      y: imageBottom,
      width: innerW,
      height: imageHeight,
      color: palette.textPanel,
    });
  }

  pdfPage.drawRectangle({
    x: innerX,
    y: textPanelY,
    width: innerW,
    height: textPanelHeight,
    color: palette.textPanel,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: textPanelY + textPanelHeight - 3,
    width: innerW,
    height: 3,
    color: palette.accent,
  });

  const textPadding = 12;
  drawWrappedText(
    pdfPage,
    params.page.text,
    innerX + textPadding,
    textPanelY + textPanelHeight - textPadding - STORY_TEXT.fontSize,
    innerW - textPadding * 2 - 28,
    fonts.body,
    STORY_TEXT.fontSize,
    STORY_TEXT.lineHeight,
    palette.textColor
  );

  const badgeR = 11;
  const badgeX = innerX + innerW - badgeR - 4;
  const badgeY = textPanelY + badgeR + 4;
  pdfPage.drawCircle({
    x: badgeX,
    y: badgeY,
    size: badgeR,
    color: palette.accent,
  });
  const numStr = `${params.page.pageNumber}`;
  const numW = fonts.bold.widthOfTextAtSize(numStr, STORY_TEXT.pageNumberSize);
  pdfPage.drawText(numStr, {
    x: badgeX - numW / 2,
    y: badgeY - 3,
    size: STORY_TEXT.pageNumberSize,
    font: fonts.bold,
    color: palette.textColor,
  });
}

/** Full illustration above a dark text band — no white panels, image not covered by text. */
export async function drawStoryPage(
  pdfDoc: PDFDocument,
  fonts: { body: PDFFont; bold: PDFFont },
  params: {
    page: StoryPageInput;
    totalPages: number;
    imageBytes?: Buffer;
  }
) {
  const pdfPage = pdfDoc.addPage([STORY_PAGE.width, STORY_PAGE.height]);
  const { width, height, margin } = STORY_PAGE;

  const innerX = margin;
  const innerY = margin;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;

  pdfPage.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.navy });

  const textMaxWidth = innerW - STORY_TEXT.paddingX * 2 - 24;
  const textBandH = estimateTextBandHeight(params.page.text, fonts.body, textMaxWidth, innerH);
  const imageAreaH = innerH - textBandH - STORY_TEXT.imageTextGap;
  const imageAreaY = innerY + textBandH + STORY_TEXT.imageTextGap;
  const bandColor = rgb(0.06, 0.08, 0.14);
  const imageBackdrop = rgb(0.1, 0.12, 0.2);

  if (params.imageBytes) {
    try {
      await drawImageContain(
        pdfDoc,
        pdfPage,
        params.imageBytes,
        innerX,
        imageAreaY,
        innerW,
        imageAreaH,
        imageBackdrop
      );
    } catch {
      pdfPage.drawRectangle({
        x: innerX,
        y: imageAreaY,
        width: innerW,
        height: imageAreaH,
        color: COLORS.navyMid,
      });
    }
  } else {
    pdfPage.drawRectangle({
      x: innerX,
      y: imageAreaY,
      width: innerW,
      height: imageAreaH,
      color: COLORS.navyMid,
    });
  }

  pdfPage.drawRectangle({
    x: innerX,
    y: innerY,
    width: innerW,
    height: textBandH,
    color: bandColor,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: innerY + textBandH,
    width: innerW,
    height: STORY_TEXT.imageTextGap,
    color: bandColor,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: innerY + textBandH,
    width: innerW,
    height: 3,
    color: COLORS.goldLight,
  });

  drawWrappedText(
    pdfPage,
    params.page.text,
    innerX + STORY_TEXT.paddingX,
    innerY + textBandH - STORY_TEXT.paddingY - STORY_TEXT.fontSize,
    textMaxWidth,
    fonts.body,
    STORY_TEXT.fontSize,
    STORY_TEXT.lineHeight,
    COLORS.textLight
  );

  const badgeR = 11;
  const badgeX = innerX + innerW - badgeR - 6;
  const badgeY = imageAreaY + imageAreaH - badgeR - 6;
  pdfPage.drawCircle({
    x: badgeX,
    y: badgeY,
    size: badgeR,
    color: COLORS.goldLight,
    opacity: 0.95,
  });

  const numStr = `${params.page.pageNumber}`;
  const numW = fonts.bold.widthOfTextAtSize(numStr, STORY_TEXT.pageNumberSize);
  pdfPage.drawText(numStr, {
    x: badgeX - numW / 2,
    y: badgeY - 3,
    size: STORY_TEXT.pageNumberSize,
    font: fonts.bold,
    color: COLORS.navy,
  });

  pdfPage.drawRectangle({
    x: innerX,
    y: innerY,
    width: innerW,
    height: innerH,
    borderColor: COLORS.goldLight,
    borderWidth: 2,
    opacity: 0.35,
  });
}

export async function assembleStoryPdfClassic(params: {
  title: string;
  childName: string;
  pages: StoryPageInput[];
  loadImage?: (pageNumber: number) => Promise<Buffer | undefined>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const body = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fonts = { body, bold, display: body };

  await drawCoverPage(pdfDoc, { display: body, bold }, {
    title: params.title,
    childName: params.childName,
  });

  for (const page of params.pages) {
    const imageBytes = params.loadImage ? await params.loadImage(page.pageNumber) : undefined;
    await drawStoryPageClassic(pdfDoc, fonts, {
      page,
      totalPages: params.pages.length,
      imageBytes,
    });
  }

  return pdfDoc.save();
}

export async function assembleStoryPdf(params: {
  title: string;
  childName: string;
  pages: StoryPageInput[];
  loadImage?: (pageNumber: number) => Promise<Buffer | undefined>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const body = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fonts = { body, bold, display: body };

  await drawCoverPage(pdfDoc, { display: body, bold }, {
    title: params.title,
    childName: params.childName,
  });

  for (const page of params.pages) {
    const imageBytes = params.loadImage ? await params.loadImage(page.pageNumber) : undefined;
    if (!imageBytes && page.imagePath) {
      // loadImage handles paths in caller
    }
    await drawStoryPage(pdfDoc, fonts, {
      page,
      totalPages: params.pages.length,
      imageBytes,
    });
  }

  return pdfDoc.save();
}
