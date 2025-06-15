import httpx
import base64
from typing import Optional, List
from pathlib import Path

from layerminderBE.core.config import settings

class ImageService:
    """
    Service for mixing a single input image using Stability AI's multipart/form-data API.
    """
    def __init__(self):
        self.url = "https://api.stability.ai/v2beta/stable-image/control/style"
        self.api_key = settings.STABILITYAI_API_KEY

    async def mix_image(self,
                        image_path: Path,
                        prompt: str,
                        negative_prompt: Optional[str] = None,
                        samples: int = 4,
                        fidelity: float = 0.5,
                        aspect_ratio: str = "1:1",
                        seed: int = 0,
                        style_preset: Optional[str] = None
                        ) -> List[bytes]:
        """
        Mix a single input image to generate samples using Stability AI image-to-image endpoint.
        image_path: file path to read binary image from.
        Returns a list of generated image bytes.
        """
        # Read image bytes
        data = image_path.read_bytes()
        # Build multipart form fields
        files = []
        files.append(("prompt", (None, prompt)))
        if negative_prompt:
            files.append(("negative_prompt", (None, negative_prompt)))
        files.append(("aspect_ratio", (None, aspect_ratio)))
        files.append(("fidelity", (None, str(fidelity))))
        files.append(("seed", (None, str(seed))))
        files.append(("samples", (None, str(samples))))
        if style_preset:
            files.append(("style_preset", (None, style_preset)))
        files.append(("image", (image_path.name, data, "application/octet-stream")))

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.url, headers=headers, files=files)
            response.raise_for_status()
            result = response.json()

        artifacts = result.get("artifacts", [])
        if not artifacts:
            raise RuntimeError("No artifacts returned from Stability API")

        images: List[bytes] = []
        for art in artifacts[:samples]:
            if "base64" in art:
                images.append(base64.b64decode(art["base64"]))
            elif "url" in art:
                img_resp = await client.get(art["url"])
                img_resp.raise_for_status()
                images.append(img_resp.content)
        return images