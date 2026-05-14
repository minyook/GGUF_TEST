import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

const options: Partial<FirebaseOptions> & { projectId?: string } = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(measurementId ? { measurementId } : {}),
};

export const isFirebaseConfigured =
  Boolean(options.apiKey && options.authDomain && options.projectId && options.appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(options as FirebaseOptions);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
