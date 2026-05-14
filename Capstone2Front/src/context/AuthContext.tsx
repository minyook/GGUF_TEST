import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/config";

/** Firestore `users` 컬렉션과 동일한 식별 정보 (UI용) */
export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function firebaseToApp(u: User): AppUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  firebaseConfigured: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STORAGE_LEGACY = "overnight_demo_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  /** Auth에 없을 때 Firestore users 문서의 displayName(회원가입 시 저장) */
  const [firestoreDisplayName, setFirestoreDisplayName] = useState<string | null>(null);

  const firebaseConfigured = isFirebaseConfigured && Boolean(auth);

  /** 예전 데모 로그인 잔여 데이터 제거 */
  useEffect(() => {
    try {
      localStorage.removeItem(DEMO_STORAGE_LEGACY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) {
      setFirestoreDisplayName(null);
      return;
    }
    const ref = doc(db, "users", firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setFirestoreDisplayName(null);
          return;
        }
        const d = snap.data() as Record<string, unknown>;
        const dn = typeof d.displayName === "string" ? d.displayName.trim() || null : null;
        setFirestoreDisplayName(dn);
      },
      () => setFirestoreDisplayName(null)
    );
    return () => unsub();
  }, [firebaseUser, db]);

  /** 로그인 시 Firestore `users/{uid}`에 프로필 동기화 (이메일 가입·소셜 공통) */
  useEffect(() => {
    if (!firebaseUser || !db) return;
    const ref = doc(db, "users", firebaseUser.uid);
    setDoc(
      ref,
      {
        email: firebaseUser.email,
        ...(firebaseUser.displayName?.trim()
          ? { displayName: firebaseUser.displayName.trim() }
          : {}),
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {
      /* 규칙 미설정 등 — 콘솔에서 Firestore·규칙 확인 */
    });
  }, [firebaseUser]);

  const user = useMemo<AppUser | null>(() => {
    if (!firebaseUser) return null;
    const base = firebaseToApp(firebaseUser);
    const authDn = base.displayName?.trim() || null;
    const storeDn = firestoreDisplayName?.trim() || null;
    const merged = authDn || storeDn || null;
    return {
      ...base,
      displayName: merged,
    };
  }, [firebaseUser, firestoreDisplayName]);

  const signOutUser = useCallback(async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseConfigured,
      signOutUser,
    }),
    [user, loading, firebaseConfigured, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
