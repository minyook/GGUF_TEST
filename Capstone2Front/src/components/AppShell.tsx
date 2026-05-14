import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import "./AppShell.css";

export function AppShell() {
  return (
    <div className="shell">
      <SiteHeader />
      <main className="shell__main">
        <Outlet />
      </main>
      <footer className="shell__footer">
        <div className="shell__footer-inner">
          <p className="shell__copyright">
            © {new Date().getFullYear()} Overnight · 멀티모달 발표 자동 채점
          </p>
        </div>
      </footer>
    </div>
  );
}
