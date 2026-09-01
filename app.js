const state = {
  curriculum: [],
  curriculumMeta: null,
  apiConfigured: null,
  news: [],
  ecosystem: null,
  techniques: null,
  activeDay: 1,
  newsFilter: "全部",
  techniqueFilter: "全部",
  progress: JSON.parse(localStorage.getItem("ai-week-progress-v2") || "{}"),
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
  return Object.entries(state.progress).filter(([key, value]) => key.startsWith("day-") && value === true).length;
}

function totalTasks() {
  return state.curriculum.reduce((sum, day) => sum + day.tasks.length, 0);
}

function isDayComplete(day) {
  return day.tasks.every((_, index) => state.progress[`day-${day.day}-task-${index}`]);
}

function renderProgress() {
  const total = totalTasks();
  const percent = total ? Math.min(100, Math.round((completedTasks() / total) * 100)) : 0;
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

function renderLearningOverview() {
  const data = state.curriculumMeta;
  document.querySelector("#learning-overview").innerHTML = `
    <section class="course-contract panel">
      <div>
        <p class="eyebrow">学习契约</p>
        <h2>${escapeHtml(data.contract.title)}</h2>
        <p>${escapeHtml(data.contract.description)}</p>
      </div>
      <div class="course-numbers">
        ${data.contract.metrics.map((metric) => `<article><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></article>`).join("")}
      </div>
      <div class="pace-options">
        ${data.contract.paceOptions.map((pace) => `<article><strong>${escapeHtml(pace.name)} · ${escapeHtml(pace.schedule)}</strong><span>${escapeHtml(pace.for)}</span></article>`).join("")}
      </div>
      <div class="honesty-note"><strong>诚实边界：</strong>${escapeHtml(data.contract.boundary)}</div>
    </section>
    <section class="diagnostic panel">
      <div><p class="eyebrow">开始前诊断</p><h2>你是否需要先做预备课？</h2></div>
      <div class="diagnostic-grid">
        ${data.prerequisites
          .map(
            (item, index) => `
              <label>
                <input type="checkbox" data-prerequisite="${index}" />
                <span><strong>${escapeHtml(item.skill)}</strong><small>${escapeHtml(item.check)}</small></span>
              </label>`,
          )
          .join("")}
      </div>
      <div id="diagnostic-result" class="diagnostic-result">请诚实勾选你已经能独立完成的项目。</div>
    </section>
    <section class="knowledge-map">
      <div class="section-heading"><div><p class="eyebrow">完整知识地图</p><h2>7 天负责入门，12 周负责扎实</h2></div><p>不要把“看过”误认为“掌握”。每层都有独立产出和验收。</p></div>
      <div class="track-grid">
        ${data.tracks
          .map(
            (track) => `
              <article class="track-card">
                <span>${escapeHtml(track.duration)}</span>
                <h3>${escapeHtml(track.title)}</h3>
                <p>${escapeHtml(track.outcome)}</p>
                <ul>${track.modules.map((module) => `<li>${escapeHtml(module)}</li>`).join("")}</ul>
              </article>`,
          )
          .join("")}
      </div>
    </section>
    <section class="notebook-guide panel">
      <div><p class="eyebrow">零基础操作手册</p><h2>${escapeHtml(data.notebookGuide.title)}</h2></div>
      <ol>${data.notebookGuide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </section>
    <details class="lab-verification panel">
      <summary><span><small>客观验收</small><strong>7 天实验证据表</strong></span><b>展开 →</b></summary>
      <div class="verification-grid">
        ${data.labVerification.map((item) => `<article><strong>Day ${item.day} · ${escapeHtml(item.artifact)}</strong><ul>${item.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}</ul></article>`).join("")}
      </div>
    </details>
    <details class="misconception-panel panel">
      <summary><span><small>必须纠正</small><strong>16 个最常见的 AI 初学者误区</strong></span><b>展开 →</b></summary>
      <div class="misconception-grid">
        ${data.misconceptions.map((item) => `<article><strong>✗ ${escapeHtml(item.wrong)}</strong><p>✓ ${escapeHtml(item.correct)}</p></article>`).join("")}
      </div>
    </details>
    <section class="final-assessment panel">
      <div class="section-heading"><div><p class="eyebrow">统一结业测评</p><h2>不是每天猜一道题：用 12 题检查整条知识链</h2></div><p>这是可复习的开放式自测，不是防作弊证书；提交后显示解释，达到 10/12 才建议进入 Agent 工程课。</p></div>
      <div class="assessment-questions">
        ${data.finalAssessment
          .map(
            (question, questionIndex) => `
              <fieldset>
                <legend>${questionIndex + 1}. ${escapeHtml(question.question)}</legend>
                ${question.options.map((option, optionIndex) => `<label><input type="radio" name="final-${questionIndex}" value="${optionIndex}" />${escapeHtml(option)}</label>`).join("")}
                <p class="assessment-feedback" data-assessment-feedback="${questionIndex}" hidden></p>
              </fieldset>`,
          )
          .join("")}
      </div>
      <button id="submit-final-assessment" class="primary-action">提交并查看薄弱项</button>
      <div id="assessment-score" class="assessment-score" hidden></div>
    </section>
    <details class="source-policy panel">
      <summary><strong>${escapeHtml(data.sourcePolicy.title)}</strong><span>为什么这些链接可信？</span></summary>
      <ul>${data.sourcePolicy.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>
    </details>`;
  const completion = document.querySelector("#learning-completion");
  completion.append(
    document.querySelector("#learning-overview .final-assessment"),
    document.querySelector("#learning-overview .source-policy"),
  );
}

function renderLesson() {
  const day = state.curriculum.find((item) => item.day === state.activeDay);
  if (!day) return;
  document.querySelector("#lesson-content").innerHTML = `
    <section class="lesson-hero">
      <p class="eyebrow">DAY ${day.day} · ${escapeHtml(day.theme)}</p>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${escapeHtml(day.intro)}</p>
      <div class="lesson-stats"><span>⏱ ${escapeHtml(day.duration)}</span><span>🎯 ${escapeHtml(day.outcome)}</span><span>📦 ${escapeHtml(day.deliverable.title)}</span></div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">先建立准确理解</p>
      <h3>${escapeHtml(day.lessonQuestion)}</h3>
      <div class="lesson-reading">
        ${day.explanations
          .map(
            (section) => `
              <article>
                <h4>${escapeHtml(section.title)}</h4>
                ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                ${section.check ? `<div class="understanding-check"><strong>理解检查：</strong>${escapeHtml(section.check)}</div>` : ""}
              </article>`,
          )
          .join("")}
      </div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">真实开源课程</p>
      <h3>今天必须完成的学习材料</h3>
      <div class="resource-list">
        ${day.resources
          .map(
            (resource) => `
              <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">
                <div class="resource-type">${escapeHtml(resource.type)}</div>
                <div>
                  <strong>${escapeHtml(resource.title)}</strong>
                  <p>${escapeHtml(resource.source)} · ${escapeHtml(resource.duration)}</p>
                  <small>${escapeHtml(resource.instruction)}</small>
                </div>
                <span>↗</span>
              </a>`,
          )
          .join("")}
      </div>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">浏览器实验 · 不是演示截图</p>
      <h3>${escapeHtml(day.lab.title)}</h3>
      <p>${escapeHtml(day.lab.instructions)}</p>
      <div id="interactive-lab">${window.LearningLabs.render(day.lab, day.day)}</div>
      <div class="analogy"><strong>你必须解释：</strong> ${escapeHtml(day.lab.explain)}</div>
    </section>
    <section class="lesson-section deliverable-section">
      <p class="eyebrow">今日学习产出</p>
      <h3>${escapeHtml(day.deliverable.title)}</h3>
      <p>${escapeHtml(day.deliverable.description)}</p>
      <div class="deliverable-template">
        <strong>提交模板</strong>
        <pre>${escapeHtml(day.deliverable.template)}</pre>
      </div>
      <h4>通过标准</h4>
      <ul class="pass-criteria">${day.deliverable.passCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("")}</ul>
    </section>
    <section class="lesson-section learning-journal">
      <p class="eyebrow">费曼复述与证据</p>
      <h3>不看资料，用自己的话回答</h3>
      <label><strong>${escapeHtml(day.lab.explain)}</strong><textarea data-journal="explain-${day.day}" placeholder="先写因果链，再写一个反例。不要复制课程原句。">${escapeHtml(localStorage.getItem(`learning-journal-explain-${day.day}`) || "")}</textarea></label>
      <label><strong>今天最容易犯的错误，以及你如何验证它？</strong><textarea data-journal="risk-${day.day}" placeholder="例：我可能把相似度当成事实性；我会加入无答案和冲突文档测试。">${escapeHtml(localStorage.getItem(`learning-journal-risk-${day.day}`) || "")}</textarea></label>
      <p class="journal-hint">日志只保存在本机浏览器。课程不会把“写了字”当成掌握；你仍需满足下方可观察的通过标准。</p>
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
      <p class="eyebrow">理解验收</p>
      <h3>${escapeHtml(day.quiz.question)}</h3>
      <div class="quiz">
        ${day.quiz.options.map((option, index) => `<button data-answer="${index}" data-correct="${day.quiz.answer}">${escapeHtml(option)}</button>`).join("")}
      </div>
      <div class="quiz-explanation" hidden>${escapeHtml(day.quiz.explanation)}</div>
    </section>`;
  window.LearningLabs.activate(day.lab, day.day);
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

function renderTechniqueFilters() {
  const categories = ["全部", ...new Set(state.techniques.playbooks.map((item) => item.category))];
  document.querySelector("#technique-filters").innerHTML = categories
    .map(
      (category) =>
        `<button class="filter-button ${state.techniqueFilter === category ? "active" : ""}" data-technique-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`,
    )
    .join("");
}

function renderTechniques() {
  const playbooks =
    state.techniqueFilter === "全部"
      ? state.techniques.playbooks
      : state.techniques.playbooks.filter((item) => item.category === state.techniqueFilter);
  document.querySelector("#technique-grid").innerHTML = playbooks
    .map(
      (item) => `
        <article class="technique-card">
          <div class="technique-card-top">
            <span class="technique-number">${escapeHtml(item.id)}</span>
            <span class="category">${escapeHtml(item.category)}</span>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="technique-principle">${escapeHtml(item.principle)}</p>
          <ol>${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
          <div class="prompt-box">
            <div><strong>可直接复制的 Prompt</strong><button class="text-button" data-copy-prompt="${escapeHtml(item.id)}">复制</button></div>
            <pre>${escapeHtml(item.prompt)}</pre>
          </div>
          <div class="guardrail"><strong>一致性约束</strong><span>${escapeHtml(item.guardrail)}</span></div>
          <div class="anti-pattern"><strong>避免</strong><span>${escapeHtml(item.avoid)}</span></div>
        </article>`,
    )
    .join("");
}

function renderAgentCourse() {
  const course = state.techniques.course;
  document.querySelector("#agent-course").innerHTML = `
    <section class="agent-course-intro panel">
      <div><p class="eyebrow">系统课 · ${escapeHtml(course.duration)}</p><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.description)}</p></div>
      <div class="agent-vocabulary">
        ${course.vocabulary.map((item) => `<span><strong>${escapeHtml(item.term)}</strong>${escapeHtml(item.definition)}</span>`).join("")}
      </div>
    </section>
    <div class="agent-module-list">
      ${course.modules
        .map(
          (module, index) => `
            <details class="agent-module panel" ${index === 0 ? "open" : ""}>
              <summary>
                <span class="module-index">${String(index + 1).padStart(2, "0")}</span>
                <span><small>${escapeHtml(module.phase)} · ${escapeHtml(module.duration)}</small><strong>${escapeHtml(module.title)}</strong></span>
                <b>+</b>
              </summary>
              <div class="module-body">
                <p class="module-goal"><strong>学完能够：</strong>${escapeHtml(module.outcome)}</p>
                <div class="module-columns">
                  <div><h4>核心内容</h4><ol>${module.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("")}</ol></div>
                  <div><h4>动手交付</h4><p>${escapeHtml(module.exercise)}</p><h4>通过标准</h4><ul>${module.mastery.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
                </div>
                <div class="module-resources">
                  ${module.resources.map((resource) => `<a href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(resource.title)}</strong><small>${escapeHtml(resource.source)}</small></a>`).join("")}
                </div>
                <label class="module-complete"><input type="checkbox" data-agent-module="${module.id}" ${state.progress[`agent-${module.id}`] ? "checked" : ""} />我已完成交付，并能逐条满足通过标准</label>
              </div>
            </details>`,
        )
        .join("")}
    </div>
    <section class="agent-capstone panel">
      <p class="eyebrow">毕业项目</p><h2>${escapeHtml(course.capstone.title)}</h2><p>${escapeHtml(course.capstone.description)}</p>
      <div class="capstone-architecture">${course.capstone.architecture.map((step) => `<span>${escapeHtml(step)}</span>`).join("<b>→</b>")}</div>
      <ul>${course.capstone.criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>`;
}

function renderPracticeUpdates() {
  document.querySelector("#practice-updates").innerHTML = state.techniques.updates.length
    ? state.techniques.updates
        .slice(0, 12)
        .map(
          (item) => `
            <a class="practice-update-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
              <span>${escapeHtml(item.category)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.repo)}</p>
              <small>${escapeHtml(item.date)}</small>
            </a>`,
        )
        .join("")
    : "<p>暂时没有新的实践动态。</p>";
  document.querySelector("#technique-sources").innerHTML = state.techniques.sources
    .map(
      (source) => `
        <a class="source-card" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(source.name)}</strong>
          <small>${escapeHtml(source.focus)}</small>
          <span>★ ${formatStars(source.stars)}</span>
        </a>`,
    )
    .join("");
}

async function detectApi() {
  const status = document.querySelector("#api-status");
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("not running via server");
    const config = await response.json();
    state.apiConfigured = config.configured;
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
  if (state.apiConfigured === false) {
    const signals = input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
    output.className = "brief-output demo";
    output.textContent = `【本地演示结果 · 未调用模型】\n\n## 今日三条关键信号\n${signals.map((signal, index) => `${index + 1}. ${signal}`).join("\n")}\n\n## 对我的影响\n围绕“${focus || "AI 产品与技术"}”逐条核对来源、发布日期与是否改变现有决策。\n\n## 下一步行动\n1. 打开原始来源验证最重要的一条。\n2. 配置 AI_API_KEY 后再运行真实模型分析。\n\n## 仍需验证\n本结果只展示产品的数据流和输出结构，没有进行模型判断。`;
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
    const techniqueFilter = event.target.closest("[data-technique-filter]");
    const copyPrompt = event.target.closest("[data-copy-prompt]");
    const answer = event.target.closest("[data-answer]");
    const submitAssessment = event.target.closest("#submit-final-assessment");
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
    if (techniqueFilter) {
      state.techniqueFilter = techniqueFilter.dataset.techniqueFilter;
      renderTechniqueFilters();
      renderTechniques();
    }
    if (copyPrompt) {
      const playbook = state.techniques.playbooks.find((item) => item.id === copyPrompt.dataset.copyPrompt);
      if (playbook) {
        navigator.clipboard.writeText(playbook.prompt).then(
          () => showToast("Prompt 已复制"),
          () => showToast("复制失败，请手动选择文本"),
        );
      }
    }
    if (answer) {
      answer.parentElement.querySelectorAll("button").forEach((button) => button.classList.remove("correct", "wrong"));
      answer.classList.add(Number(answer.dataset.answer) === Number(answer.dataset.correct) ? "correct" : "wrong");
      const explanation = answer.closest(".lesson-section").querySelector(".quiz-explanation");
      explanation.hidden = false;
      if (answer.classList.contains("correct")) showToast("答对了，请继续读解释");
    }
    if (submitAssessment) {
      let score = 0;
      state.curriculumMeta.finalAssessment.forEach((question, index) => {
        const selected = document.querySelector(`input[name="final-${index}"]:checked`);
        const feedback = document.querySelector(`[data-assessment-feedback="${index}"]`);
        const correct = Number(selected?.value) === question.answer;
        if (correct) score += 1;
        feedback.hidden = false;
        feedback.className = `assessment-feedback ${correct ? "correct" : "incorrect"}`;
        feedback.textContent = `${correct ? "正确" : "需要复习"}：${question.explanation}`;
      });
      const result = document.querySelector("#assessment-score");
      result.hidden = false;
      result.innerHTML = `<strong>${score}/12 · ${Math.round((score / 12) * 100)}%</strong><span>${score >= 10 ? "达到基础结业线。请带着错题记录进入 Agent 工程课。" : "暂未达到 10/12。根据错题解释返回对应 Day 重做实验。"}</span>`;
      state.progress["foundation-assessment"] = score;
      localStorage.setItem("ai-week-progress-v2", JSON.stringify(state.progress));
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-task]")) {
      state.progress[event.target.dataset.task] = event.target.checked;
      localStorage.setItem("ai-week-progress-v2", JSON.stringify(state.progress));
      renderProgress();
      renderDayNav();
    }
    if (event.target.matches("[data-agent-module]")) {
      state.progress[`agent-${event.target.dataset.agentModule}`] = event.target.checked;
      localStorage.setItem("ai-week-progress-v2", JSON.stringify(state.progress));
    }
    if (event.target.matches("[data-prerequisite]")) {
      const completed = document.querySelectorAll("[data-prerequisite]:checked").length;
      const total = state.curriculumMeta.prerequisites.length;
      const result = document.querySelector("#diagnostic-result");
      result.textContent =
        completed === total
          ? "准备完成：可以直接开始 Day 1。"
          : completed >= total - 1
            ? "基本准备完成：先补齐未勾选项，再开始 Day 1。"
            : `建议先完成预备课：当前 ${completed}/${total}，否则 7 天课程会变成复制代码。`;
    }
  });

  document.addEventListener("input", (event) => {
    if (!event.target.matches("[data-journal]")) return;
    localStorage.setItem(`learning-journal-${event.target.dataset.journal}`, event.target.value);
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
    const [curriculumResponse, newsResponse, ecosystemResponse, techniquesResponse] = await Promise.all([
      fetch("data/curriculum.json"),
      fetch("data/news.json"),
      fetch("data/ecosystem.json"),
      fetch("data/techniques.json"),
    ]);
    if (![curriculumResponse, newsResponse, ecosystemResponse, techniquesResponse].every((response) => response.ok)) throw new Error("数据文件加载失败");
    const [curriculum, news, ecosystem, techniques] = await Promise.all([
      curriculumResponse.json(),
      newsResponse.json(),
      ecosystemResponse.json(),
      techniquesResponse.json(),
    ]);
    state.curriculum = curriculum.days;
    state.curriculumMeta = curriculum;
    state.news = news.items;
    state.ecosystem = ecosystem;
    state.techniques = techniques;
    document.querySelector("#news-updated").textContent = new Date(news.updatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
    document.querySelector("#techniques-updated").textContent = new Date(techniques.updatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
    renderProgress();
    renderLearningOverview();
    renderDayNav();
    renderLesson();
    renderNewsFilters();
    renderNews();
    renderHomeSignals();
    renderEcosystem();
    renderAgentCourse();
    renderTechniqueFilters();
    renderTechniques();
    renderPracticeUpdates();
    document.querySelectorAll(".loading").forEach((element) => element.classList.remove("loading"));
  } catch (error) {
    document.querySelectorAll(".loading").forEach((element) => {
      element.textContent = `加载失败：${error.message}。请通过 python3 server.py 启动。`;
    });
  }
  detectApi();
}

init();
