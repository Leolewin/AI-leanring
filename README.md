# AI 入门一周通

一个给 AI 初学者的中文学习与情报系统：用 7 天、约 56 小时建立主流模型基础并完成可测的 AI 创业 MVP，再沿 12 周路线深入模型与 Agent 工程；新闻雷达持续跟踪模型、框架、Agent Harness 与 Skills。

## 你会得到什么

- **7 天真实课程**：从 micrograd、bigram、Tokenizer 和 Attention 到 Tiny GPT、Post-training、Eval、RAG 与 Agent；每天都有权威章节、可运行 Notebook、浏览器实验、学习产出和明确通过标准。
- **12 周进阶地图**：模型内部、LLM 工程、Agent 工程三条连续路径，不把 7 天包装成“已经掌握”。
- **交互式学习进度**：任务清单和产品画布保存在浏览器本地。
- **AI 信号雷达**：聚合模型厂商、AI 媒体、Hugging Face 和主流 GitHub 项目发布。
- **生态榜**：持续更新 LangGraph、OpenAI Agents SDK、AutoGen、CrewAI、LlamaIndex、Mastra、Vercel AI SDK 和 Transformers。
- **系统 Agent 工程课**：8 个依赖递进模块，覆盖结构化调用、手写 Tool Loop、Workflow 选择、Context Engineering、Skills、MCP、持久化 Harness、Trajectory Eval 与安全。
- **GPT / Claude 速查工具箱**：保留需求设计、Debug、Prompt、Review 与交付技巧，但明确作为系统课后的工作流参考。
- **Startup Lab**：连接任意 OpenAI-compatible API，生成有事实边界、影响分析和行动建议的 AI 决策简报。
- **自动化**：GitHub Actions 每天三次刷新数据，并将静态站点部署到 GitHub Pages。

## 立即体验

项目没有前端依赖，也不需要构建：

```bash
python3 server.py
```

打开 <http://127.0.0.1:8010>。

默认端口是 `8010`。如需改用其他端口：

```bash
PORT=8020 python3 server.py
```

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

## 运行固定 50 条 Eval

`data/eval_cases.json` 包含正常、重复、传言、无关、信息不足和 Prompt Injection 六类固定案例。先验证数据集：

```bash
python3 scripts/run_eval.py --dry-run
```

配置模型并启动服务后，运行完整回归集：

```bash
python3 scripts/run_eval.py \
  --input-cost-per-million 0.40 \
  --output-cost-per-million 1.60
```

请把示例价格替换为当前模型的实际价格。报告写入 `artifacts/eval-report.json`，包含逐案例失败、Token、估算成本和 p95 延迟。总通过率必须达到 90%，且 10 条对抗案例必须 100% 通过，否则结果为 `STOP`。这套确定性检查覆盖结构、关键证据、不确定性与注入标记，是起点而非人工事实检查的替代品。

## 更新 AI 新闻

```bash
python3 scripts/update_news.py
```

脚本使用 Python 标准库：

1. 抓取 OpenAI、Google AI、Hugging Face、MIT Technology Review AI 和 TechCrunch AI 的 RSS。
2. 获取主流 AI 框架的 GitHub Release 与实时 Star。
3. 按来源权重、时效性和 AI 关键词评分。
4. 去重后写入 `data/news.json`，并刷新 `data/ecosystem.json`。
5. 同步 OpenAI Cookbook、Claude Cookbooks、Promptfoo、Awesome Copilot、Superpowers、12 Factor Agents 等仓库的最新实践动态到 `data/techniques.json`。

单个来源失败会明确记录到 `errors`；如果所有来源都失败，脚本退出并保留上一次有效数据。

## Learning 模块不是路线图展示

课程遵循 `Read → Run → Explain → Build → Verify`：

1. **Read**：阅读指定的权威章节，而不是只看本站摘要。
2. **Run**：实际运行 Colab、Notebook 或浏览器实验。
3. **Explain**：用自己的话解释机制，暴露“看懂了但讲不出”的假理解。
4. **Build**：每天产生一份可以保留的学习产出。
5. **Verify**：使用通过标准和理解测试验收，而不是只勾选“读完”。

主要课程来源：

- [Microsoft Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners)
- [Sebastian Raschka: LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch)
- [Andrej Karpathy: Neural Networks Zero to Hero](https://github.com/karpathy/nn-zero-to-hero)
- [Anthropic Interactive Prompt Engineering Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial)
- [Hugging Face Agents Course](https://github.com/huggingface/agents-course)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- [HumanLayer: 12 Factor Agents](https://github.com/humanlayer/12-factor-agents)

浏览器实验用于建立直觉，并明确标注哪些是教学模型、哪些是真实算法。它们不能替代上游课程中的真实 PyTorch、模型 API 和 Agent Framework 练习。

## 一周课程与交付物

| 天 | 主题 | 最终产出 |
|---|---|---|
| 1 | 下一个 Token 与语言模型 | 一页纸语言模型机制解释 |
| 2 | Token、Embedding、Attention | Transformer Block 数据流图 |
| 3 | Loss、训练、验证与采样 | 训练/推理阶段对照表 |
| 4 | Prompt、Schema 与 Eval | 10 条真实 Prompt Eval 数据 |
| 5 | 检索、RAG 与引用 | 8 条查询的 RAG 故障分析表 |
| 6 | Agent Loop、工具与 Harness | 带状态、预算和停止条件的 Agent 设计 |
| 7 | Startup MVP | 可运行产品、Eval 结果和真实用户反馈 |

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
├── learning-labs.js           # 7 个可操作的 AI 原理与系统实验
├── server.py                  # 静态服务 + 模型 API 安全代理
├── data/
│   ├── curriculum.json        # 7 天课程
│   ├── ecosystem.json         # 框架生态榜
│   ├── news.json              # 自动生成的新闻数据
│   └── techniques.json        # GPT / Claude 开发技巧与每日实践动态
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
