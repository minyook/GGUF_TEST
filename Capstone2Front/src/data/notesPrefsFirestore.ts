import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const NOTES_PREFS_DOC_ID = "default";

export type NotesPrefsData = {
  selectedFolderId: string;
  submissionByFolder: Record<string, string>;
};

function notesPrefsDoc(uid: string) {
  return doc(db!, "users", uid, "notesPrefs", NOTES_PREFS_DOC_ID);
}

function readLocalSelected(uid: string): string {
  try {
    return localStorage.getItem(`overnight-notes-selected-folder-v2:${uid}`) ?? "";
  } catch {
    return "";
  }
}

function readLocalSubmissionMap(uid: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`overnight-notes-submission-by-folder-v2:${uid}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function migrateNotesPrefsFromLocal(uid: string): Promise<void> {
  if (!db) return;
  const ref = notesPrefsDoc(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const selectedFolderId = readLocalSelected(uid);
  const submissionByFolder = readLocalSubmissionMap(uid);
  if (!selectedFolderId && Object.keys(submissionByFolder).length === 0) return;

  await setDoc(ref, { selectedFolderId, submissionByFolder }, { merge: true });

  try {
    localStorage.removeItem(`overnight-notes-selected-folder-v2:${uid}`);
    localStorage.removeItem(`overnight-notes-submission-by-folder-v2:${uid}`);
  } catch {
    /* ignore */
  }
}

export function subscribeNotesPrefs(uid: string, onNext: (data: NotesPrefsData) => void): () => void {
  if (!db) return () => {};

  const ref = notesPrefsDoc(uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onNext({ selectedFolderId: "", submissionByFolder: {} });
        return;
      }
      const d = snap.data();
      const submissionByFolder =
        d.submissionByFolder &&
        typeof d.submissionByFolder === "object" &&
        d.submissionByFolder !== null &&
        !Array.isArray(d.submissionByFolder)
          ? (d.submissionByFolder as Record<string, string>)
          : {};
      onNext({
        selectedFolderId: typeof d.selectedFolderId === "string" ? d.selectedFolderId : "",
        submissionByFolder,
      });
    },
    (err) => console.error("[notesPrefs]", err)
  );
}

export async function saveNotesPrefsFirestore(uid: string, patch: Partial<NotesPrefsData>): Promise<void> {
  if (!db) return;
  await setDoc(notesPrefsDoc(uid), patch, { merge: true });
}
