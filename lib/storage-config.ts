/** PDF files are removed from disk after this many days (emailed copies remain with parents). */
export const PDF_RETENTION_DAYS = Number(process.env.PDF_RETENTION_DAYS ?? "90");

/** Hosting disk quota for capacity estimates (1-grid Medium = 25 GB). */
export const STORAGE_QUOTA_GB = Number(process.env.STORAGE_QUOTA_GB ?? "25");

export const STORAGE_QUOTA_BYTES = STORAGE_QUOTA_GB * 1024 * 1024 * 1024;

/** Fallback average when no PDFs exist yet (~10 JPEG pages at 720px). */
export const DEFAULT_AVG_PDF_BYTES = 2.5 * 1024 * 1024;

export function isPdfStored(pdfPath: string | null | undefined): boolean {
  return Boolean(pdfPath && pdfPath.trim().length > 0);
}
