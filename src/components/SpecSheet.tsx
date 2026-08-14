import { useState } from "react";
import { ChevronDown, Download, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { SpecRow } from "@/data/services";
import { cn } from "@/lib/utils";

const COLUMNS = ["Item", "Scope", "Turnaround", "Rate", "Notes"] as const;
const COLUMN_LETTERS = ["A", "B", "C", "D", "E"] as const;

function rowValues(row: SpecRow) {
  return [row.item, row.scope, row.turnaround, row.rate, row.notes];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Collapsible spreadsheet pane with a one-click .xls export. */
export function SpecSheet({
  title,
  reference,
  rows,
  defaultOpen = false,
}: {
  title: string;
  reference: string;
  rows: SpecRow[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const downloadXls = () => {
    const head = COLUMNS.map((c) => `<th>${c}</th>`).join("");
    const body = rows
      .map((r) => `<tr>${rowValues(r).map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr><th colspan="5">${escapeHtml(
      title,
    )} — ${escapeHtml(reference)}</th></tr><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reference}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Spreadsheet downloaded", { description: `${reference}.xls` });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <Table2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Build sheet — rates & turnaround</span>
          <ChevronDown
            className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        <button
          type="button"
          onClick={downloadXls}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground"
        >
          <Download className="h-3.5 w-3.5" /> .xls
        </button>
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground">
                <th className="w-10 border border-border px-2 py-1 text-center font-normal">#</th>
                {COLUMN_LETTERS.map((l) => (
                  <th key={l} className="border border-border px-2 py-1 text-center font-normal">
                    {l}
                  </th>
                ))}
              </tr>
              <tr className="bg-secondary">
                <th className="border border-border px-2 py-2 text-center text-muted-foreground">1</th>
                {COLUMNS.map((c) => (
                  <th key={c} className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.item} className="odd:bg-background even:bg-secondary/30">
                  <td className="border border-border px-2 py-2 text-center text-muted-foreground">{i + 2}</td>
                  {rowValues(row).map((v, j) => (
                    <td key={j} className="border border-border px-3 py-2 align-top">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
