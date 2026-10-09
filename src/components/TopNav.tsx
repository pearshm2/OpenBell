import { isDemoMode } from "@/lib/stocks";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export function TopNav({ userName }: { userName: string }) {
  return (
    <header className="topnav">
      <div className="container topnav-inner">
        <Logo />
        <NavLinks />
        <div className="nav-right">
          {isDemoMode() && (
            <span className="demo-badge" title="No FINNHUB_API_KEY set — showing built-in sample prices">
              Demo data
            </span>
          )}
          <span className="nav-user">{userName}</span>
          <form action="/logout" method="post">
            <button type="submit" className="btn btn-secondary">Log out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
