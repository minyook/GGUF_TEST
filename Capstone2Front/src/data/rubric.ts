/** 발표 자동 채점 — 팀 기준 (PPT·발표 비교 멀티모달 평가) */

export type RubricCategoryId = "content" | "stability" | "nonverbal";

export interface RubricCategory {
  id: RubricCategoryId;
  title: string;
  subtitle: string;
  items: string[];
  /** UI용 짧은 설명 */
  summary: string;
}

export const RUBRIC: RubricCategory[] = [
  {
    id: "content",
    title: "I. 내용 및 시각화 (Content & Viz)",
    subtitle: "논리적 완결성 및 정보 디자인의 효율성",
    summary: "논리 구조, 헤드라인 전략, 시각적 가독성, 데이터 신뢰성을 평가합니다.",
    items: [
      "논리 구조 (서론-본론-결론 명확성 등)",
      "헤드라인 전략 (핵심 요약 명시)",
      "시각적 가독성 (폰트 규격, 여백 등)",
      "데이터 신뢰성 (출처 명시 및 객관성)"
    ],
  },
  {
    id: "stability",
    title: "II. 전달의 안정성 (Stability)",
    subtitle: "화자의 심리적 평정심 및 전문적 신뢰도",
    summary: "음성 안정도, 신체 평정심, 언어적 유창성을 평가합니다.",
    items: [
      "음성 안정도 (성량, 톤, 발음)",
      "신체 평정심 (안정적인 자세)",
      "언어적 유창성 (필러 워드, 문장 끝맺음)"
    ],
  },
  {
    id: "nonverbal",
    title: "III. 시각적 비언어 (Non-verbal)",
    subtitle: "청중과의 상호작용 및 메시지 증폭",
    summary: "시선 처리, 제스처 및 표정을 평가합니다.",
    items: [
      "시선 처리 (청중 전체 시선 맞춤)",
      "제스처/표정 (적극적인 손동작과 자신감)"
    ],
  },
];

export function totalRubricItems(): number {
  return RUBRIC.reduce((n, c) => n + c.items.length, 0);
}
