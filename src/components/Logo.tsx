import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0-6 6v4.5L4 17h16l-2-3.5V9a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="logo">
      <LogoMark />
      <span className="logo-text">Openbell</span>
    </Link>
  );
}
