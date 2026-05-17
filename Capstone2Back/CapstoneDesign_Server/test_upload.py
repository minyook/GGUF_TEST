import requests
import time

url = "http://127.0.0.1:8000/api/upload"
ppt_url = "http://127.0.0.1:8000/api/ppt/analyze"

ppt_path = r"C:\Users\임민욱\OneDrive\문서\GitHub\GGUF_TEST\Test\OOM-3 프로젝트 결과발표자료.pptx"
video_path = r"C:\Users\임민욱\OneDrive\문서\GitHub\GGUF_TEST\Test\KakaoTalk_20260429_123820034.mp4"

print("Uploading PPT...")
try:
    res_ppt = requests.post(ppt_url, files={'file': open(ppt_path, 'rb')})
    print("PPT Response:", res_ppt.status_code, res_ppt.json())
except Exception as e:
    print("PPT Upload Failed:", e)

print("Uploading Video...")
try:
    res_video = requests.post(url, files={'file': ('KakaoTalk_20260429_123820034.mp4', open(video_path, 'rb'), 'video/mp4')}, data={'persona': 'soft'})
    print("Video Response:", res_video.status_code)
    res_json = res_video.json()
    print(res_json)
    
    if "job_id" in res_json:
        job_id = res_json["job_id"]
        print(f"Waiting for job {job_id} to finish...")
        
        while True:
            time.sleep(5)
            status_res = requests.get(f"http://127.0.0.1:8000/api/status/{job_id}")
            s_json = status_res.json()
            status = s_json.get("status")
            msg = s_json.get("message", "")
            print(f"Status: {status} | Msg: {msg}")
            if status in ["Complete", "Error"]:
                print("Final Result:", status)
                break
except Exception as e:
    print("Video Upload Failed:", e)
