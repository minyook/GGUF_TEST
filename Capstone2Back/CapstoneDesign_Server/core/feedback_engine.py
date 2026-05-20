import os
import json
import sys
import io
import re
import glob
from pathlib import Path
from typing import Dict, Any, Optional

# 터미널 출력 한글 깨짐 방지
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class FeedbackEngine:
    """발표 분석 데이터를 기반으로 AI 피드백 보고서를 생성하는 엔진.

    Ollama(Gemma 3 4B GGUF)를 주 엔진으로 사용하며,
    Ollama 실패 시 Gemini API로 자동 폴백합니다.
    """

    # Gemma 모델 출력에서 제거해야 할 특수 토큰 목록
    _GEMMA_TOKENS_TO_REMOVE = [
        '<start_of_turn>', '<end_of_turn>', 'model\n', 'user\n'
    ]

    def __init__(self, provider: str = "gemma"):
        self.provider = provider.lower()
        self.ollama_model = "gemma-coach"
        
        if self.provider == "gemma":
            self._verify_ollama()

    # ------------------------------------------------------------------
    # 초기화 및 검증
    # ------------------------------------------------------------------
    def _verify_ollama(self):
        """Ollama 서비스 및 모델 존재 확인. 실패 시 Gemini로 자동 전환."""
        print(f"\n--- [FeedbackEngine] Ollama GGUF 모델 확인 중 ({self.ollama_model}) ---")
        try:
            import ollama
            models = ollama.list()
            model_names = [m.model.split(":")[0] for m in models.models]
            
            if self.ollama_model in model_names:
                print(f"✅ Ollama 모델 '{self.ollama_model}' 확인 완료! (GGUF 경량 추론)")
            else:
                print(f"⚠️ Ollama에서 '{self.ollama_model}' 모델을 찾을 수 없습니다.")
                print(f"   등록된 모델: {model_names}")
                print(f"   → Gemini 폴백으로 전환합니다.")
                self.provider = "gemini"
        except Exception as e:
            print(f"❌ Ollama 연결 실패: {e}")
            print(f"   → Gemini 폴백으로 전환합니다.")
            self.provider = "gemini"

    # ------------------------------------------------------------------
    # 피드백 생성 (메인 진입점)
    # ------------------------------------------------------------------
    def generate_feedback(self, project_name: str, rubric: str = "", persona: str = "soft") -> str:
        """프로젝트의 분석 JSON 파일들을 취합하여 AI 피드백을 생성합니다."""
        json_paths = self._find_project_json_files(project_name)
        detailed_data = self._load_json_data(json_paths)
        analysis_summary = detailed_data.get("summary", {})
        
        # 데이터 바인딩
        ppt_summary = analysis_summary.get('ppt_summary', '데이터 없음')
        voice_summary = analysis_summary.get('voice_summary', '')
        speed = analysis_summary.get('avg_speed', 1.0)
        gesture_status = analysis_summary.get('gesture_status', '정적임')
        face_rate = analysis_summary.get('face_detection_rate', 50.0)
        smile_score = analysis_summary.get('smile_score', 0.0) * 100

        system_instruction = (
            f"발표자 '{project_name}'의 발표를 아래 데이터를 기반으로 평가해주세요.\n"
            "각 항목(시선/표정, 음성, 제스처)을 점수와 함께 상세히 분석하고, "
            "종합 점수와 개선 권고사항 3가지를 포함하십시오."
        )

        user_prompt = (
            f"아래는 '{project_name}' 발표자의 AI 분석 결과입니다. "
            "이 데이터를 기반으로 상세한 발표 평가 보고서를 작성해주세요.\n\n"
            f"[분석 데이터]\n"
            f"- 발표자: {project_name}\n"
            f"- PPT 분석: {ppt_summary}\n"
            f"- 음성 분석: 말하기 속도 {speed:.1f}x, {voice_summary}\n"
            f"- 제스처 분석: {gesture_status}\n"
            f"- 시선/표정: 정면 응시율 {face_rate:.1f}%, 미소 점수 {smile_score:.1f}%\n\n"
            "위 데이터를 기반으로 항목별 점수, 종합 점수, 개선 권고사항을 포함한 상세 보고서를 작성하십시오."
        )

        if self.provider == "gemma":
            return self._generate_with_ollama(system_instruction, user_prompt)
        elif self.provider == "gemini":
            return self._generate_with_gemini(system_instruction, user_prompt)
        else:
            return "모델 로드 오류로 피드백을 생성할 수 없습니다."

    # ------------------------------------------------------------------
    # 출력 후처리
    # ------------------------------------------------------------------
    @staticmethod
    def _clean_model_output(text: str) -> str:
        """모델 출력에서 특수 토큰 및 잔여물을 제거합니다."""
        for token in FeedbackEngine._GEMMA_TOKENS_TO_REMOVE:
            text = text.replace(token, '')
        # 연속된 빈 줄 정리 (3줄 이상 → 2줄)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    # ------------------------------------------------------------------
    # Ollama (Gemma 3 GGUF) 추론
    # ------------------------------------------------------------------
    def _generate_with_ollama(self, system_prompt: str, user_prompt: str) -> str:
        """Ollama(GGUF)를 사용한 경량 고속 추론"""
        print(f"   > [AI] Ollama '{self.ollama_model}' (GGUF) 모델로 심층 리포트 생성 중...")
        try:
            import ollama
            response = ollama.chat(
                model=self.ollama_model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                options={
                    'num_predict': 4096,
                    'temperature': 0.7,
                    'repeat_penalty': 1.1,
                }
            )
            raw_result = response['message']['content']
            result = self._clean_model_output(raw_result)
            
            # 품질 검증: 유효 문자가 50자 미만이면 Gemini 폴백
            meaningful_chars = re.sub(r'[\s\[\]\|\#\-\>\:\d\.\,]', '', result)
            if len(meaningful_chars) < 50:
                print(f"   > [AI] ⚠️ Ollama 출력 품질 부족 (유효 문자 {len(meaningful_chars)}자). Gemini 폴백...")
                return self._generate_with_gemini(system_prompt, user_prompt)
            
            print(f"   > [AI] ✅ Ollama 피드백 생성 완료! ({len(result)}자)")
            return result
        except Exception as e:
            print(f"   > [AI] ❌ Ollama 호출 실패: {e}")
            print(f"   > [AI] → Gemini 폴백 시도...")
            return self._generate_with_gemini(system_prompt, user_prompt)

    # ------------------------------------------------------------------
    # Gemini API 폴백
    # ------------------------------------------------------------------
    def _generate_with_gemini(self, system_prompt: str, user_prompt: str) -> str:
        """Gemini API 폴백"""
        print(f"   > [AI] Gemini API를 사용하여 실시간 심층 리포트 생성 중...")
        try:
            import google.generativeai as genai
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
            
            model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
            gemini_model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt
            )
            response = gemini_model.generate_content(user_prompt)
            return response.text
        except Exception as e:
            print(f"❌ Gemini 피드백 생성 실패: {e}")
            return f"피드백 생성 오류 (Gemini): {e}"

    # ------------------------------------------------------------------
    # JSON 데이터 로딩
    # ------------------------------------------------------------------
    def _find_project_json_files(self, project_name: str) -> Dict[str, Path]:
        """프로젝트 이름으로 분석 결과 JSON 파일들을 탐색합니다."""
        base_dir = Path("analysis_json")
        paths = {}
        mapping = {
            "total": "total_json",
            "face": "MediaPipe_json",
            "gesture": "Yolo_json",
            "voice": "Voice_json",
            "ppt": "ppt_json"
        }
        for key, folder in mapping.items():
            search_pattern = str(base_dir / folder / f"*{project_name}*.json")
            files = glob.glob(search_pattern)
            if files:
                paths[key] = Path(files[0])
        return paths

    def _load_json_data(self, paths: Dict[str, Path]) -> Dict[str, Any]:
        """탐색된 JSON 파일들에서 요약 데이터를 로드합니다."""
        detailed = {}
        if "total" in paths:
            try:
                with open(paths["total"], 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    detailed["summary"] = data.get("summary", {})
            except Exception:
                pass
        return detailed

    # ------------------------------------------------------------------
    # 타임라인 피드백 (실시간 자막용)
    # ------------------------------------------------------------------
    def generate_timeline_feedback(self, aligned_data: list, project_name: str, persona: str = "soft") -> Dict[str, str]:
        """타임라인 세그먼트별로 간단한 코칭 팁을 생성합니다."""
        feedback = {}
        for segment in aligned_data:
            time_key = f"{segment['start']:.1f}"
            vision = segment.get("vision_avg", {})
            speed = segment.get("speech_rate_cps", 0)
            
            tips = []
            gaze_h = vision.get("gaze_h", 0)
            if abs(gaze_h) > 0.1:
                tips.append("시선이 흔들립니다. 정면을 응시해주세요.")
            if vision.get("smile", 0) < 0.2:
                tips.append("표정이 다소 굳어있습니다. 미소를 지어보세요.")
            if speed > 7.0:
                tips.append("말의 속도가 조금 빠릅니다. 천천히 말해보세요.")
            
            if tips:
                feedback[time_key] = " ".join(tips)
        
        if not feedback:
            feedback["0.0"] = "안정적인 발표를 진행 중입니다."
            
        return feedback


# 싱글톤 인스턴스
feedback_engine = FeedbackEngine(provider="gemma")
