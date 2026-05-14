import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Home } from "./pages/Home";
import { Guide } from "./pages/Guide";
import { Projects } from "./pages/Projects";
import { Chatbot } from "./pages/Chatbot";
import { Notes } from "./pages/Notes";
import { Trash } from "./pages/Trash";
import { MyPage } from "./pages/MyPage";
import { Analysis } from "./pages/Analysis";
import { Evaluate } from "./pages/Evaluate";
import { Record } from "./pages/Record";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/script-coach" element={<Navigate to="/chatbot" replace />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/evaluate" element={<Evaluate />} />
        <Route path="/record" element={<Record />} />

        <Route element={<WorkspaceShell />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
