import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SITE_NAV } from "./siteNav";
import "./AppShell.css";

/** 로그인/회원가입 등에서는 우측 CTA를 반대 페이지로 바꿔 중복을 줄임 */
function authPageCta(pathname: string): { to: string; label: string } | null {
  if (pathname === "/register") return { to: "/login", label: "로그인" };
  if (pathname === "/login" || pathname === "/forgot-password") return { to: "/register", label: "회원가입" };
  return null;
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const ctaAlt = authPageCta(location.pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header className={"shell__header" + (menuOpen ? " shell__header--open" : "")}>
        <div className="shell__bar">
          <NavLink to="/" className="shell__brand" onClick={() => setMenuOpen(false)}>
            <span className="shell__logo" aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="var(--primary)" />
              </svg>
            </span>
            <span className="shell__title">Overnight</span>
          </NavLink>
          <button
            type="button"
            className="shell__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="shell-nav"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="shell__menu-icon" aria-hidden>
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              )}
            </span>
          </button>
          <nav id="shell-nav" className="shell__nav" aria-label="주 메뉴">
            {SITE_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end === true}
                className={({ isActive }) => "shell__link" + (isActive ? " shell__link--active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={"shell__actions" + (!user ? " shell__actions--guest" : "")}>
            {!loading && !user && (
              <NavLink
                to={ctaAlt?.to ?? "/login"}
                className="shell__link shell__link--cta"
              >
                {ctaAlt?.label ?? "로그인"}
              </NavLink>
            )}
            {loading && !user && (
              <span className="shell__cta-placeholder" aria-hidden="true" />
            )}
          </div>
        </div>
      </header>
      {menuOpen && (
        <button
          type="button"
          className="shell__backdrop"
          aria-hidden
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
