import { useEffect, useRef, useState } from "react";

type Props = {
  /** Value encoded in the QR code (usually a URL). */
  value: string;
  /** Value encoded in the Code128 barcode (usually the reference number). */
  reference: string;
};

/**
 * Renders a scannable QR code and a Code128 barcode for a service pane.
 * Both libraries are browser-only, so they load after hydration.
 */
export function CodeTag({ value, reference }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(value, {
        margin: 1,
        width: 320,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      if (!cancelled) setQr(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const JsBarcode = (await import("jsbarcode")).default;
      if (cancelled || !barcodeRef.current) return;
      JsBarcode(barcodeRef.current, reference, {
        format: "CODE128",
        displayValue: false,
        height: 48,
        margin: 0,
        lineColor: "#0f172a",
        background: "#ffffff",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
      <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2">
        {qr ? (
          <img src={qr} alt={`QR code linking to ${value}`} width={128} height={128} className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Reference number</p>
        <p className="mt-1 font-mono text-lg font-semibold tracking-tight">{reference}</p>
        <div className="mt-3 overflow-hidden rounded-lg bg-white p-2">
          <svg ref={barcodeRef} className="h-12 w-full" role="img" aria-label={`Barcode for ${reference}`} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Scan the QR to open this pane, or quote the reference when you call.
        </p>
      </div>
    </div>
  );
}
