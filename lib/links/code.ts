/**
 * Short join codes for /j/<code>. Uppercase letters and digits without the
 * look-alikes (0/O, 1/I/L), so a code read aloud or written on a board
 * survives. 5 characters for expiring child links (~28 million), 6 for the
 * permanent classroom and assignment codes (~887 million).
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CHILD_CODE_LENGTH = 5;
export const CLASS_CODE_LENGTH = 6;

export function newCode(length: number, random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return out;
}

/** Uppercase and drop spaces, dashes and anything else a person may add while typing or pasting a link. */
export function normalizeCode(input: string): string {
  const s = input.trim();
  const fromUrl = s.match(/\/j\/([A-Za-z0-9]+)/);
  return (fromUrl ? fromUrl[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** A code is well-formed when it uses the alphabet and one of the two lengths. */
export function isValidCode(code: string): boolean {
  if (code.length !== CHILD_CODE_LENGTH && code.length !== CLASS_CODE_LENGTH) return false;
  return [...code].every((ch) => CODE_ALPHABET.includes(ch));
}

/** The URL a code is shared as. */
export function joinUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/j/${code}`;
}
