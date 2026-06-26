export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatBillingDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}
