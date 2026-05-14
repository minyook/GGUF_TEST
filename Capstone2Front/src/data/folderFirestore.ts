import {
  Timestamp,
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  loadFoldersFromStorage,
  loadTrashFromStorage,
  saveFoldersToStorage,
  saveTrashToStorage,
} from "./folderStorage";

export function timestampFieldToIso(v: unknown): string {
  if (v instanceof Timestamp) {
    return v.toDate().toISOString();
  }
  if (typeof v === "string" && v.length > 0) return v;
  return new Date().toISOString();
}

/** 로그인 사용자만 Firestore 사용 (__guest__ 아님) */
export function foldersUseFirestore(scopeId: string): boolean {
  return scopeId !== "__guest__";
}

/**
 * 로컬에만 있던 폴더·휴지통을 최초 1회 Firestore로 옮깁니다 (문서가 비어 있을 때만).
 */
export async function migrateLocalFoldersToFirestore(
  db: Firestore,
  uid: string
): Promise<void> {
  const foldersCol = collection(db, "users", uid, "folders");
  const existing = await getDocs(foldersCol);
  if (!existing.empty) return;

  const localFolders = loadFoldersFromStorage(uid);
  const localTrash = loadTrashFromStorage(uid);
  if (localFolders.length === 0 && localTrash.length === 0) return;

  const batch = writeBatch(db);
  const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

  for (const f of localFolders) {
    const ref = doc(db, "users", uid, "folders", f.id);
    batch.set(ref, {
      name: f.name,
      createdAt: ts(f.createdAt),
    });
  }
  for (const t of localTrash) {
    const ref = doc(db, "users", uid, "foldersTrash", t.id);
    batch.set(ref, {
      name: t.name,
      createdAt: ts(t.createdAt),
      deletedAt: ts(t.deletedAt),
    });
  }

  await batch.commit();
  saveFoldersToStorage(uid, []);
  saveTrashToStorage(uid, []);
}
