"use client";

/** A small data table (frequency tables, values); the highlighted row is yellow. */
export default function DataTable({ head, rows, highlight }: { head: string[]; rows: string[][]; highlight?: number }) {
  return (
    <div className="motion animate-pop-in overflow-x-auto max-w-full">
      <table className="border-collapse text-[17px] r-card-2 ink bg-surface overflow-hidden" style={{ minWidth: 220 }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="font-display font-bold text-[16px] px-4 py-2 border-b-2 border-ink bg-primary-tint text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={highlight === i ? "bg-yellow font-bold" : ""}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2 border-b border-rule tabular-nums text-right">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
