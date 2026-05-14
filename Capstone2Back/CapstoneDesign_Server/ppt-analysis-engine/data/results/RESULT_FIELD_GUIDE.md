# PPT 분석 결과(JSON) 필드 설명

이 문서는 `data/results/*.json` 파일의 각 필드가 무엇을 뜻하는지 쉽게 보기 위한 설명서입니다.

## 1) 최상위 구조

- `metadata`: 파일 기본 정보
- `normalized_metrics`: 전체 발표자료의 평균 점수(0~1)
- `quantitative_stats`: 전체 개수/통계
- `slides`: 슬라이드별 상세 분석 결과

---

## 2) `metadata`

- `file_name`: 분석한 PPT 파일명
- `slide_count`: 총 슬라이드 수
- `generated_at`: 분석 완료 시각

---

## 3) `normalized_metrics` (전체 평균 지표)

- `readability`  
  글자 크기 기준 가독성 점수 평균입니다.  
  값이 클수록 "읽기 편한 글자 크기" 비율이 높다는 뜻입니다.

- `visual_balance`  
  텍스트 영역과 이미지 영역의 균형 점수 평균입니다.  
  값이 클수록 한쪽으로 과하게 치우치지 않았다는 뜻입니다.

- `consistency`  
  슬라이드 간 일관성 점수입니다.  
  현재 로직에서는 텍스트 과다(`text_overload`) 슬라이드가 적을수록 높습니다.

---

## 4) `quantitative_stats` (개수 기반 통계)

- `slide_count`: 총 슬라이드 수
- `image_count_total`: 전체 이미지 개수 합
- `text_box_count_total`: 전체 텍스트 박스 개수 합
- `text_overload`: 텍스트가 많은 슬라이드 인덱스 목록
- `readability_flags.text_overload`: 위와 동일한 정보(호환용)

---

## 5) `slides[]` (슬라이드별 결과)

각 원소는 슬라이드 1장에 대한 분석 결과입니다.

- `index`: 슬라이드 번호(0부터 시작)
- `title`: 슬라이드 제목
- `summary_points`: 핵심 문장 목록(최대 3개)
- `images`: 이미지별 텍스트 연관 정보
- `visual_balance_score`: 해당 슬라이드 레이아웃 균형 점수
- `readability_score`: 해당 슬라이드 가독성 점수
- `flags`: 자동 판정 태그 목록

### 5-1) `images[]`

- `name`: 이미지 이름(파워포인트 내부 이름)
- `context`: 이미지 근처의 대표 텍스트(가장 가까운 텍스트 박스 기반)
- `distance_emu`: 이미지와 텍스트 중심점 사이 거리(EMU 단위, 작을수록 가까움)

### 5-2) `flags` 예시

- `font_size_ok`: 글자 크기 기준이 대체로 적절함
- `font_size_small`: 글자 크기가 작은 편
- `image_text_matched`: 이미지와 연관 텍스트를 찾음
- `image_text_unmatched`: 이미지는 있지만 연관 텍스트를 찾기 어려움
- `text_overload`: 텍스트 양이 많은 슬라이드

