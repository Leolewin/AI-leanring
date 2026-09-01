#!/usr/bin/env python3
"""Serve the learning app and proxy requests to an OpenAI-compatible API."""

from __future__ import annotations

import json
import os
import posixpath
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8010"))


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/health":
            self._send_json(200, {"ok": True})
            return
        if self.path == "/api/config":
            model = os.getenv("AI_MODEL", "gpt-4.1-mini")
            self._send_json(200, {"configured": bool(os.getenv("AI_API_KEY")), "model": model})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/chat":
            self._send_json(404, {"error": "Unknown endpoint"})
            return

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            self._send_json(503, {"error": "AI_API_KEY 尚未配置"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "无效的 Content-Length"})
            return
        if content_length <= 0 or content_length > 100_000:
            self._send_json(400, {"error": "请求内容为空或过大"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "请求必须是有效 JSON"})
            return

        input_text = str(payload.get("input", "")).strip()
        focus = str(payload.get("focus", "")).strip()
        if not input_text:
            self._send_json(400, {"error": "缺少新闻素材"})
            return

        try:
            result = request_brief(input_text, focus, api_key)
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:600]
            self._send_json(502, {"error": f"模型 API 返回 {error.code}: {detail}"})
            return
        except urllib.error.URLError as error:
            self._send_json(502, {"error": f"无法连接模型 API: {error.reason}"})
            return
        except (KeyError, IndexError, json.JSONDecodeError) as error:
            self._send_json(502, {"error": f"模型响应格式不符合预期: {error}"})
            return

        self._send_json(200, result)

    def translate_path(self, path: str) -> str:
        translated = super().translate_path(path)
        resolved = Path(translated).resolve()
        if ROOT not in resolved.parents and resolved != ROOT:
            return str(ROOT / "index.html")
        return str(resolved)

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, message: str, *args: Any) -> None:
        print(f"[server] {self.address_string()} - {message % args}")


def request_brief(input_text: str, focus: str, api_key: str) -> dict[str, Any]:
    base_url = os.getenv("AI_API_BASE", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("AI_MODEL", "gpt-4.1-mini")
    system_prompt = (
        "你是一名严谨的 AI 行业情报分析师。只根据用户提供的材料工作，不编造事实。"
        "把重复内容合并，区分事实与判断。用中文输出：\n"
        "## 今日三条关键信号\n每条包含：发生了什么、为什么重要、置信度。\n"
        "## 对我的影响\n结合用户关注方向。\n"
        "## 下一步行动\n给出 1-3 个低成本、可执行动作。\n"
        "## 仍需验证\n列出材料不足或可能误导的地方。"
    )
    body = {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"关注方向：{focus or 'AI 产品与技术'}\n\n素材：\n{input_text}"},
        ],
    }
    request = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.load(response)
    return {
        "content": payload["choices"][0]["message"]["content"],
        "model": payload.get("model", model),
        "usage": payload.get("usage", {}),
    }


if __name__ == "__main__":
    os.chdir(ROOT)
    print(f"AI 入门一周通已启动：http://{HOST}:{PORT}")
    if not os.getenv("AI_API_KEY"):
        print("提示：未配置 AI_API_KEY，课程和新闻可正常使用，创业实验室处于演示模式。")
    ThreadingHTTPServer((HOST, PORT), AppHandler).serve_forever()
