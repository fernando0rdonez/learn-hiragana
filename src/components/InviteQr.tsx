import { useMemo } from "react";
import { encode } from "uqr";

interface Props {
  value: string;
  /** Rendered width/height in CSS pixels. */
  size?: number;
  label: string;
}

/**
 * QR code for an invite URL (docs/QR_JOIN_PLAN.md, Phase B). Rendered as a
 * single SVG path so it stays crisp at any size; always black on white so
 * scanners read it in dark mode too.
 */
export default function InviteQr({ value, size = 200, label }: Props) {
  const { path, modules } = useMemo(() => {
    // border: 4 is the quiet zone the QR spec asks for.
    const qr = encode(value, { ecc: "M", border: 4 });
    let d = "";
    qr.data.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += `M${x} ${y}h1v1h-1z`;
      });
    });
    return { path: d, modules: qr.size };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      shapeRendering="crispEdges"
      className="block rounded-xl"
    >
      <rect width={modules} height={modules} fill="#FFFFFF" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
