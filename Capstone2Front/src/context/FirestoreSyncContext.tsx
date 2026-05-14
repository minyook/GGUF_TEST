import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { db } from "../firebase/config";
import { foldersUseFirestore } from "../data/folderFirestore";
import { startAnalysisScoresSync } from "../data/analysisScoresFirestore";
import { startSubmissionsSync } from "../data/folderSubmissionsFirestore";

const FirestoreSyncContext = createContext<number>(0);

export function FirestoreSyncProvider({
  scopeId,
  children,
}: {
  scopeId: string;
  children: ReactNode;
}) {
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    if (!db || !foldersUseFirestore(scopeId)) return;

    const unsubSubs = startSubmissionsSync(scopeId, bump);
    const unsubScores = startAnalysisScoresSync(scopeId, bump);

    return () => {
      unsubSubs();
      unsubScores();
    };
  }, [scopeId, bump]);

  const value = useMemo(() => revision, [revision]);

  return <FirestoreSyncContext.Provider value={value}>{children}</FirestoreSyncContext.Provider>;
}

/** 제출·채점 Firestore 스냅샷 갱신 시 증가 — 목록/점수 useMemo 의존성에 포함 */
export function useFirestoreSyncRevision(): number {
  return useContext(FirestoreSyncContext);
}
