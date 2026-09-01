const state = {
  curriculum: [],
  news: [],
  ecosystem: null,
  activeDay: 1,
  newsFilter: "全部",
  progress: JSON.parse(localStorage.getItem("ai-week-progress") || "{}"),
};

const categoryLabels = ["全部", "模型发布", "行业新闻", "框架更新", "Agent / Skills", "研究"];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.remove("active"));
  document.querySelector(`#view-${name}`)?.classList.add("active");
  document.querySelector(`[data-view="${name}"]`)?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function completedTasks() {
  return Object.values(state.progress).filter(Boolean).length;
}

function totalTasks() {
  return state.curriculum.reduce((sum, day) => sum + day.tasks.length, 0);
}

function isDayComplete(day) {
  return day.tasks.every((_, index) => state.progress[`day-${day.day}-task-${index}`]);
}

function renderProgress() {
  const total = totalTasks();
  const percent = total ? Math.round((completedTasks() / total) * 100) : 0;
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  document.querySelector("#week-strip").innerHTML = state.curriculum
    .map((day) => `<div class="week-day ${isDayComplete(day) ? "done" : ""}"><i>${isDayComplete(day) ? "✓" : day.day}</i>Day ${day.day}</div>`)
    .join("");
}

function renderDayNav() {
  document.querySelector("#day-nav").innerHTML = state.curriculum
    .map(
      (day) => `
        <button class="day-button ${state.activeDay === day.day ? "active" : ""} ${isDayComplete(day) ? "complete" : ""}" data-day="${day.day}">
          <span>${isDayComplete(day) ? "✓" : day.day}</span>
          <div><small>DAY ${day.day}</small><strong>${escapeHtml(day.shortTitle)}</strong></div>
        </button>`,
    )
    .join("");
}

function renderLesson() {
  const day = state.curriculum.find((item) => item.day === state.activeDay);
  if (!day) return;
  document.querySelector("#lesson-content").innerHTML = `
    <section class="lesson-hero">
      <p class="eyebrow">DAY ${day.day} · ${escapeHtml(day.theme)}</p>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${escapeHtml(day.intro)}</p>
      <div class="lesson-stats"><span>⏱ ${escapeHtml(day.duration)}</span><span>🎯 ${escapeHtml(day.outcome)}</span></div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">核心直觉</p>
      <h3>${escapeHtml(day.bigIdea.title)}</h3>
      <p>${escapeHtml(day.bigIdea.explanation)}</p>
      <div class="analogy"><strong>把它想成：</strong> ${escapeHtml(day.bigIdea.analogy)}</div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">今天掌握</p>
      <div class="concept-grid">
        ${day.concepts.map((concept) => `<article class="concept-card"><strong>${escapeHtml(concept.name)}</strong><p>${escapeHtml(concept.explanation)}</p></article>`).join("")}
      </div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">动手实验</p>
      <h3>${escapeHtml(day.lab.title)}</h3>
      <p>${escapeHtml(day.lab.instructions)}</p>
      <div class="analogy"><strong>观察重点：</strong> ${escapeHtml(day.lab.observe)}</div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">完成清单</p>
      <div class="task-list">
        ${day.tasks
          .map((task, index) => {
            const key = `day-${day.day}-task-${index}`;
            return `<label class="task-item"><input type="checkbox" data-task="${key}" ${state.progress[key] ? "checked" : ""} /><span>${escapeHtml(task)}</span></label>`;
          })
          .join("")}
      </div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">一分钟自测</p>
      <h3>${escapeHtml(day.quiz.question)}</h3>
      <div class="quiz">
        ${day.quiz.options.map((option, index) => `<button data-answer="${index}" data-correct="${day.quiz.answer}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </section>`;
}

function renderNews() {
  const filtered = state.newsFilter === "全部" ? state.news : state.news.filter((item) => item.category === state.newsFilter);
  document.querySelector("#news-grid").innerHTML = filtered.length
    ? filtered
        .map(
          (item) => `
            <a class="news-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
              <span class="category">${escapeHtml(item.category)}</span>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item.summary || "来自可信来源的最新动态。")}</p>
              <div class="news-meta"><span>${escapeHtml(item.source)}</span><span>${escapeHtml(item.date)}</span></div>
            </a>`,
        )
        .join("")
    : "<p>这个分类暂时没有新信号。</p>";
}

function renderNewsFilters() {
  document.querySelector("#news-filters").innerHTML = categoryLabels
    .map((label) => `<button class="filter-button ${state.newsFilter === label ? "active" : ""}" data-filter="${label}">${label}</button>`)
    .join("");
}

function renderHomeSignals() {
  document.querySelector("#home-signals").innerHTML = state.news
    .slice(0, 3)
    .map(
      (item, index) => `
        <a class="signal-item" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
          <span class="signal-rank">${index + 1}</span>
          <div><h3>${escapeHtml(item.title)}</h3><small>${escapeHtml(item.category)} · ${escapeHtml(item.source)}</small></div>
        </a>`,
    )
    .join("");
}

function formatStars(value) {
  if (!value) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}k` : String(value);
}

function renderEcosystem() {
  const data = state.ecosystem;
  document.querySelector("#ecosystem-grid").innerHTML = data.frameworks
    .map(
      (item) => `
        <article class="ecosystem-card">
          <div class="ecosystem-top">
            <div><p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.name)}</h2></div>
            <i class="dot ${escapeHtml(item.status)}" title="${escapeHtml(item.status)}"></i>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <div class="repo-stats"><span>★ ${formatStars(item.stars)}</span><span>${escapeHtml(item.language)}</span><span>${escapeHtml(item.bestFor)}</span></div>
          <div class="tag-row">${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <p><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">查看项目 →</a></p>
        </article>`,
    )
    .join("");
  document.querySelector("#research-sources").innerHTML = data.references
    .map((source) => `<a class="source-card" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.reason)}</small></a>`)
    .join("");
}

async function detectApi() {
  const status = document.querySelector("#api-status");
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("not running via server");
    const config = await response.json();
    status.textContent = config.configured ? `模型已连接 · ${config.model}` : "模型未配置 · 当前为演示模式";
    status.classList.toggle("online", config.configured);
  } catch {
    status.textContent = "静态模式 · 启动 server.py 可连接模型";
  }
}

async function generateBrief() {
  const input = document.querySelector("#brief-input").value.trim();
  const focus = document.querySelector("#brief-focus").value.trim();
  const output = document.querySelector("#brief-output");
  if (!input) {
    showToast("请先粘贴一些新闻素材");
    return;
  }
  output.className = "brief-output";
  output.textContent = "模型正在分析信号…";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, focus }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "生成失败");
    output.textContent = data.content;
  } catch (error) {
    output.classList.add("error");
    output.textContent = `无法生成：${error.message}\n\n请按 README 启动 server.py，并配置 AI_API_KEY。`;
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-view]");
    const go = event.target.closest("[data-go]");
    const day = event.target.closest("[data-day]");
    const filter = event.target.closest("[data-filter]");
    const answer = event.target.closest("[data-answer]");
    if (nav) switchView(nav.dataset.view);
    if (go) switchView(go.dataset.go);
    if (day) {
      state.activeDay = Number(day.dataset.day);
      renderDayNav();
      renderLesson();
      window.scrollTo({ top: 80, behavior: "smooth" });
    }
    if (filter) {
      state.newsFilter = filter.dataset.filter;
      renderNewsFilters();
      renderNews();
    }
    if (answer) {
      answer.parentElement.querySelectorAll("button").forEach((button) => button.classList.remove("correct", "wrong"));
      answer.classList.add(Number(answer.dataset.answer) === Number(answer.dataset.correct) ? "correct" : "wrong");
      if (answer.classList.contains("correct")) showToast("答对了，你已经抓住核心");
    }
  });

  document.addEventListener("change", (event) => {
    if (!event.target.matches("[data-task]")) return;
    state.progress[event.target.dataset.task] = event.target.checked;
    localStorage.setItem("ai-week-progress", JSON.stringify(state.progress));
    renderProgress();
    renderDayNav();
  });

  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = dark ? "" : "dark";
    localStorage.setItem("ai-week-theme", dark ? "light" : "dark");
  });
  document.querySelector("#load-demo").addEventListener("click", () => {
    document.querySelector("#brief-input").value =
      "1. 某头部模型厂商发布更长上下文的新模型，强调工具调用稳定性。\n2. 一个开源 Agent Skills 框架本周 Star 快速增长。\n3. LangGraph 发布新版本，改进持久化与人工确认流程。\n4. 多家创业公司开始用小模型处理高频、低风险任务以降低成本。";
    showToast("已载入示例素材");
  });
  document.querySelector("#generate-brief").addEventListener("click", generateBrief);
  document.querySelector("#save-canvas").addEventListener("click", () => {
    const canvas = {};
    ["user", "problem", "outcome", "metric"].forEach((key) => {
      canvas[key] = document.querySelector(`#canvas-${key}`).value;
    });
    localStorage.setItem("ai-startup-canvas", JSON.stringify(canvas));
    showToast("产品画布已保存");
  });
}

async function init() {
  const savedTheme = localStorage.getItem("ai-week-theme");
  if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";
  const savedCanvas = JSON.parse(localStorage.getItem("ai-startup-canvas") || "null");
  if (savedCanvas) {
    Object.entries(savedCanvas).forEach(([key, value]) => {
      const field = document.querySelector(`#canvas-${key}`);
      if (field) field.value = value;
    });
  }
  bindEvents();
  try {
    const [curriculumResponse, newsResponse, ecosystemResponse] = await Promise.all([
      fetch("data/curriculum.json"),
      fetch("data/news.json"),
      fetch("data/ecosystem.json"),
    ]);
    if (![curriculumResponse, newsResponse, ecosystemResponse].every((response) => response.ok)) throw new Error("数据文件加载失败");
    const [curriculum, news, ecosystem] = await Promise.all([
      curriculumResponse.json(),
      newsResponse.json(),
      ecosystemResponse.json(),
    ]);
    state.curriculum = curriculum.days;
    state.news = news.items;
    state.ecosystem = ecosystem;
    document.querySelector("#news-updated").textContent = new Date(news.updatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
    renderProgress();
    renderDayNav();
    renderLesson();
    renderNewsFilters();
    renderNews();
    renderHomeSignals();
    renderEcosystem();
  } catch (error) {
    document.querySelectorAll(".loading").forEach((element) => {
      element.textContent = `加载失败：${error.message}。请通过 python3 server.py 启动。`;
    });
  }
  detectApi();
}

init();
