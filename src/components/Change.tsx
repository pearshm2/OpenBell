import { direction, signedMoney, signedPercent } from "@/lib/format";

/** Price change with arrow + color, so meaning never rests on hue alone. */
export function Change({ change, percent, className = "" }: { change: number; percent: number; className?: string }) {
  const dir = direction(change);
  return (
    <span className={`mono ${dir} ${className}`}>
      <span aria-hidden="true">{dir === "up" ? "▲" : "▼"}</span>{" "}
      <span className="sr-only">{dir === "up" ? "Up" : "Down"} </span>
      {signedMoney(change)} ({signedPercent(percent)})
    </span>
  );
}
