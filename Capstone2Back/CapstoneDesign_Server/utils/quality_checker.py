import cv2
from pathlib import Path

def check_video_quality(video_path: Path) -> bool:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened(): return False
    ret, frame = cap.read()
    cap.release()
    return ret # 영상이 열리고 첫 프레임이 읽히면 통과

def check_audio_quality(video_path: Path) -> bool:
    # 임시 통과 (추후 FFmpeg로 오디오 트랙 존재 여부 확인 로직 추가 가능)
    return True