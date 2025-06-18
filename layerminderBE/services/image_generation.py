import requests
import os

STABILITYAI_API = os.getenv("STABILITYAI_API_KEY")

def call_stability_ai(input_image_url, keyword):
    payload = {
        "image": input_image_url,
        "prompt": keyword or "",
    }
    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/control/style",
        json = payload,
        headers={"Authorization": f"Bearer {stability_api_key}"}
    )
    result = response.json()
    return [{
        "image_id": resul.get("id", "stability_img_001"),
        "s3url": result.get("image_url", )
    }]