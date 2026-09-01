(function () {
  const labState = {};

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(values, temperature = 1) {
    const adjusted = values.map((value) => Math.pow(value, 1 / temperature));
    const sum = adjusted.reduce((total, value) => total + value, 0);
    return adjusted.map((value) => value / sum);
  }

  function probabilityBars(labels, probabilities) {
    return labels
      .map(
        (label, index) => `
          <div class="probability-row">
            <span>${escapeHtml(label)}</span>
            <div><i style="width:${probabilities[index] === 0 ? 0 : Math.max(2, probabilities[index] * 100)}%"></i></div>
            <strong>${Math.round(probabilities[index] * 100)}%</strong>
          </div>`,
      )
      .join("");
  }

  function tokenize(text) {
    return text.match(/[\u3400-\u9fff]|[A-Za-z]+(?:'[A-Za-z]+)?|\d+|[^\s]/g) || [];
  }

  function renderTokenLab(lab) {
    return `
      <div class="lab-workbench" data-lab="token">
        <label>输入一句话<textarea data-token-input rows="3">${escapeHtml(lab.defaultText)}</textarea></label>
        <button class="secondary-button" data-lab-action="tokenize">切成教学 Token</button>
        <div class="lab-result" data-token-result></div>
        <p class="lab-disclaimer">这是帮助理解的规则分词器，不冒充 GPT/Claude 的真实 tokenizer；真实模型会使用各自训练出的 BPE/SentencePiece 词表。</p>
      </div>`;
  }

  function renderAttentionLab(lab) {
    return `
      <div class="lab-workbench" data-lab="attention">
        <p>点击一个 Token，观察它在理解当前含义时“看向”哪些位置。</p>
        <div class="attention-tokens">
          ${lab.tokens.map((token, index) => `<button data-attention-token="${index}">${escapeHtml(token)}</button>`).join("")}
        </div>
        <div class="lab-result" data-attention-result>先点击“它”。</div>
        <p class="lab-disclaimer">权重来自课程设计的可解释示例，不是某个线上模型的真实内部 Attention。目标是理解“上下文相关的加权信息汇总”。</p>
      </div>`;
  }

  function renderTemperatureLab(lab) {
    return `
      <div class="lab-workbench" data-lab="temperature">
        <p>上下文：<strong>${escapeHtml(lab.context)}</strong></p>
        <label>Temperature：<output data-temperature-value>1.0</output>
          <input type="range" min="0.2" max="2" value="1" step="0.1" data-temperature />
        </label>
        <div data-temperature-bars></div>
        <button class="secondary-button" data-lab-action="sample">采样 12 次</button>
        <div class="sample-output" data-sample-output></div>
      </div>`;
  }

  function renderPromptEvalLab(lab) {
    return `
      <div class="lab-workbench" data-lab="prompt-eval">
        <div class="prompt-comparison">
          <article><span>Prompt A</span><pre>${escapeHtml(lab.promptA)}</pre></article>
          <article><span>Prompt B</span><pre>${escapeHtml(lab.promptB)}</pre></article>
        </div>
        <p>逐个查看测试案例，判断哪个 Prompt 更容易得到可验收结果。</p>
        <div class="eval-cases">
          ${lab.cases
            .map(
              (item, index) => `
                <button data-eval-case="${index}">
                  <strong>${escapeHtml(item.input)}</strong>
                  <span>期望：${escapeHtml(item.expected)}</span>
                </button>`,
            )
            .join("")}
        </div>
        <div class="lab-result" data-eval-result>请选择一个案例。</div>
      </div>`;
  }

  function words(text) {
    return (text.toLowerCase().match(/[\u3400-\u9fff]|[a-z0-9]+/g) || []).filter(
      (word) => !["的", "了", "是", "在", "和", "与", "a", "the", "is", "of", "to"].includes(word),
    );
  }

  function similarity(query, document) {
    const queryWords = words(query);
    const docWords = words(document);
    if (!queryWords.length || !docWords.length) return 0;
    const docSet = new Set(docWords);
    return queryWords.filter((word) => docSet.has(word)).length / Math.sqrt(queryWords.length * docSet.size);
  }

  function renderRagLab(lab) {
    return `
      <div class="lab-workbench" data-lab="rag">
        <div class="document-shelf">
          ${lab.documents.map((document, index) => `<article><span>文档 ${index + 1}</span><p>${escapeHtml(document)}</p></article>`).join("")}
        </div>
        <label>向资料库提问<input data-rag-query value="${escapeHtml(lab.defaultQuery)}" /></label>
        <button class="secondary-button" data-lab-action="retrieve">执行检索</button>
        <div class="lab-result" data-rag-result></div>
      </div>`;
  }

  function renderAgentLab(lab) {
    return `
      <div class="lab-workbench" data-lab="agent">
        <div class="agent-controls">
          <label>最大步骤 <input type="number" min="1" max="8" value="8" data-agent-budget /></label>
          <strong>Harness 策略：发布动作必须人工确认</strong>
        </div>
        <button class="secondary-button" data-lab-action="agent-step">执行下一步</button>
        <button class="text-button" data-lab-action="agent-reset">重置</button>
        <div class="agent-approval" data-agent-approval hidden>
          <strong>Agent 请求执行有副作用的“发布”动作</strong>
          <p>请检查动作、参数和证据。批准后执行；拒绝后本次运行终止。</p>
          <button class="secondary-button" data-lab-action="agent-approve">批准发布</button>
          <button class="text-button" data-lab-action="agent-reject">拒绝并停止</button>
        </div>
        <div class="agent-trace" data-agent-trace></div>
      </div>`;
  }

  function renderCapstoneLab(lab) {
    return `
      <div class="lab-workbench" data-lab="capstone">
        <p>勾选你的 MVP 已具备的证据。没有证据的项目不能算完成。</p>
        <div class="capstone-checks">
          ${lab.checks.map((item, index) => `<label><input type="checkbox" data-capstone-check="${index}" ${localStorage.getItem(`capstone-check-${index}`) === "true" ? "checked" : ""} />${escapeHtml(item)}</label>`).join("")}
        </div>
        <div class="capstone-score"><strong data-capstone-score>0 / ${lab.checks.length}</strong><span data-capstone-message>先完成问题与用户验证。</span></div>
        <button class="primary-button" data-go="lab">打开创业实验室完成 MVP</button>
      </div>`;
  }

  function render(lab) {
    const renderers = {
      token: renderTokenLab,
      attention: renderAttentionLab,
      temperature: renderTemperatureLab,
      "prompt-eval": renderPromptEvalLab,
      rag: renderRagLab,
      agent: renderAgentLab,
      capstone: renderCapstoneLab,
    };
    return renderers[lab.type] ? renderers[lab.type](lab) : "<p>实验配置缺失。</p>";
  }

  function activate(lab, day) {
    labState.current = { lab, day, agentStep: 0, pendingApproval: false, terminated: false };
    window.requestAnimationFrame(() => {
      if (lab.type === "token") runTokenize();
      if (lab.type === "temperature") updateTemperature();
      if (lab.type === "rag") runRetrieval();
      if (lab.type === "agent") renderAgentTrace();
      if (lab.type === "capstone") updateCapstone();
    });
  }

  function runTokenize() {
    const input = document.querySelector("[data-token-input]");
    const result = document.querySelector("[data-token-result]");
    if (!input || !result) return;
    const tokens = tokenize(input.value);
    result.innerHTML = `
      <div class="token-output">${tokens.map((token, index) => `<span><small>${index}</small>${escapeHtml(token)}</span>`).join("")}</div>
      <strong>${tokens.length} 个教学 Token</strong>
      <p>注意：中文常出现“一字一 Token 或多字合并”，英文常按词根和片段拆分。Token 数量直接影响上下文和费用。</p>`;
  }

  function updateTemperature() {
    const slider = document.querySelector("[data-temperature]");
    const bars = document.querySelector("[data-temperature-bars]");
    const output = document.querySelector("[data-temperature-value]");
    if (!slider || !bars || !output) return;
    const temperature = Number(slider.value);
    const lab = labState.current.lab;
    const probabilities = normalize(lab.probabilities, temperature);
    output.value = temperature.toFixed(1);
    output.textContent = temperature.toFixed(1);
    bars.innerHTML = probabilityBars(lab.candidates, probabilities);
    labState.current.probabilities = probabilities;
  }

  function sampleTokens() {
    const lab = labState.current.lab;
    const probabilities = labState.current.probabilities || lab.probabilities;
    const samples = Array.from({ length: 12 }, () => {
      const random = Math.random();
      let cumulative = 0;
      const index = probabilities.findIndex((probability) => {
        cumulative += probability;
        return random <= cumulative;
      });
      return lab.candidates[index < 0 ? lab.candidates.length - 1 : index];
    });
    document.querySelector("[data-sample-output]").innerHTML = samples.map((sample) => `<span>${escapeHtml(sample)}</span>`).join("");
  }

  function showAttention(index) {
    const lab = labState.current.lab;
    document.querySelectorAll("[data-attention-token]").forEach((button) => button.classList.toggle("active", Number(button.dataset.attentionToken) === index));
    const weights = lab.weights[index];
    document.querySelector("[data-attention-result]").innerHTML = `
      <strong>Query：${escapeHtml(lab.tokens[index])}</strong>
      ${probabilityBars(lab.tokens, weights)}
      <p>${escapeHtml(lab.notes[index])}</p>`;
  }

  function showEvalCase(index) {
    const item = labState.current.lab.cases[index];
    document.querySelector("[data-eval-result]").innerHTML = `
      <strong>更可靠：Prompt ${escapeHtml(item.winner)}</strong>
      <p>${escapeHtml(item.reason)}</p>
      <div class="understanding-check"><strong>可测量标准：</strong>${escapeHtml(item.measure)}</div>`;
  }

  function runRetrieval() {
    const query = document.querySelector("[data-rag-query]")?.value || "";
    const lab = labState.current.lab;
    const ranked = lab.documents
      .map((document, index) => ({ document, index, score: similarity(query, document) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    document.querySelector("[data-rag-result]").innerHTML = `
      <strong>检索结果：文档 ${best.index + 1}（相似度 ${best.score.toFixed(2)}）</strong>
      <p>${escapeHtml(best.document)}</p>
      <div class="constructed-prompt"><strong>构造给模型的上下文</strong><pre>仅根据以下资料回答；资料不足时明确说不知道。\n\n${escapeHtml(best.document)}\n\n问题：${escapeHtml(query)}</pre></div>
      <p>这是一个真实运行的词项相似度检索器，但不是生产级向量模型。改变问题用词，观察 lexical retrieval 的局限。</p>`;
  }

  function renderAgentTrace() {
    const trace = document.querySelector("[data-agent-trace]");
    if (!trace) return;
    const lab = labState.current.lab;
    const steps = lab.steps.slice(0, labState.current.agentStep);
    trace.innerHTML = steps.length
      ? steps.map((step, index) => `<article><span>${index + 1}</span><div><strong>${escapeHtml(step.action)}</strong><p>${escapeHtml(step.result)}</p></div></article>`).join("")
      : "<p>Agent 尚未运行。每次点击会执行一个“观察 → 决策 → 工具结果”循环。</p>";
  }

  function runAgentStep() {
    const budget = Number(document.querySelector("[data-agent-budget]")?.value || 5);
    const lab = labState.current.lab;
    if (labState.current.pendingApproval || labState.current.terminated) return;
    if (labState.current.agentStep >= budget) {
      document.querySelector("[data-agent-trace]").insertAdjacentHTML("beforeend", '<div class="agent-stop">已达到步骤预算，Agent 被 Harness 停止。</div>');
      return;
    }
    const next = lab.steps[labState.current.agentStep];
    if (!next) return;
    if (next.requiresConfirmation) {
      labState.current.pendingApproval = true;
      document.querySelector("[data-agent-approval]").hidden = false;
      return;
    }
    labState.current.agentStep += 1;
    renderAgentTrace();
  }

  function resolveAgentApproval(approved) {
    if (!labState.current.pendingApproval) return;
    labState.current.pendingApproval = false;
    document.querySelector("[data-agent-approval]").hidden = true;
    if (approved) {
      labState.current.agentStep += 1;
      renderAgentTrace();
      return;
    }
    labState.current.terminated = true;
    document.querySelector("[data-agent-trace]").insertAdjacentHTML("beforeend", '<div class="agent-stop">人工拒绝发布，本次运行已安全终止。</div>');
  }

  function updateCapstone() {
    const checks = [...document.querySelectorAll("[data-capstone-check]")];
    checks.forEach((checkbox, index) => localStorage.setItem(`capstone-check-${index}`, String(checkbox.checked)));
    const completed = checks.filter((checkbox) => checkbox.checked).length;
    document.querySelector("[data-capstone-score]").textContent = `${completed} / ${checks.length}`;
    document.querySelector("[data-capstone-message]").textContent =
      completed === checks.length ? "达到可演示 MVP 标准；下一步是让真实用户使用。" : completed >= 4 ? "已经形成产品闭环，继续补齐评测和真实反馈。" : "功能不等于产品，优先补齐用户、证据和验收标准。";
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-lab-action]")?.dataset.labAction;
    if (action === "tokenize") runTokenize();
    if (action === "sample") sampleTokens();
    if (action === "retrieve") runRetrieval();
    if (action === "agent-step") runAgentStep();
    if (action === "agent-approve") resolveAgentApproval(true);
    if (action === "agent-reject") resolveAgentApproval(false);
    if (action === "agent-reset") {
      labState.current.agentStep = 0;
      labState.current.pendingApproval = false;
      labState.current.terminated = false;
      const approval = document.querySelector("[data-agent-approval]");
      if (approval) approval.hidden = true;
      renderAgentTrace();
    }
    const attention = event.target.closest("[data-attention-token]");
    if (attention) showAttention(Number(attention.dataset.attentionToken));
    const evalCase = event.target.closest("[data-eval-case]");
    if (evalCase) showEvalCase(Number(evalCase.dataset.evalCase));
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-temperature]")) updateTemperature();
    if (event.target.matches("[data-capstone-check]")) updateCapstone();
  });

  window.LearningLabs = { render, activate };
})();
