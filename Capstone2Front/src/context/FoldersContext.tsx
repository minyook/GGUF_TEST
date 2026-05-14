import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { FolderRecord, TrashedFolderRecord } from "../data/folderTypes";
import {
  foldersUseFirestore,
  migrateLocalFoldersToFirestore,
  timestampFieldToIso,
} from "../data/folderFirestore";
import { db } from "../firebase/config";
import {
  loadFoldersFromStorage,
  loadTrashFromStorage,
  newFolderId,
  saveFoldersToStorage,
  saveTrashToStorage,
} from "../data/folderStorage";

type FoldersContextValue = {
  /** 로컬 제출(localStorage) 분리용 — `folderFilesStorage`와 함께 사용 */
  scopeId: string;
  /** 로그인 시 폴더는 Firestore 동기화 중일 수 있음 */
  foldersReady: boolean;
  folders: FolderRecord[];
  trashFolders: TrashedFolderRecord[];
  createFolder: (name: string) => Promise<boolean>;
  removeFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  purgeFolder: (id: string) => void;
};

const FoldersContext = createContext<FoldersContextValue | null>(null);

export function FoldersProvider({
  scopeId,
  children,
}: {
  scopeId: string;
  children: ReactNode;
}) {
  const useRemote = foldersUseFirestore(scopeId) && Boolean(db);

  const [foldersReady, setFoldersReady] = useState(!useRemote);
  const [folders, setFolders] = useState<FolderRecord[]>(() =>
    useRemote ? [] : loadFoldersFromStorage(scopeId)
  );
  const [trashFolders, setTrashFolders] = useState<TrashedFolderRecord[]>(() =>
    useRemote ? [] : loadTrashFromStorage(scopeId)
  );

  const firestoreUnsubsRef = useRef<{ f?: () => void; t?: () => void }>({});

  /** 비로그인: 로컬 저장만 */
  useEffect(() => {
    if (useRemote) return;
    saveFoldersToStorage(scopeId, folders);
  }, [useRemote, scopeId, folders]);

  useEffect(() => {
    if (useRemote) return;
    saveTrashToStorage(scopeId, trashFolders);
  }, [useRemote, scopeId, trashFolders]);

  /** 로그인: Firestore 실시간 동기화 */
  useEffect(() => {
    if (!useRemote || !db) {
      setFoldersReady(true);
      return;
    }

    setFoldersReady(false);
    firestoreUnsubsRef.current = {};
    let cancelled = false;

    void (async () => {
      try {
        await migrateLocalFoldersToFirestore(db, scopeId);
      } catch (e) {
        console.error("[folders migrate]", e);
      }
      if (cancelled || !db) return;

      const foldersCol = collection(db, "users", scopeId, "folders");
      const trashCol = collection(db, "users", scopeId, "foldersTrash");
      const qF = query(foldersCol, orderBy("createdAt", "desc"));
      const qT = query(trashCol, orderBy("deletedAt", "desc"));

      firestoreUnsubsRef.current.f = onSnapshot(
        qF,
        (snap) => {
          const rows: FolderRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            rows.push({
              id: d.id,
              name: String(data.name ?? ""),
              createdAt: timestampFieldToIso(data.createdAt),
            });
          });
          setFolders(rows);
          setFoldersReady(true);
        },
        (err) => console.error("[folders]", err)
      );

      firestoreUnsubsRef.current.t = onSnapshot(
        qT,
        (snap) => {
          const rows: TrashedFolderRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            rows.push({
              id: d.id,
              name: String(data.name ?? ""),
              createdAt: timestampFieldToIso(data.createdAt),
              deletedAt: timestampFieldToIso(data.deletedAt),
            });
          });
          setTrashFolders(rows);
        },
        (err) => console.error("[foldersTrash]", err)
      );
    })();

    return () => {
      cancelled = true;
      firestoreUnsubsRef.current.f?.();
      firestoreUnsubsRef.current.t?.();
      firestoreUnsubsRef.current = {};
    };
  }, [useRemote, scopeId]);

  const createFolder = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 40) return false;

      if (!foldersUseFirestore(scopeId)) {
        const rec: FolderRecord = {
          id: newFolderId(),
          name: trimmed,
          createdAt: new Date().toISOString(),
        };
        setFolders((prev) => [rec, ...prev]);
        return true;
      }

      if (!db) return false;
      try {
        const ref = doc(collection(db, "users", scopeId, "folders"));
        await setDoc(ref, {
          name: trimmed,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (e) {
        console.error("[createFolder]", e);
        return false;
      }
    },
    [scopeId]
  );

  const removeFolder = useCallback(
    (id: string) => {
      if (!foldersUseFirestore(scopeId)) {
        let removed: FolderRecord | undefined;
        setFolders((prev) => {
          removed = prev.find((f) => f.id === id);
          return removed ? prev.filter((f) => f.id !== id) : prev;
        });
        if (removed) {
          const tr: TrashedFolderRecord = {
            ...removed,
            deletedAt: new Date().toISOString(),
          };
          setTrashFolders((t) => [tr, ...t]);
        }
        return;
      }

      if (!db) return;
      const removed = folders.find((f) => f.id === id);
      if (!removed) return;

      void (async () => {
        try {
          await deleteDoc(doc(db, "users", scopeId, "folders", id));
          await setDoc(doc(db, "users", scopeId, "foldersTrash", id), {
            name: removed.name,
            createdAt: Timestamp.fromDate(new Date(removed.createdAt)),
            deletedAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("[removeFolder]", e);
        }
      })();
    },
    [scopeId, folders]
  );

  const restoreFolder = useCallback(
    (id: string) => {
      if (!foldersUseFirestore(scopeId)) {
        let item: TrashedFolderRecord | undefined;
        setTrashFolders((prev) => {
          item = prev.find((f) => f.id === id);
          return item ? prev.filter((f) => f.id !== id) : prev;
        });
        if (item) {
          const rest: FolderRecord = {
            id: item.id,
            name: item.name,
            createdAt: item.createdAt,
          };
          setFolders((prev) => {
            if (prev.some((f) => f.id === rest.id)) return prev;
            return [rest, ...prev];
          });
        }
        return;
      }

      if (!db) return;
      const item = trashFolders.find((f) => f.id === id);
      if (!item) return;

      void (async () => {
        try {
          await deleteDoc(doc(db, "users", scopeId, "foldersTrash", id));
          await setDoc(doc(db, "users", scopeId, "folders", id), {
            name: item.name,
            createdAt: Timestamp.fromDate(new Date(item.createdAt)),
          });
        } catch (e) {
          console.error("[restoreFolder]", e);
        }
      })();
    },
    [scopeId, trashFolders]
  );

  const purgeFolder = useCallback(
    (id: string) => {
      if (!foldersUseFirestore(scopeId)) {
        setTrashFolders((prev) => prev.filter((f) => f.id !== id));
        return;
      }
      if (!db) return;
      void (async () => {
        try {
          await deleteDoc(doc(db, "users", scopeId, "foldersTrash", id));
        } catch (e) {
          console.error("[purgeFolder]", e);
        }
      })();
    },
    [scopeId]
  );

  const value = useMemo(
    () => ({
      scopeId,
      foldersReady,
      folders,
      trashFolders,
      createFolder,
      removeFolder,
      restoreFolder,
      purgeFolder,
    }),
    [
      scopeId,
      foldersReady,
      folders,
      trashFolders,
      createFolder,
      removeFolder,
      restoreFolder,
      purgeFolder,
    ]
  );

  return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;
}

export function useFolders(): FoldersContextValue {
  const ctx = useContext(FoldersContext);
  if (!ctx) {
    throw new Error("useFolders must be used within FoldersProvider");
  }
  return ctx;
}
