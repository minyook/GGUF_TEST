import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { StoredRubricScores } from "./storedRubricScores";
import { parseStoredRubricScores } from "./storedRubricScores";

const META_DOC_ID = "_meta";

const LOCAL_LEGACY_KEY = "overnight-analysis-result-v1";
const LOCAL_BY_SUBMISSION_KEY = "overnight-analysis-by-submission-v1";

export type AnalysisScoresCache = {
  bySubmission: Record<string, StoredRubricScores>;
  global: StoredRubricScores | null;
};

let cache: AnalysisScoresCache = { bySubmission: {}, global: null };
let unsub: (() => void) | undefined;

export function getAnalysisScoresCache(): AnalysisScoresCache {
  return cache;
}

async function migrateLocalScores(uid: string): Promise<void> {
  if (!db) return;
  const col = collection(db, "users", uid, "analysisScores");
  const snap = await getDocs(col);
  if (!snap.empty) return;

  const fs = db as Firestore;
  const ops: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];

  const byRaw = localStorage.getItem(LOCAL_BY_SUBMISSION_KEY);
  if (byRaw) {
    try {
      const parsed = JSON.parse(byRaw) as unknown;
      if (parsed && typeof parsed === "object") {
        for (const [submissionId, val] of Object.entries(parsed as Record<string, unknown>)) {
          const scores = parseStoredRubricScores(val);
          if (!scores) continue;
          ops.push({
            ref: doc(fs, "users", uid, "analysisScores", submissionId),
            data: {
              scores,
              updatedAt: Timestamp.now(),
            },
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  const legacyRaw = localStorage.getItem(LOCAL_LEGACY_KEY);
  if (legacyRaw) {
    try {
      const globalScores = parseStoredRubricScores(JSON.parse(legacyRaw) as unknown);
      if (globalScores) {
        ops.push({
          ref: doc(fs, "users", uid, "analysisScores", META_DOC_ID),
          data: {
            globalScores,
            updatedAt: Timestamp.now(),
          },
        });
      }
    } catch {
      /* ignore */
    }
  }

  if (ops.length === 0) return;

  let batch = writeBatch(fs);
  let n = 0;
  for (const op of ops) {
    batch.set(op.ref, op.data, { merge: true });
    n += 1;
    if (n >= 400) {
      await batch.commit();
      batch = writeBatch(fs);
      n = 0;
    }
  }
  if (n > 0) await batch.commit();

  localStorage.removeItem(LOCAL_BY_SUBMISSION_KEY);
  localStorage.removeItem(LOCAL_LEGACY_KEY);
}

export function startAnalysisScoresSync(uid: string, onChange: () => void): () => void {
  if (!db) return () => {};

  unsub?.();
  unsub = undefined;
  cache = { bySubmission: {}, global: null };
  let cancelled = false;

  void (async () => {
    try {
      await migrateLocalScores(uid);
    } catch (e) {
      console.error("[analysisScores migrate]", e);
    }
    if (cancelled || !db) return;

    const col = collection(db, "users", uid, "analysisScores");
    unsub = onSnapshot(
      col,
      (snap) => {
        const bySubmission: Record<string, StoredRubricScores> = {};
        let global: StoredRubricScores | null = null;
        snap.forEach((d) => {
          if (d.id === META_DOC_ID) {
            const data = d.data();
            global = data.globalScores ? parseStoredRubricScores(data.globalScores) : null;
            return;
          }
          const data = d.data();
          const scores = parseStoredRubricScores(data.scores);
          if (scores) bySubmission[d.id] = scores;
        });
        cache = { bySubmission, global };
        onChange();
      },
      (err) => console.error("[analysisScores]", err)
    );
  })();

  return () => {
    cancelled = true;
    unsub?.();
    unsub = undefined;
    cache = { bySubmission: {}, global: null };
  };
}

export async function saveAnalysisScoresToFirestore(
  uid: string,
  submissionId: string | null,
  scores: StoredRubricScores
): Promise<void> {
  if (!db) return;
  if (submissionId) {
    await setDoc(
      doc(db, "users", uid, "analysisScores", submissionId),
      {
        scores,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }
  await setDoc(
    doc(db, "users", uid, "analysisScores", META_DOC_ID),
    {
      globalScores: scores,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
