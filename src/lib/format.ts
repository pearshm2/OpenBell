const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n: number) => usd.format(n);

export function signedMoney(n: number) {
  return (n >= 0 ? "+" : "−") + usd.format(Math.abs(n));
}

export function signedPercent(n: number) {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(2) + "%";
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** d >= 0 is "up". */
export const direction = (change: number) => (change >= 0 ? "up" : "down");
