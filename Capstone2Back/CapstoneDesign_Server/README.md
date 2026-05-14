# 🌙 Overnight.AI : AI 기반 발표 자동 평가 시스템 (Server)


**Overnight.AI**는 사용자가 발표 영상을 업로드하면 **Vision(시각), Audio(청각), Text(언어)** 데이터를 멀티모달로 분석하여 객관적인 점수와 맞춤형 피드백을 제공하는 AI 멘토 서비스입니다.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision-blue)
![OpenAI Whisper](https://img.shields.io/badge/OpenAI-Whisper-412991?logo=openai&logoColor=white)

---

## 🔗 Client Repository
안드로이드 앱(Kotlin) 구현 내용과 UI 소스 코드는 아래 클라이언트 레포지토리에서 확인하실 수 있습니다.

👉 **[Overnight.AI Client Repository (Android/Kotlin) 바로가기](https://github.com/myname-jin/CapstoneDesign_Client)**

---

## 📱 Service Workflow
사용자 앱 화면을 통해 서버의 분석 과정을 시각적으로 소개합니다.

### 1. 메인 홈 & 서비스 가이드
사용자는 메인 화면에서 새로운 발표 연습을 시작하거나, 대본 작성 및 평가 기준 가이드를 확인할 수 있습니다.

| 메인 홈 화면 | 서비스 가이드 |
| :---: | :---: |
| <img src="report/메인화면.jpg" width="300" /> | <img src="report/서비스화면1.jpg" width="300" /> |
| **직관적인 홈 UI**<br>Script(대본) 및 Guide(평가 기준) 제공 | **평가 기준 안내**<br>AI가 어떤 요소를 분석하는지 사전 안내 |

### 2. 영상 업로드 & AI 정밀 분석
영상이 서버로 전송되면 **비동기 작업 큐(Background Tasks)**를 통해 분석 파이프라인이 가동됩니다.

| 영상 업로드 | AI 분석 진행 중 |
| :---: | :---: |
| <img src="report/영상업로드화면.jpg" width="300" /> | <img src="report/얼굴분석.jpg" width="300" /> |
| **영상 전송**<br>촬영된 발표 영상을 서버로 업로드 | **멀티모달 분석**<br>FFmpeg 분리 → MediaPipe(시선/표정) & Whisper(음성) 병렬 처리 |

### 3. 분석 결과 & 상세 피드백
분석이 완료되면 **GPT-4o**가 생성한 종합 리포트와 정량적 수치 데이터를 제공합니다.

| 종합 점수 차트 | 상세 피드백 |
| :---: | :---: |
| <img src="report/영상분석결과1.jpg" width="300" /> | <img src="report/영상분석결과2.jpg" width="300" /> |
| **도넛 차트 시각화**<br>사용자가 설정한 기준에 따른 종합 점수 산출 | **항목별 상세 코칭**<br>제스처, 목소리 크기 등 구체적인 개선점 제안 |

---

## 🏗 System Architecture & Logic

### 📡 Server Analysis Pipeline
서버는 대용량 영상 처리를 위해 **병렬 처리 구조**를 채택했습니다.

1.  **Preprocessing**: `FFmpeg`를 이용해 영상에서 오디오(.wav)와 프레임 이미지(.jpg)를 추출합니다.
2.  **Vision Analysis**: `MediaPipe`를 통해 매 프레임마다 발표자의 **시선(Gaze), 표정(Smile/Frown), 자세**를 수치화합니다.
3.  **Audio Analysis**: 
    * `Whisper (Local)`: 음성을 텍스트로 변환(STT)하고 타임스탬프를 추출합니다.
    * `Praat`: 목소리의 떨림(Jitter), 거칠기(Shimmer) 등 운율적 특징을 분석합니다.
4.  **Data Fusion**: 서로 다른 타임스탬프를 가진 시각/청각 데이터를 문장 단위로 정렬(`align_data`)합니다.
5.  **AI Scoring**: 융합된 데이터를 `OpenAI GPT-4o`에 전달하여 JSON 포맷의 채점 결과와 피드백을 생성합니다.
---
 #실행 순서
1. 가상환경 생성 (Windows)
python -m venv venv

2. 가상환경 활성화 (Windows)
.\venv\Scripts\activate

3. 의존성 패키지 설치
pip install -r requirements.txt

4. .env 파일 생성 후 입력
OPENAI_API_KEY=sk-your-api-key-here
---

## 📂 Project Structure
PDF 보고서 및 소스 코드 기반의 서버 디렉토리 구조입니다.

```bash
backend/
 ├── main.py                 # FastAPI 엔트리포인트 (API 라우터, CORS 설정)
 ├── processing/             # 핵심 분석 로직
 │   ├── task_manager.py     # 비동기 파이프라인 관리 (6단계 프로세스 제어)
 │   ├── video_analyzer.py   # FFmpeg 활용 오디오/프레임 추출
 │   ├── face_analyzer.py    # MediaPipe 활용 시선/표정/자세 분석
 │   ├── audio_analyzer.py   # Whisper STT 및 Praat 음성 분석
 │   ├── data_combiner.py    # 시각/청각 데이터 타임스탬프 정렬 (Fusion)
 │   ├── ai_scorer.py        # OpenAI API 연동 및 프롬프트 엔지니어링 (JSON 출력)
 │   └── chat_manager.py     # 대본 작성을 위한 챗봇 기능
 ├── utils/
 │   ├── helpers.py          # 파일 시스템 관리, 임시 폴더 생성/삭제
 │   └── json_helpers.py     # 결과 데이터(JSON) 저장 관리
 ├── report/                 # README용 이미지 리소스 폴더
 ├── face_landmarker.task    # MediaPipe 모델 파일
 └── requirements.txt        # 프로젝트 의존성 패키지 목록


