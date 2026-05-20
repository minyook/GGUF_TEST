import json
import random
import os

# --- 데이터셋 설정 ---
NUM_SAMPLES = 500
OUTPUT_FILE = r"c:\Users\limmi\Desktop\GGUF_TEST\Capstone2Back\CapstoneDesign_Server\training\dataset.json"

# --- 템플릿 데이터 ---
companies = ["실비아헬스", "메디테크", "오버나잇", "에코비전", "데이터마인드", "AI솔루션즈", "스마트팜", "헬스케어랩", "퓨처테크", "퀀텀에이아이", "비전로보틱스", "사이버시큐리티", "에듀테크코리아"]
names = ["고명진", "김민수", "이서연", "박지훈", "최지원", "정현우", "강수진", "조민재", "윤아영", "장동건", "한소희", "송중기", "아이유"]

# 1. 내용 및 시각화 (Content) - 50점 만점
content_templates = [
    {
        "score_range": (45, 50),
        "ppt_summary": "슬라이드 15장, 텍스트 비중 20%, 시각 자료 풍부",
        "phenomenon": "조부모님과의 경험(Personal Story)에서 시작하여 사회적 문제로 확장하는 서론의 논리 구조가 매우 탄탄합니다.",
        "cause": "민토의 피라미드 원칙에 따라 '문제-현실-솔루션'의 인과관계가 명확하며, 과학적 근거를 제시하여 신뢰도를 확보했습니다.",
        "cognitive": "슬라이드 상단의 헤드라인이 완성된 문장 형태로 구성되어 있어, 청중이 발표자의 말을 듣기 전 이미 핵심 요지를 3초 내에 파악할 수 있도록 설계되었습니다.",
        "solution": "다만, 정보 밀도가 다소 높아 뒷자리 청중에게는 텍스트가 작게 느껴질 수 있습니다. 핵심 수치의 폰트 크기를 현재보다 20% 이상 키워 시각적 위계를 더 강조한다면 완벽한 가독성을 확보할 수 있을 것입니다.",
        "feedback_1": "트랙션(성과) 페이지에서 핵심 지표를 '인포그래픽'화 하여 텍스트 비중을 더 줄이십시오."
    },
    {
        "score_range": (35, 44),
        "ppt_summary": "슬라이드 20장, 텍스트 비중 50%, 텍스트 위주",
        "phenomenon": "전반적인 사업 논리는 훌륭하나, 각 슬라이드에 담긴 텍스트의 양이 다소 많아 청중의 시선이 분산됩니다.",
        "cause": "발표자가 하고 싶은 말이 많을 때 흔히 나타나는 '정보 과부하(Information Overload)' 현상으로, 핵심 메시지가 흐려질 위험이 있습니다.",
        "cognitive": "슬라이드의 줄글은 청중의 뇌가 시각 정보를 처리하는 데 병목 현상을 일으켜 발표자의 음성에 집중하기 어렵게 만듭니다.",
        "solution": "1슬라이드 1메시지 원칙을 적용하여, 줄글 형태의 설명을 핵심 키워드나 도식으로 과감하게 압축하시기 바랍니다.",
        "feedback_1": "텍스트로 나열된 시장 조사 결과를 명확한 파이 차트나 바 그래프 형태로 전환하여 직관성을 높이십시오."
    },
    {
        "score_range": (25, 34),
        "ppt_summary": "슬라이드 10장, 텍스트 비중 80%, 이미지 거의 없음",
        "phenomenon": "발표의 기승전결 구조가 모호하며, 슬라이드가 단순히 발표자의 대본 역할을 하고 있습니다.",
        "cause": "설득의 기본인 스토리텔링 아크(Storytelling Arc)가 부족하여, 문제 제기에서 솔루션으로 넘어가는 과정의 설득력이 약합니다.",
        "cognitive": "시각적 자극이 부족하고 텍스트만 가득한 슬라이드는 청중의 집중력을 1분 이내에 급격히 떨어뜨립니다.",
        "solution": "문제를 제기하는 서론 부분을 보강하고, 텍스트 대신 관련 있는 고품질 이미지나 아이콘을 활용하여 청중의 이목을 집중시키십시오.",
        "feedback_1": "발표 자료 전반의 디자인 템플릿을 통일하고, 텍스트 폰트 크기를 최소 24pt 이상으로 키우십시오."
    }
]

# 2. 전달의 안정성 (Stability) - 30점 만점
stability_templates = [
    {
        "score_range": (27, 30),
        "voice_summary": "속도 1.1x, Jitter 0.5%, 필러워드 1회/분",
        "phenomenon": "음성 주파수 변동(Jitter) 수치가 극히 낮으며, 발표 내내 일정한 성량과 톤을 유지하여 전문적인 인상을 줍니다.",
        "cause": "필러 워드(어, 음) 사용 빈도가 극히 적은 것은 내용에 대한 완벽한 숙지와 반복 훈련의 결과로 분석됩니다.",
        "cognitive": "무게중심이 중앙에 고정되어 있고 불필요한 신체 흔들림이 거의 없어, 청중은 발표자의 움직임에 방해받지 않고 메시지 본연의 가치에만 집중하게 됩니다.",
        "solution": "전반적으로 매우 안정적이나, 비전을 공유하는 마지막 단계에서는 의도적으로 호흡을 조금 더 길게 가져가는 '전략적 휴지(Pause)'를 활용해 보십시오.",
        "feedback_2": "현재의 차분하고 지적인 톤에 더해, 질의응답 시에는 조금 더 에너제틱한 톤을 섞어 사업적 추진력을 보여주면 좋습니다."
    },
    {
        "score_range": (20, 26),
        "voice_summary": "속도 1.4x, Jitter 2.1%, 필러워드 5회/분",
        "phenomenon": "발화 속도가 다소 빠르고 문장 끝이 흐려지는 경향이 있어 정보 전달의 정확성이 약간 저하됩니다.",
        "cause": "긴장감으로 인해 호흡이 짧아지면서 나타나는 전형적인 현상이며, 이로 인해 필러 워드 사용이 증가했습니다.",
        "cognitive": "빠른 속도의 발표는 청중이 정보를 소화할 시간을 주지 않아 피로도를 높이고 핵심 내용에 대한 기억률을 떨어뜨립니다.",
        "solution": "문장과 문장 사이에 1초, 슬라이드가 넘어갈 때 2초의 의도적인 정적(Pause)을 두어 청중이 내용을 소화할 여유를 주십시오.",
        "feedback_2": "발화 속도를 15% 정도 늦추고, 문장의 끝맺음을 '다/까'로 명확하고 강하게 발음하는 연습을 하십시오."
    },
    {
        "score_range": (10, 19),
        "voice_summary": "속도 0.8x, Jitter 5.5%, 필러워드 12회/분",
        "phenomenon": "목소리의 떨림이 관찰되며 잦은 필러워드('어', '그') 사용으로 인해 발표의 흐름이 자주 끊깁니다.",
        "cause": "충분한 리허설 부족 또는 극도의 무대 긴장증으로 인해 성대 근육 제어가 원활하지 않은 상태입니다.",
        "cognitive": "발표자의 불안정한 오디오는 청중에게 무의식적인 불안감을 전이시키며, 발표 내용의 신뢰도마저 의심하게 만듭니다.",
        "solution": "발표 전 복식 호흡을 통해 심박수를 낮추고, 스크립트를 암기하기보다는 슬라이드별 핵심 키워드만 숙지하는 방식으로 연습하십시오.",
        "feedback_2": "본인의 발표를 녹음하여 듣고, 불필요한 필러워드를 의식적으로 침묵(Pause)으로 대체하는 훈련이 시급합니다."
    }
]

# 3. 시각적 비언어 (Non-verbal) - 20점 만점
nonverbal_templates = [
    {
        "score_range": (18, 20),
        "vision_summary": "정면 응시율 92%, 미소 점수 85%, 제스처 활발",
        "phenomenon": "시선 응시율이 90% 이상으로 측정되었으며, 대본을 보지 않고 정면의 청중과 지속적으로 아이컨택을 유지하고 있습니다.",
        "cause": "제스처의 위치가 명치 위 '파워 박스' 영역 내에서 적절하게 이루어지며, 손바닥을 펴는 동작이 신뢰감을 증폭시킵니다.",
        "cognitive": "당당한 포즈와 자신감 있는 표정은 발표자의 비전에 강력한 에토스(Ethos, 화자의 성품과 신뢰)를 부여합니다.",
        "solution": "중반부에서 양손을 모으는 정적인 자세가 관찰됩니다. 수익성을 강조하는 부분에서는 한쪽 손을 활용해 지시 제스처를 더 크게 가져가 보십시오.",
        "feedback_3": "GGUF 환경에서 추론 시, 현재의 피드백 생성 속도는 노트북 기준 약 25초 내외로 예상되므로 실시간 대면 코칭용으로 활용하기에 충분합니다."
    },
    {
        "score_range": (14, 17),
        "vision_summary": "정면 응시율 65%, 미소 점수 40%, 제스처 정적임",
        "phenomenon": "시선이 스크린이나 대본으로 자주 향하며, 제스처 사용 빈도가 낮아 발표가 다소 경직되어 보입니다.",
        "cause": "슬라이드 내용에 대한 의존도가 높거나, 신체 움직임을 통한 에너지 발산에 아직 익숙하지 않기 때문입니다.",
        "cognitive": "정적인 자세와 제한된 아이컨택은 청중과의 심리적 거리를 좁히지 못하고 지루함을 유발할 수 있습니다.",
        "solution": "핵심 키워드를 말할 때 손으로 숫자를 세거나 크기를 표현하는 등 의미 있는 제스처를 의도적으로 한두 개 추가해 보십시오.",
        "feedback_3": "발표 환경 최적화: 시선을 대본이 아닌 청중석을 향하도록 스크린이나 모니터의 위치를 재조정하십시오."
    },
    {
        "score_range": (5, 13),
        "vision_summary": "정면 응시율 30%, 미소 점수 10%, 제스처 없음(경직)",
        "phenomenon": "발표 내내 바닥이나 허공을 응시하며, 표정에 변화가 없고 손을 뒤로 숨기거나 경직된 자세를 유지합니다.",
        "cause": "청중과 시선을 맞추는 것에 대한 심리적 부담감이 크며, 스스로를 방어하려는 닫힌 자세(Closed posture)가 무의식적으로 발현되었습니다.",
        "cognitive": "발표자의 경직된 비언어는 청중에게 소통에 대한 의지가 부족하다는 인상을 주며 전반적인 매력도를 크게 훼손합니다.",
        "solution": "발표 전반부에 가벼운 미소를 지으며 청중 한 명 한 명과 3초씩 눈을 맞추는 'Z자 시선 처리' 연습이 필요합니다.",
        "feedback_3": "대면 코칭이 필수적입니다. 거울을 보며 열린 자세로 서서 미소와 함께 말하는 기초 비언어 훈련부터 시작하십시오."
    }
]

def generate_sample():
    company = random.choice(companies)
    name = random.choice(names)
    
    c_temp = random.choice(content_templates)
    s_temp = random.choice(stability_templates)
    n_temp = random.choice(nonverbal_templates)
    
    c_score = random.randint(*c_temp["score_range"])
    s_score = random.randint(*s_temp["score_range"])
    n_score = random.randint(*n_temp["score_range"])
    
    total_score = c_score + s_score + n_score
    
    if total_score >= 90:
        one_liner = "의학적 전문성과 사업적 논리가 완벽하게 결합된 교과서적인 피칭입니다. 기술적 안정감과 청중 흡입력이 매우 뛰어납니다."
    elif total_score >= 75:
        one_liner = "전반적으로 안정적이고 명확한 피칭이나, 청중의 몰입도를 극대화하기 위한 시각적/청각적 완급 조절이 조금 더 필요합니다."
    else:
        one_liner = "사업 아이템의 가치가 불안정한 전달력과 비효율적인 시각 자료로 인해 온전히 전달되지 못하고 있습니다. 기초적인 스피치 훈련이 필요합니다."

    # Input 데이터 생성
    input_text = f"""[분석 데이터]
- 발표자: {company} {name} 대표
- PPT 분석: {c_temp['ppt_summary']}
- 음성 분석: {s_temp['voice_summary']}
- 시선/비언어: {n_temp['vision_summary']}"""

    # Output 생성
    output_text = f"""📊 [AI 분석 보고서] 발표 종합 평가 결과
발표자: {company} {name} 대표
분석 도구: Whisper (음성), YOLO/MediaPipe (비언어), PPT 분석 엔진

[SUMMARY SCORE]
전체 점수: {total_score} / 100
한줄평: "{one_liner}"

[영역별 상세 피드백]
I. 내용 및 시각화 (Content & Viz) | {c_score} / 50점
[PPT 분석 및 Whisper 스크립트 기반]

현상 파악: {c_temp['phenomenon']}

원인/이론 분석: {c_temp['cause']}

인지적 영향: {c_temp['cognitive']}

솔루션 제언: {c_temp['solution']}

II. 전달의 안정성 (Stability) | {s_score} / 30점
[Whisper 오디오 및 YOLO 움직임 분석 기반]

현상 파악: {s_temp['phenomenon']}

원인/이론 분석: {s_temp['cause']}

인지적 영향: {s_temp['cognitive']}

솔루션 제언: {s_temp['solution']}

III. 시각적 비언어 (Non-verbal) | {n_score} / 20점
[MediaPipe 시선 및 YOLO 제스처 분석 기반]

현상 파악: {n_temp['phenomenon']}

원인/이론 분석: {n_temp['cause']}

인지적 영향: {n_temp['cognitive']}

솔루션 제언: {n_temp['solution']}

[전문가 제언: 향후 개선 방향]
데이터 시각화 강화: {c_temp['feedback_1']}

톤앤매너 변화: {s_temp['feedback_2']}

장비 최적화: {n_temp['feedback_3']}

“{company} 발표 자료에 대한 정밀 분석이 완료되었습니다! 님의 모델이 이 기준대로 학습되어 노트북에서 최상의 피드백을 내놓기를 응원합니다.”"""

    return {
        "instruction": "아래 분석 데이터를 바탕으로 상세한 발표 평가 보고서를 작성해주세요.",
        "input": input_text,
        "output": output_text
    }

dataset = []
for _ in range(NUM_SAMPLES):
    dataset.append(generate_sample())

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"✅ {NUM_SAMPLES}개의 데이터셋 샘플이 생성되어 {OUTPUT_FILE} 에 저장되었습니다.")
