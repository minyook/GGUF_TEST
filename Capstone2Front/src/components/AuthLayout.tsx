import { SiteHeader } from "./SiteHeader";
import "./AuthLayout.css";

type Props = {
  children: React.ReactNode;
  /** 회원가입 등 넓은 폼 */
  wide?: boolean;
};

export function AuthLayout({ children, wide }: Props) {
  return (
    <div className="shell">
      <SiteHeader />
      <main className="shell__main shell__main--auth">
        <div className={"auth-web__panel" + (wide ? " auth-web__panel--wide" : "")}>{children}</div>
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
