export const STATUSES = [
  { value: "active", label: "Active", badge: "badge-success" },
  { value: "learning", label: "Learning", badge: "badge-warning" },
  { value: "retired", label: "Retired", badge: "badge-outline" },
  { value: "on-hold", label: "On Hold", badge: "badge-neutral" },
  { value: "filler", label: "Filler", badge: "badge-info" },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

export function getStatus(value) {
  return STATUS_MAP[value] ?? { label: value, badge: "badge-outline" };
}
