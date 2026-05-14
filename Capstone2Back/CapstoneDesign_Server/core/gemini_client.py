import os
import time
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict, Any

# .env 파일에서 GEMINI_API_KEY 로드
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ 경고: GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")

# 모델 설정 (Files API 지원을 위해 1.5 Flash 또는 최신 모델 권장)
model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-3-flash-preview")
model = genai.GenerativeModel(
    model_name=model_name,
    system_instruction="""
당신은 'Overnight AI'의 수석 컨설턴트입니다. 
사용자의 질문에 대해 전문적이고 논리적인 '마크다운(Markdown)' 형식으로 답변하십시오.
첨부된 파일(PPT, PDF 등)이 있다면, 그 내용을 실시간으로 분석하여 구체적인 피드백을 제공하십시오.

[답변 규칙]
1. **데이터 기반**: 파일의 텍스트와 이미지 컨텍스트를 정확히 인용하십시오.
2. **가독성**: 섹션을 명확히 나누고 불필요한 공백을 제거하십시오.
3. **전문성**: 발표 전략, 디자인, 논리 구조 측면에서 깊이 있는 분석을 제공하십시오.
4. **언어**: 한국어(KO-KR)로만 답변하십시오.
"""
)

def upload_to_gemini(path: str, mime_type: str = None):
    """
    Gemini Files API를 사용하여 파일을 업로드합니다.
    """
    try:
        file = genai.upload_file(path, mime_type=mime_type)
        print(f"   > [Files API] 파일 업로드 완료: {file.uri}")
        
        # 파일 처리가 완료될 때까지 대기 (상태 체크)
        while file.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(2)
            file = genai.get_file(file.name)
            
        if file.state.name == "FAILED":
            raise Exception("Gemini 파일 처리 실패")
            
        return file
    except Exception as e:
        print(f"❌ Gemini 파일 업로드 오류: {e}")
        return None

def stream_chat_with_gemini(user_message: str, chat_history: List[Dict[str, str]] = None, attachments: List[Any] = None):
    """
    Gemini API를 사용하여 스트리밍 답변을 생성합니다. (파일 첨부 지원)
    """
    if chat_history is None:
        chat_history = []

    gemini_history = []
    for msg in chat_history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})

    try:
        chat_session = model.start_chat(history=gemini_history)
        
        # 메시지 구성 (텍스트 + 파일)
        content_parts = [user_message]
        if attachments:
            content_parts.extend(attachments)
            
        response = chat_session.send_message(content_parts, stream=True)
        
        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        print(f"❌ Gemini Streaming API 오류: {e}")
        yield f"죄송합니다. 답변을 생성하는 중 오류가 발생했습니다: {str(e)}"

def chat_with_gemini(user_message: str, chat_history: List[Dict[str, str]] = None, attachments: List[Any] = None) -> List[Dict[str, str]]:
    """
    Gemini API를 사용하여 챗봇 답변을 생성합니다. (파일 첨부 지원)
    """
    if chat_history is None:
        chat_history = []

    gemini_history = []
    for msg in chat_history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})

    try:
        chat_session = model.start_chat(history=gemini_history)
        
        content_parts = [user_message]
        if attachments:
            content_parts.extend(attachments)
            
        response = chat_session.send_message(content_parts)
        
        chat_history.append({"role": "user", "content": user_message})
        chat_history.append({"role": "assistant", "content": response.text})
        
        return chat_history

    except Exception as e:
        print(f"❌ Gemini API 오류: {e}")
        if not any(msg["content"] == user_message for msg in chat_history):
            chat_history.append({"role": "user", "content": user_message})
        chat_history.append({"role": "assistant", "content": f"오류 발생: {str(e)}"})
        return chat_history
