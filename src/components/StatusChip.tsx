const MAP: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "En juicio", bg: "var(--color-cyan)", fg: "#140c1c" },
  APPROVED: { label: "Aprobado", bg: "#39ff14", fg: "#140c1c" },
  REJECTED: { label: "Rechazado", bg: "#e63946", fg: "#f2f2f2" },
};

export function StatusChip({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.PENDING;
  return (
    <span className="px-chip" style={{ ["--chip" as string]: s.bg, ["--chip-fg" as string]: s.fg }}>
      {s.label}
    </span>
  );
}
