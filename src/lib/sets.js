export const SET_OPTIONS = [
  { value: "set-1", label: "Set 1", kind: "performance" },
  { value: "set-2", label: "Set 2", kind: "performance" },
  { value: "set-3", label: "Set 3", kind: "performance" },
  { value: "set-3-alt-1", label: "Set 3 (Alt 1)", kind: "performance" },
  { value: "set-3-alt-2", label: "Set 3 (Alt 2)", kind: "performance" },
  { value: "extras", label: "Common Inserts", kind: "catalog" },
  { value: "new", label: "To Work On", kind: "catalog" },
];

export const PERFORMANCE_SETS = SET_OPTIONS.filter(
  (set) => set.kind === "performance",
);
