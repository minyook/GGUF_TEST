/** AppShell · SiteHeader 공통 내비 항목 */
export type SiteNavItem = { to: string; label: string; end?: boolean };

export const SITE_NAV: SiteNavItem[] = [
  { to: "/", label: "홈", end: true },
  { to: "/projects", label: "문서" },
  { to: "/evaluate", label: "발표 평가" },
  { to: "/chatbot", label: "챗봇" },
  { to: "/guide", label: "가이드" },
  { to: "/mypage", label: "마이페이지" },
];
