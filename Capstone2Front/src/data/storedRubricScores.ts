import type { CategoryScores } from "./firestoreModel";
import type { RubricCategoryId } from "./rubric";
import { RUBRIC } from "./rubric";

/** 루브릭 3영역 점수 — 로컬/Firestore 공통 */
export type StoredRubricScores = Record<RubricCategoryId, CategoryScores>;

function isCategoryScores(raw: unknown, itemCount: number): raw is CategoryScores {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if (typeof o.category !== "number") return false;
  if (!Array.isArray(o.items)) return false;
  if (o.items.length !== itemCount) return false;
  return o.items.every((x) => typeof x === "number");
}

export function parseStoredRubricScores(raw: unknown): StoredRubricScores | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const out: Partial<StoredRubricScores> = {};
  for (const cat of RUBRIC) {
    const c = obj[cat.id];
    if (!isCategoryScores(c, cat.items.length)) return null;
    out[cat.id] = c;
  }
  return out as StoredRubricScores;
}
