export function sanitizeReturnPath(value: string | null | undefined, fallback = "/console") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
