import os
import json
import sys
import io
import glob
import torch
from pathlib import Path
from typing import Dict, Any, Optional
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 터미널 출력 한글 깨짐 방지
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class FeedbackEngine:
    def __init__(self, provider: str = "exaone"):
        self.provider = provider.lower()
        self.local_model = None
        self.local_tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        if self.provider == "exaone":
            self._init_local_model()

    def _init_local_model(self):
        curr_dir = os.path.dirname(os.path.abspath(__file__))
        base_model_name = "LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct"
        lora_path = os.path.join(os.path.dirname(curr_dir), "training", "exaone_presenter_lora")

        print(f"\n--- [FeedbackEngine] 모델 로드 중 ({self.device} 모드) ---")
        try:
            # 1. 토크나이저 로드
            self.local_tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
            
            # 2. 베이스 모델 로드
            base_model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            ).to(self.device)

            # --- [Patch] EXAONE 모델의 Peft 호환성 이슈 해결 ---
            def patch_exaone_embeddings(model):
                model.get_input_embeddings = lambda: model.transformer.wte
                model.set_input_embeddings = lambda value: setattr(model.transformer, 'wte', value)
                model.transformer.get_input_embeddings = lambda: model.transformer.wte
                model.transformer.set_input_embeddings = lambda value: setattr(model.transformer, 'wte', value)
            
            patch_exaone_embeddings(base_model)
            # ------------------------------------------------
            
            # 3. LoRA 어댑터 강제 로드 (학습한 내용 적용)
            if os.path.exists(lora_path):
                print(f"   > [LoRA] 학습된 가중치를 적용합니다: {lora_path}")
                self.local_model = PeftModel.from_pretrained(base_model, lora_path)
            else:
                print("   > [Warn] LoRA 폴더를 찾을 수 없어 기본 모델로 로드합니다.")
                self.local_model = base_model
                
            self.local_model.eval()
            print(f"✅ 모델 및 학습 데이터 로드 완료!")
        except Exception as e:
            print(f"❌ 모델 로드 실패: {e}")
            self.provider = "gemini"

    def generate_feedback(self, project_name: str, rubric: str = "", persona: str = "soft") -> str:
        # 데이터 취합 (기존 로직)
        json_paths = self._find_project_json_files(project_name)
        detailed_data = self._load_json_data(json_paths)
        analysis_summary = detailed_data.get("summary", {})
        
        # 프롬프트 구성 (마크다운 및 줄바꿈 강조)
        prompt_style = """[|system|]
당신은 대한민국 최고의 발표 전문가이자 스피치 컨설턴트입니다. 
입력된 기술 분석 데이터를 바탕으로 사용자의 발표에 대해 전문적인 피드백을 제공하십시오.

[출력 규칙]
1. 반드시 한국어로 답변하십시오.
2. 가독성을 위해 마크다운(Markdown) 형식을 사용하십시오.
3. 다음 3가지 영역(I, II, III)을 대제목(##)으로 하여 분석하십시오:
   ## I. 내용 및 시각화 (Content & Viz)
   ## II. 전달의 안정성 (Stability)
   ## III. 시각적 비언어 (Non-verbal)
4. 각 분석 항목별로 상세 내용은 글머리 기호(-)를 사용하여 3줄 이상 작성하십시오.
5. 마지막에는 종합적인 개선 방향과 [보너스] 감점 및 가산점 예상(시간 미준수 시 -5점, Q&A 대응 시 +5점 가산점)을 포함하여 '총평'으로 요약하십시오.

[|user|]
제시된 기술 분석 데이터(PPT, Whisper, YOLO, MediaPipe)를 기반으로 분석 보고서를 작성해줘.
[{project_name}] 
- PPT: {ppt_summary}
- Whisper(음성): 말하기 속도 {speed:.1f}x, {voice_summary}
- YOLO(자세): 제스처 상태({gesture_status})
- MediaPipe(시선): 정면 응시율 {face_rate:.1f}%, 미소 점수 {smile_score:.1f}%

[|assistant|]
"""
        # 데이터 매핑
        prompt = prompt_style.format(
            project_name=project_name,
            ppt_summary=analysis_summary.get('ppt_summary', '데이터 없음'),
            voice_summary=analysis_summary.get('voice_summary', ''),
            speed=analysis_summary.get('avg_speed', 1.0),
            gesture_status=analysis_summary.get('gesture_status', '정적임'),
            face_rate=analysis_summary.get('face_detection_rate', 50.0),
            smile_score=analysis_summary.get('smile_score', 0.0) * 100
        )

        if self.provider == "exaone" and self.local_model:
            print(f"   > [AI] 학습된 지식을 바탕으로 심층 리포트 생성 중...")
            inputs = self.local_tokenizer([prompt], return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.local_model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    temperature=0.7,
                    repetition_penalty=1.2,
                    do_sample=True,
                    eos_token_id=self.local_tokenizer.eos_token_id
                )
            response = self.local_tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
            
            # 답변 추출 및 줄바꿈 정리
            if "[|assistant|]" in response:
                final_text = response.split("[|assistant|]")[1].strip()
            else:
                final_text = response.strip()
            
            # 소제목 앞뒤 줄바꿈 보강 (가독성 향상)
            final_text = final_text.replace("##", "\n\n##").replace("###", "\n###")
            return final_text
        else:
            return "모델 로드 오류로 피드백을 생성할 수 없습니다."

    def _find_project_json_files(self, project_name: str) -> Dict[str, Path]:
        base_dir = Path("analysis_json")
        paths = {}
        mapping = {"total": "total_json", "face": "MediaPipe_json", "gesture": "Yolo_json", "voice": "Voice_json", "ppt": "ppt_json"}
        for key, folder in mapping.items():
            search_pattern = str(base_dir / folder / f"*{project_name}*.json")
            import glob
            files = glob.glob(search_pattern)
            if files: paths[key] = Path(files[0])
        return paths

    def _load_json_data(self, paths: Dict[str, Path]) -> Dict[str, Any]:
        detailed = {}
        if "total" in paths:
            try:
                with open(paths["total"], 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    detailed["summary"] = data.get("summary", {})
            except: pass
        return detailed

    def generate_timeline_feedback(self, aligned_data: list, project_name: str, persona: str = "soft") -> Dict[str, str]:
        feedback = {}
        for segment in aligned_data:
            time_key = f"{segment['start']:.1f}"
            vision = segment.get("vision_avg", {})
            speed = segment.get("speech_rate_cps", 0)
            
            tips = []
            if vision.get("gaze_h", 0) > 0.1 or vision.get("gaze_h", 0) < -0.1:
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

feedback_engine = FeedbackEngine(provider="exaone")
