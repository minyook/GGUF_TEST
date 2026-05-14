/** 발표 자동 채점 — 팀 기준 (PPT·발표 비교 멀티모달 평가) */

export type RubricCategoryId = "content" | "attitude" | "voice";

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
    title: "발표 내용 (논리성)",
    subtitle: "PPT와 발화·내용의 일치 및 논리",
    summary: "업로드한 PPT와 실제 발표를 비교해 내용 일치도와 논리 흐름을 평가합니다.",
    items: [
      "PPT와 발표 내용이 일치하는가",
      "내용 흐름이 자연스러운가",
      "핵심 내용이 잘 전달되는가",
    ],
  },
  {
    id: "attitude",
    title: "발표 태도",
    subtitle: "비언어적 표현 (시선·표정·제스처)",
    summary: "영상 분석으로 시선, 표정, 제스처의 자연스러움을 정량화합니다.",
    items: [
      "시선 처리가 자연스러운가",
      "표정이 적절한가",
      "제스처가 어색하지 않은가",
    ],
  },
  {
    id: "voice",
    title: "발표 음성",
    subtitle: "속도·안정성·말버릇·반복",
    summary: "음성 분석으로 발화 습관과 전달력을 평가합니다.",
    items: [
      "말하는 속도가 적절한가",
      "목소리가 안정적인가",
      "불필요한 말버릇(어…, 음…)이 적은가",
      "같은 단어 반복이 없는가",
    ],
  },
];

export function totalRubricItems(): number {
  return RUBRIC.reduce((n, c) => n + c.items.length, 0);
}
