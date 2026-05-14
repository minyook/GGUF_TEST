from enum import Enum

class VideoType(str, Enum):
    VOICE_ONLY = "VOICE_ONLY"         # 1. 사람 없음 (PPT+목소리)
    FACE_ONLY = "FACE_ONLY"           # 2. 얼굴만 (표정+PPT+목소리)
    UPPER_BODY = "UPPER_BODY"         # 3. 상반신 (포즈+표정+PPT+목소리)
    FULL_BODY = "FULL_BODY"           # 4. 전신 (동선+포즈+표정+PPT+목소리)