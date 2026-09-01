#!/usr/bin/env python3
"""Aggregate high-signal AI news and GitHub ecosystem updates."""

from __future__ import annotations

import email.utils
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
ECOSYSTEM_OUTPUT = ROOT / "data" / "ecosystem.json"
USER_AGENT = "AI-Learning-Radar/1.0 (+https://github.com/Leolewin/AI-leanring)"

FEEDS = [
    ("OpenAI News", "https://openai.com/news/rss.xml", "模型发布", 10),
    ("Google AI", "https://blog.google/technology/ai/rss/", "模型发布", 9),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml", "研究", 8),
    ("MIT Technology Review AI", "https://www.technologyreview.com/topic/artificial-intelligence/feed", "行业新闻", 8),
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/", "行业新闻", 6),
]

REPOSITORIES = [
    ("langchain-ai/langgraph", "LangChain / LangGraph", "框架更新"),
    ("openai/openai-agents-python", "OpenAI Agents SDK", "Agent / Skills"),
    ("microsoft/autogen", "AutoGen", "Agent / Skills"),
    ("crewAIInc/crewAI", "CrewAI", "Agent / Skills"),
    ("run-llama/llama_index", "LlamaIndex", "框架更新"),
    ("mastra-ai/mastra", "Mastra", "框架更新"),
    ("vercel/ai", "Vercel AI SDK", "框架更新"),
    ("huggingface/transformers", "Transformers", "模型发布"),
]

HIGH_SIGNAL = re.compile(
    r"\b(model|agent|agents|reasoning|multimodal|benchmark|release|launch|open.source|"
    r"framework|mcp|skill|rag|inference|training|context|safety|eval|research)\b|"
    r"模型|智能体|发布|推理|多模态|框架|评测|开源|上下文",
    re.IGNORECASE,
)


def fetch(url: str, accept: str = "*/*") -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read()


def text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return " ".join("".join(element.itertext()).split())


def parse_date(raw: str) -> datetime:
    if not raw:
        return datetime.now(UTC)
    try:
        parsed = email.utils.parsedate_to_datetime(raw)
        return parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except ValueError:
            return datetime.now(UTC)


def clean_html(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()[:240]


def parse_feed(source: str, url: str, category: str, weight: int) -> list[dict[str, Any]]:
    root = ET.fromstring(fetch(url, "application/rss+xml, application/atom+xml, text/xml"))
    items: list[dict[str, Any]] = []
    candidates = root.findall(".//item")
    if candidates:
        for node in candidates[:15]:
            title = text(node.find("title"))
            link = text(node.find("link"))
            description = text(node.find("description"))
            published = text(node.find("pubDate"))
            items.append(make_item(title, link, description, published, source, category, weight))
        return items

    atom_ns = {"atom": "http://www.w3.org/2005/Atom"}
    for node in root.findall(".//atom:entry", atom_ns)[:15]:
        link_node = node.find("atom:link", atom_ns)
        link = link_node.attrib.get("href", "") if link_node is not None else ""
        title = text(node.find("atom:title", atom_ns))
        description = text(node.find("atom:summary", atom_ns)) or text(node.find("atom:content", atom_ns))
        published = text(node.find("atom:published", atom_ns)) or text(node.find("atom:updated", atom_ns))
        items.append(make_item(title, link, description, published, source, category, weight))
    return items


def make_item(
    title: str,
    url: str,
    summary: str,
    published: str,
    source: str,
    category: str,
    weight: int,
) -> dict[str, Any]:
    date = parse_date(published)
    age_days = max(0, (datetime.now(UTC) - date).days)
    signal_bonus = 8 if HIGH_SIGNAL.search(f"{title} {summary}") else 0
    score = max(0, 30 - age_days) + weight + signal_bonus
    return {
        "title": clean_html(title),
        "summary": clean_html(summary),
        "url": url,
        "source": source,
        "date": date.date().isoformat(),
        "category": category,
        "score": score,
    }


def github_repository(repo: str, display_name: str, category: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    metadata = json.loads(fetch(f"https://api.github.com/repos/{repo}", "application/vnd.github+json"))
    releases = json.loads(fetch(f"https://api.github.com/repos/{repo}/releases?per_page=2", "application/vnd.github+json"))
    items: list[dict[str, Any]] = []
    for release in releases:
        published = release.get("published_at") or release.get("created_at")
        summary = clean_html(release.get("body") or "")
        items.append(
            make_item(
                f"{display_name} 发布 {release.get('name') or release.get('tag_name')}",
                release.get("html_url", metadata["html_url"]),
                summary or f"{display_name} 发布了新版本，建议查看变更说明与迁移提示。",
                published,
                "GitHub Release",
                category,
                10,
            )
        )
    return items, {
        "repo": repo,
        "stars": metadata.get("stargazers_count", 0),
        "forks": metadata.get("forks_count", 0),
        "updatedAt": metadata.get("pushed_at"),
    }


def deduplicate(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in sorted(items, key=lambda value: (value["score"], value["date"]), reverse=True):
        key = re.sub(r"\W+", "", item["title"].lower())[:90]
        if not key or key in seen or not item["url"]:
            continue
        seen.add(key)
        result.append(item)
    return result


def update_ecosystem(stats: dict[str, dict[str, Any]]) -> None:
    data = json.loads(ECOSYSTEM_OUTPUT.read_text(encoding="utf-8"))
    by_name = {item["name"]: item for item in data["frameworks"]}
    name_map = {display: repo for repo, display, _ in REPOSITORIES}
    for name, item in by_name.items():
        repo = name_map.get(name)
        if repo and repo in stats:
            item["stars"] = stats[repo]["stars"]
    data["updatedAt"] = datetime.now(UTC).isoformat()
    ECOSYSTEM_OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    all_items: list[dict[str, Any]] = []
    errors: list[str] = []
    repo_stats: dict[str, dict[str, Any]] = {}
    cutoff = datetime.now(UTC).date() - timedelta(days=45)

    for source, url, category, weight in FEEDS:
        try:
            all_items.extend(parse_feed(source, url, category, weight))
            print(f"[ok] {source}")
        except (urllib.error.URLError, ET.ParseError, TimeoutError, ValueError) as error:
            message = f"{source}: {error}"
            errors.append(message)
            print(f"[warn] {message}", file=sys.stderr)

    for repo, display_name, category in REPOSITORIES:
        try:
            items, stats = github_repository(repo, display_name, category)
            all_items.extend(items)
            repo_stats[repo] = stats
            print(f"[ok] {repo}")
        except (urllib.error.URLError, json.JSONDecodeError, KeyError, TimeoutError) as error:
            message = f"{repo}: {error}"
            errors.append(message)
            print(f"[warn] {message}", file=sys.stderr)

    recent_items = [item for item in all_items if datetime.fromisoformat(item["date"]).date() >= cutoff]
    final_items = deduplicate(recent_items)[:48]
    if not final_items:
        print("[error] No news items were collected; existing output was preserved.", file=sys.stderr)
        return 1

    payload = {"updatedAt": datetime.now(UTC).isoformat(), "items": final_items, "errors": errors}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if repo_stats:
        update_ecosystem(repo_stats)
    print(f"Wrote {len(final_items)} items to {OUTPUT.relative_to(ROOT)} ({len(errors)} source errors)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
