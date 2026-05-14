/** Firebase Auth 에러 코드 → 한국어 메시지 (일부) */
export function mapAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/user-disabled":
      return "비활성화된 계정입니다.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "이메일 또는 비밀번호를 확인해 주세요.";
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일입니다.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상으로 설정해 주세요.";
    case "auth/too-many-requests":
      return "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    case "auth/popup-closed-by-user":
      return "로그인 창이 닫혔습니다.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다.";
    default:
      return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
