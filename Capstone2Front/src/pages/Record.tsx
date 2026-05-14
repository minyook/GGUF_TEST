import { Navigate } from "react-router-dom";

/** 예전 경로 호환: 녹화·업로드는 `/evaluate`에서 통합 처리 */
export function Record() {
  return <Navigate to="/evaluate" replace />;
}
