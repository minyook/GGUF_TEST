import type { FolderRecord, TrashedFolderRecord } from "./folderTypes";

/** Firebase Auth uid; 비로그인은 브라우저별 로컬 전용 */
export function folderStorageScopeId(uid: string | null | undefined): string {
  return uid && uid.trim().length > 0 ? uid.trim() : "__guest__";
}

const LEGACY_FOLDERS_KEY = "overnight-folders-v1";
const LEGACY_TRASH_KEY = "overnight-folders-trash-v1";

function foldersKey(scopeId: string): string {
  return `overnight-folders-v2/folders:${scopeId}`;
}

function trashKey(scopeId: string): string {
  return `overnight-folders-v2/trash:${scopeId}`;
}

function isFolderRecord(x: unknown): x is FolderRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.createdAt === "string" &&
    o.id.length > 0 &&
    o.name.trim().length > 0
  );
}

function isTrashedFolderRecord(x: unknown): x is TrashedFolderRecord {
  if (!isFolderRecord(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.deletedAt === "string" && o.deletedAt.length > 0;
}

/** 비로그인(guest) 한정: 예전 전역 키 → 스코프 키로 한 번만 이전 */
function migrateLegacyFoldersIfGuest(scopeId: string): FolderRecord[] | null {
  if (scopeId !== "__guest__") return null;
  const legacy = localStorage.getItem(LEGACY_FOLDERS_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy) as unknown;
    localStorage.removeItem(LEGACY_FOLDERS_KEY);
    if (!Array.isArray(parsed)) return [];
    const rows = parsed.filter(isFolderRecord);
    saveFoldersToStorage(scopeId, rows);
    return rows;
  } catch {
    localStorage.removeItem(LEGACY_FOLDERS_KEY);
    return [];
  }
}

function migrateLegacyTrashIfGuest(scopeId: string): TrashedFolderRecord[] | null {
  if (scopeId !== "__guest__") return null;
  const legacy = localStorage.getItem(LEGACY_TRASH_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy) as unknown;
    localStorage.removeItem(LEGACY_TRASH_KEY);
    if (!Array.isArray(parsed)) return [];
    const rows = parsed.filter(isTrashedFolderRecord);
    saveTrashToStorage(scopeId, rows);
    return rows;
  } catch {
    localStorage.removeItem(LEGACY_TRASH_KEY);
    return [];
  }
}

export function loadFoldersFromStorage(scopeId: string): FolderRecord[] {
  try {
    const raw = localStorage.getItem(foldersKey(scopeId));
    if (raw !== null) {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isFolderRecord);
    }
    const migrated = migrateLegacyFoldersIfGuest(scopeId);
    if (migrated !== null) return migrated;
    return [];
  } catch {
    return [];
  }
}

export function saveFoldersToStorage(scopeId: string, folders: FolderRecord[]): void {
  localStorage.setItem(foldersKey(scopeId), JSON.stringify(folders));
}

export function loadTrashFromStorage(scopeId: string): TrashedFolderRecord[] {
  try {
    const raw = localStorage.getItem(trashKey(scopeId));
    if (raw !== null) {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isTrashedFolderRecord);
    }
    const migrated = migrateLegacyTrashIfGuest(scopeId);
    if (migrated !== null) return migrated;
    return [];
  } catch {
    return [];
  }
}

export function saveTrashToStorage(scopeId: string, trash: TrashedFolderRecord[]): void {
  localStorage.setItem(trashKey(scopeId), JSON.stringify(trash));
}

export function newFolderId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatFolderDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return "—";
  }
}
