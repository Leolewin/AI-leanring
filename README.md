# AI 入门一周通

一个给 AI 初学者的中文学习与情报系统：用 7 天理解主流模型原理，完成一个可运行的 AI 创业 MVP，并通过自动更新的新闻雷达持续跟踪模型、框架、Agent Harness 与 Skills。

## 你会得到什么

- **7 天系统课程**：从 Token、Embedding、Transformer，到训练、Prompt、RAG、Agent、Harness、Eval 和 AI 产品化。
- **交互式学习进度**：任务清单和产品画布保存在浏览器本地。
- **AI 信号雷达**：聚合模型厂商、AI 媒体、Hugging Face 和主流 GitHub 项目发布。
- **生态榜**：持续更新 LangGraph、OpenAI Agents SDK、AutoGen、CrewAI、LlamaIndex、Mastra、Vercel AI SDK 和 Transformers。
- **Startup Lab**：连接任意 OpenAI-compatible API，生成有事实边界、影响分析和行动建议的 AI 决策简报。
- **自动化**：GitHub Actions 每天三次刷新数据，并将静态站点部署到 GitHub Pages。

## 立即体验

项目没有前端依赖，也不需要构建：

```bash
python3 server.py
```

打开 <http://127.0.0.1:8000>。

如果只想看课程和新闻，也可以使用任意静态服务器。不要直接双击 `index.html`，浏览器可能阻止 JSON 数据加载。

## 连接真实模型

服务端支持所有实现了 OpenAI Chat Completions 接口的服务：

```bash
export AI_API_KEY="你的 API Key"
export AI_API_BASE="https://api.openai.com/v1"
export AI_MODEL="gpt-4.1-mini"
python3 server.py
```

Key 只存在于服务端环境变量，不会发送到浏览器或写入仓库。

## 更新 AI 新闻

```bash
python3 scripts/update_news.py
```

脚本使用 Python 标准库：

1. 抓取 OpenAI、Google AI、Hugging Face、MIT Technology Review AI 和 TechCrunch AI 的 RSS。
2. 获取主流 AI 框架的 GitHub Release 与实时 Star。
3. 按来源权重、时效性和 AI 关键词评分。
4. 去重后写入 `data/news.json`，并刷新 `data/ecosystem.json`。

单个来源失败会明确记录到 `errors`；如果所有来源都失败，脚本退出并保留上一次有效数据。

## 一周使用建议

| 天 | 主题 | 最终产出 |
|---|---|---|
| 1 | AI 与 LLM 全景 | 能用自己的话解释大模型 |
| 2 | Token、向量、Attention | 画出 Transformer 信息流 |
| 3 | 预训练、后训练、推理 | 会读模型发布说明 |
| 4 | Prompt 与 Eval | 建立第一个五题评测集 |
| 5 | RAG、工具与 MCP | 设计一个有证据的问答流 |
| 6 | Agent、Workflow、Harness、Skill | 设计有停止条件的 Agent |
| 7 | Startup MVP | 发布 AI Brief Copilot 并找首位用户 |

## 调研依据

本项目不是简单 Fork，而是综合以下高口碑开源项目后，为“一周中文入门 + 持续情报 + 创业实战”重新设计：

- [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners)：21 节 Learn / Build 初学者课程。
- [mlabonne/llm-course](https://github.com/mlabonne/llm-course)：LLM 基础、科学与工程路线图。
- [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch)：从代码层理解 LLM 核心结构。
- [sansan0/TrendRadar](https://github.com/sansan0/TrendRadar)：多源聚合、智能筛选、自动推送和低门槛部署。
- [Thysrael/Horizon](https://github.com/Thysrael/Horizon)：AI 新闻雷达与中英双语简报。
- [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps)：从 Starter Agent 到 RAG、Skills 与高级 Agent 的实战样例。

## 项目结构

```text
.
├── index.html                  # 单页学习应用
├── styles.css                 # 响应式视觉系统
├── app.js                     # 课程、新闻、进度与实验室交互
├── server.py                  # 静态服务 + 模型 API 安全代理
├── data/
│   ├── curriculum.json        # 7 天课程
│   ├── ecosystem.json         # 框架生态榜
│   └── news.json              # 自动生成的新闻数据
├── scripts/update_news.py     # 新闻与 GitHub 数据聚合器
└── .github/workflows/         # 自动更新和 GitHub Pages 部署
```

## 设计原则

- 先建立直觉，再补术语和细节。
- 每个知识点都必须对应一个动手实验。
- 新闻优先官方来源与可追溯证据。
- 模型输出必须区分事实、判断和待验证项。
- Agent 的权限、停止条件和人工确认比“自主性”更重要。
- AI 产品以真实用户行为和 Eval 改进，不以 Demo 惊艳程度衡量。
