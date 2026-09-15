const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Display helper: Western digits → Arabic-Indic (٠–٩). Data stays untouched. */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** True when the text carries Latin letters and no Arabic ones (an English word, label or sentence). */
export function isLatin(input: string): boolean {
  return /[A-Za-z]/.test(input) && !/[؀-ۿ]/.test(input);
}
