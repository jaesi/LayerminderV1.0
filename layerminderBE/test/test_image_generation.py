import pytest
from services.img_generation import openai_img_2_img

# -------- Dummy/Mock 클래스 선언 (함수 바깥) --------
class DummyResponse:
    def __init__(self, content):
        self.content = content
    def raise_for_status(self):
        pass

class DummySupabase:
    def __init__(self):
        self._storage = self.storage_class()
    class storage_class:
        def from_(self, bucket):
            return self
        def create_signed_url(self, file_key, expires_in):
            return {"signedUrl": "https://dummy-url.com/test-image"}
        def upload(self, file_key, data):
            return None
        def get_public_url(self, file_key):
            return {"publicUrl": f"https://dummy-url.com/{file_key}"}
    @property
    def storage(self):
        return self._storage

    # 여기에 추가!
    def table(self, table_name):
        class TableMock:
            def insert(self, row):
                class ExecuteResult:
                    error = None
                    def execute(self_):
                        return self_
                return ExecuteResult()
        return TableMock()

class DummyAsyncOpenAI:
    class images_class:
        async def edit(self, **kwargs):
            class Data:
                data = [type('obj', (object,), {'b64_json': "aGVsbG93b3JsZA=="})()]
            return Data()
    def __init__(self):
        self.images = self.images_class()

# ------------- 실제 테스트 함수 -------------
@pytest.mark.asyncio
async def test_generate_images_from_keys(monkeypatch):
    from services import img_generation

    # Dummy 객체 주입
    dummy_supabase = DummySupabase()
    dummy_openai = DummyAsyncOpenAI()
    img_generation.supabase = dummy_supabase
    img_generation.client = dummy_openai

    # requests.get monkeypatch
    def fake_requests_get(url):
        return DummyResponse(content=b"fake_image_bytes")
    monkeypatch.setattr(img_generation.requests, "get", fake_requests_get)

    # 테스트 실행
    result = await img_generation.openai_img_2_img(
        user_id="testuser",
        image_keys=["test.png"],
        keyword="Test prompt"
    )
    # 검증
    assert "image_key" in result
    assert "url" in result
    assert result["url"].startswith("https://dummy-url.com/")
    print("테스트 통과, result:", result)
