type Props = { values: number[]; up: boolean; width?: number; height?: number; label?: string; fluid?: boolean };

export function Sparkline({ values, up, width = 120, height = 40, label, fluid }: Props) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden="true" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true} preserveAspectRatio="none"
      style={{ display: "block", width: fluid ? "100%" : width, height }}>
      <polyline points={pts.join(" ")} fill="none" stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
