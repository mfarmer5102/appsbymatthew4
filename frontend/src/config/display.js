// Colours and icons for skill types and support statuses.
//
// These used to switch on a `code` column ("ACTIVE", "BACKENDFRAMEWORK") that no longer
// exists — records are identified by surrogate integer keys now. Recognised status
// names still get their intended colour and icon; anything else falls back to a colour
// derived from the key, so a given record renders consistently rather than defaulting
// to a single shared purple.

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // grey
];

const colorForKey = (key) => {
  const numeric = Number(key);
  if (!Number.isFinite(numeric)) return PALETTE[PALETTE.length - 1];
  return PALETTE[Math.abs(Math.trunc(numeric)) % PALETTE.length];
};

const STATUS_STYLES = {
  active: { color: '#10b981', icon: 'check_circle' },
  inactive: { color: '#6b7280', icon: 'cancel' },
  deprecated: { color: '#f59e0b', icon: 'warning' },
  maintenance: { color: '#3b82f6', icon: 'build' },
  discontinued: { color: '#ef4444', icon: 'block' },
  experimental: { color: '#8b5cf6', icon: 'science' },
  archived: { color: '#6b7280', icon: 'inventory_2' },
};

/**
 * @param {{support_status?: string, support_status_key?: number}} status
 * @returns {{color: string, icon: string}}
 */
export const getSupportStatusStyle = (status) => {
  const name = String(status?.support_status ?? '').trim().toLowerCase();
  return STATUS_STYLES[name] ?? {
    color: colorForKey(status?.support_status_key),
    icon: 'help',
  };
};

/**
 * Stable colour for a skill type, used on both the Skills and Skill Types pages so the
 * same category reads the same in either place.
 */
export const getCategoryColor = (skill_type_key) => colorForKey(skill_type_key);

/**
 * Format a 'YYYY-MM-DD' publish date for display.
 *
 * `new Date('2025-06-07')` is parsed as UTC midnight, so rendering it with
 * toLocaleDateString in any timezone behind UTC shows the previous day. The API sends a
 * plain calendar date with no time or zone attached, so build the Date from its parts —
 * that constructor is local-time — and it renders as the day it actually is.
 */
export const formatPublishDate = (value) => {
  if (!value) return 'Not set';

  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return 'Not set';

  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString();
};
