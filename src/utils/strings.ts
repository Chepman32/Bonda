export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function safeLowercase(value?: string | null): string {
  return normalizeWhitespace(value ?? '').toLowerCase();
}

export function createInitials(displayName: string): string {
  const parts = normalizeWhitespace(displayName).split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '??';
  }

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}
