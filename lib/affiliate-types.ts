export type AffiliateMonthlyRow = {
  partnerId: string;
  code: string;
  name: string;
  contactEmail: string | null;
  conversions: number;
  commissionTotal: number;
  pendingTotal: number;
  paidTotal: number;
};

export type AffiliateConversionRow = {
  id: string;
  partnerName: string;
  partnerCode: string;
  parentEmail: string;
  parentName: string;
  commissionAmount: number;
  convertedAt: Date;
  payoutStatus: string;
  paidAt: Date | null;
};

export type AffiliateConversionDisplay = Omit<
  AffiliateConversionRow,
  "convertedAt" | "paidAt"
> & {
  convertedAt: string;
  paidAt: string | null;
};
