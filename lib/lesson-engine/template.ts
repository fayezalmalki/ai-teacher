/** Replace `{key}` placeholders. Unknown keys are left untouched. */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m,
  );
}
