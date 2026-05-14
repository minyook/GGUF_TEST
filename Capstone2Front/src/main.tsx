import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FoldersProvider } from "./context/FoldersContext";
import { FirestoreSyncProvider } from "./context/FirestoreSyncContext";
import { folderStorageScopeId } from "./data/folderStorage";
import App from "./App";
import "./index.css";

function AppWithScopedFolders() {
  const { user } = useAuth();
  const scopeId = folderStorageScopeId(user?.uid);
  return (
    <FoldersProvider key={scopeId} scopeId={scopeId}>
      <FirestoreSyncProvider scopeId={scopeId}>
        <App />
      </FirestoreSyncProvider>
    </FoldersProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWithScopedFolders />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
