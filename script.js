let DATA = null;
let ALL = [];

const state = {
  search: "",
  category: "",
  family: "",
  base: "",
  thesis: "",
  real: "",
  priority: "",
  sort: "priority"
};

const els = {
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  familyFilter: document.getElementById("familyFilter"),
  baseFilter: document.getElementById("baseFilter"),
  thesisFilter: document.getElementById("thesisFilter"),
  realFilter: document.getElementById("realFilter"),
  priorityButtons: document.getElementById("priorityButtons"),
  resetBtn: document.getElementById("resetBtn"),
  patternTree: document.getElementById("patternTree"),
  cards: document.getElementById("cards"),
  resultTitle: document.getElementById("resultTitle"),
  resultMeta: document.getElementById("resultMeta"),
  sortSelect: document.getElementById("sortSelect"),
  statRecords: document.getElementById("statRecords"),
  statCategories: document.getElementById("statCategories"),
  statFamilies: document.getElementById("statFamilies"),
  statBase: document.getElementById("statBase"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  modalImage: document.getElementById("modalImage"),
  modalDetails: document.getElementById("modalDetails"),
  closeModal: document.getElementById("closeModal")
};

const labels = {
  all: "すべて",
  allPatterns: "すべてのパターン",
  categoryAll: "カテゴリー：すべて",
  familyAll: "ファミリー：すべて",
  baseAll: "基本パターン：すべて",
  shown: "表示中",
  of: "件 / 全",
  patterns: "件",
  category: "カテゴリー",
  family: "ファミリー",
  basePattern: "基本パターン",
  details: "詳細を見る",
  notFoundTitle: "該当するパターンがありません",
  notFoundText: "フィルターを減らすか、検索キーワードを変更してください。",
  dataLoadErrorTitle: "data.json を読み込めませんでした",
  dataLoadErrorText: "index.html を直接開かず、VS Code の Live Server から開いてください。",
  geometry: "形状タイプ",
  function: "機能",
  application: "応用分野",
  priority: "優先度",
  realPattern: "実在パターン",
  variantType: "派生タイプ"
};

async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("data.json が見つかりません");
    DATA = await response.json();
    ALL = flattenData(DATA);

    bindEvents();
    renderStats();
    render();
  } catch (error) {
    els.cards.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <strong>${labels.dataLoadErrorTitle}</strong>
        ${labels.dataLoadErrorText}
      </div>
    `;
    els.resultMeta.textContent = error.message;
  }
}

function flattenData(data) {
  const rows = [];

  for (const category of data.super_categories || []) {
    for (const family of category.families || []) {
      for (const base of family.base_patterns || []) {
        for (const variant of base.variants || []) {
          rows.push({
            ...variant,
            SuperCategory: variant.SuperCategory || category.name,
            FamilyID: variant.FamilyID || family.family_id,
            Family: variant.Family || family.family,
            BasePattern: variant.BasePattern || base.base_pattern
          });
        }
      }
    }
  }

  return rows;
}

const unique = (arr) => [...new Set(arr.filter(Boolean))];

function norm(value) {
  return String(value ?? "").toLowerCase();
}

function imageUrl(item) {
  return item.imageUrl || item.ImageURL || item.image || item.Image || "";
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHTML(str);
}

function optionHTML(value, label) {
  return `<option value="${escapeAttr(value)}">${escapeHTML(label)}</option>`;
}

function setSelectOptions(select, placeholder, values, current) {
  select.innerHTML = optionHTML("", placeholder) + values.map(v => optionHTML(v, v)).join("");
  select.value = current || "";
}

function getFilteredBasePool() {
  return ALL.filter(item => {
    if (state.category && item.SuperCategory !== state.category) return false;
    if (state.family && item.Family !== state.family) return false;
    return true;
  });
}

function renderFilters() {
  const categories = unique(ALL.map(x => x.SuperCategory));

  const families = unique(
    ALL
      .filter(x => !state.category || x.SuperCategory === state.category)
      .map(x => x.Family)
  );

  const bases = unique(getFilteredBasePool().map(x => x.BasePattern));

  const priorities = unique(ALL.map(x => String(x.Priority)))
    .sort((a, b) => Number(a) - Number(b));

  setSelectOptions(els.categoryFilter, labels.categoryAll, categories, state.category);
  setSelectOptions(els.familyFilter, labels.familyAll, families, state.family);
  setSelectOptions(els.baseFilter, labels.baseAll, bases, state.base);

  els.priorityButtons.innerHTML =
    `<button class="chip-btn ${state.priority === "" ? "active" : ""}" data-priority="">${labels.all}</button>` +
    priorities
      .map(p => `<button class="chip-btn ${state.priority === p ? "active" : ""}" data-priority="${escapeAttr(p)}">P${escapeHTML(p)}</button>`)
      .join("");

  els.priorityButtons.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.priority = btn.dataset.priority;
      render();
    });
  });
}

function filteredRows() {
  const q = norm(state.search).trim();

  let rows = ALL.filter(item => {
    if (state.category && item.SuperCategory !== state.category) return false;
    if (state.family && item.Family !== state.family) return false;
    if (state.base && item.BasePattern !== state.base) return false;
    if (state.thesis && item.UseInMainThesis !== state.thesis) return false;
    if (state.real && item.IsRealPattern !== state.real) return false;
    if (state.priority && String(item.Priority) !== state.priority) return false;

    if (q) {
      const haystack = norm([
        item.RecordID,
        item.SuperCategory,
        item.Family,
        item.BasePattern,
        item.VariantName,
        item.EntryLayer,
        item.VariantType,
        item.GeometryType,
        item.Function,
        item.Application,
        item.ThesisRole,
        item.SourceKey,
        item.HierarchyPath
      ].join(" "));

      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  rows.sort((a, b) => {
    if (state.sort === "name") return String(a.VariantName).localeCompare(String(b.VariantName), "ja");
    if (state.sort === "family") return String(a.Family).localeCompare(String(b.Family), "ja");
    if (state.sort === "base") return String(a.BasePattern).localeCompare(String(b.BasePattern), "ja");

    return Number(a.Priority || 999) - Number(b.Priority || 999)
      || String(a.Family).localeCompare(String(b.Family), "ja")
      || String(a.VariantName).localeCompare(String(b.VariantName), "ja");
  });

  return rows;
}

function renderStats() {
  els.statRecords.textContent = ALL.length;
  els.statCategories.textContent = unique(ALL.map(x => x.SuperCategory)).length;
  els.statFamilies.textContent = unique(ALL.map(x => x.Family)).length;
  els.statBase.textContent = unique(ALL.map(x => x.BasePattern)).length;
}

function renderTree() {
  const tree = DATA.super_categories.map(category => {
    const families = (category.families || []).map(family => {
      const bases = (family.base_patterns || []).map(base => {
        const count = (base.variants || []).length;
        const active = state.base === base.base_pattern ? "active" : "";

        return `
          <button
            class="${active}"
            data-category="${escapeAttr(category.name)}"
            data-family="${escapeAttr(family.family)}"
            data-base="${escapeAttr(base.base_pattern)}"
          >
            ${escapeHTML(base.base_pattern)} · ${count}
          </button>
        `;
      }).join("");

      return `
        <details>
          <summary>${escapeHTML(family.family)}</summary>
          <div class="tree-inner">${bases}</div>
        </details>
      `;
    }).join("");

    return `
      <details>
        <summary>${escapeHTML(category.name)}</summary>
        <div class="tree-inner">${families}</div>
      </details>
    `;
  }).join("");

  els.patternTree.innerHTML = tree;

  els.patternTree.querySelectorAll("button[data-base]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      state.family = btn.dataset.family;
      state.base = btn.dataset.base;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function makeCard(item, idx) {
  const img = imageUrl(item);
  const safeName = escapeHTML(item.VariantName || "Untitled pattern");

  return `
    <article class="card">
      <div class="image-box">
        ${img ? `<img src="${escapeAttr(img)}" alt="${safeName}" />` : `<div class="placeholder-shape"></div>`}
        <div class="image-hint">
          <span class="badge">${escapeHTML(item.BasePattern || labels.basePattern)}</span>
          <span class="badge priority">P${escapeHTML(item.Priority ?? "-")}</span>
        </div>
      </div>

      <div class="card-body">
        <h3>${safeName}</h3>

        <div class="meta">
          <span class="mini">${escapeHTML(item.Family || "-")}</span>
          <span class="mini">${escapeHTML(item.VariantType || "-")}</span>
          <span class="mini">${labels.realPattern}: ${escapeHTML(item.IsRealPattern || "-")}</span>
        </div>

        <div class="field">
          <div class="field-label">${labels.geometry}</div>
          <div class="field-value">${escapeHTML(item.GeometryType || "—")}</div>
        </div>

        <div class="field">
          <div class="field-label">${labels.function}</div>
          <div class="field-value">${escapeHTML(item.Function || "—")}</div>
        </div>

        <div class="field">
          <div class="field-label">${labels.application}</div>
          <div class="field-value">${escapeHTML(item.Application || "—")}</div>
        </div>

        <div class="card-footer">
          <button class="details-btn" data-index="${idx}">${labels.details}</button>
        </div>
      </div>
    </article>
  `;
}

function renderCards() {
  const rows = filteredRows();

  els.resultTitle.textContent = state.base
    ? `${labels.basePattern}: ${state.base}`
    : state.family
      ? `${labels.family}: ${state.family}`
      : state.category
        ? state.category
        : labels.allPatterns;

  els.resultMeta.textContent = `${labels.shown} ${rows.length} ${labels.of} ${ALL.length} ${labels.patterns}`;

  if (!rows.length) {
    els.cards.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <strong>${labels.notFoundTitle}</strong>
        ${labels.notFoundText}
      </div>
    `;
    return;
  }

  els.cards.innerHTML = rows.map((item, idx) => makeCard(item, idx)).join("");

  els.cards.querySelectorAll(".details-btn").forEach(btn => {
    btn.addEventListener("click", () => openModal(rows[Number(btn.dataset.index)]));
  });
}

function openModal(item) {
  const img = imageUrl(item);

  els.modalTitle.textContent = item.VariantName || "Untitled pattern";
  els.modalSubtitle.textContent =
    item.HierarchyPath || `${item.SuperCategory} > ${item.Family} > ${item.BasePattern}`;

  els.modalImage.innerHTML = img
    ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(item.VariantName || "Pattern image")}" />`
    : `<div class="placeholder-shape"></div>`;

  const details = [
    ["レコードID", item.RecordID],
    ["上位カテゴリー", item.SuperCategory],
    ["ファミリー", item.Family],
    ["基本パターン", item.BasePattern],
    ["階層レベル", item.EntryLayer],
    ["派生タイプ", item.VariantType],
    ["実在パターン", item.IsRealPattern],
    ["優先度", item.Priority],
    ["修士研究での使用", item.UseInMainThesis],
    ["研究内での役割", item.ThesisRole],
    ["形状タイプ", item.GeometryType],
    ["機能", item.Function],
    ["応用分野", item.Application],
    ["出典キー", item.SourceKey],
    ["階層パス", item.HierarchyPath]
  ];

  els.modalDetails.innerHTML = details.map(([label, value]) => `
    <div class="detail-item ${label === "階層パス" || label === "応用分野" || label === "機能" ? "full" : ""}">
      <small>${escapeHTML(label)}</small>
      <span>${escapeHTML(value ?? "—")}</span>
    </div>
  `).join("");

  els.modal.classList.add("open");
}

function closeModal() {
  els.modal.classList.remove("open");
}

function bindEvents() {
  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderCards();
  });

  els.categoryFilter.addEventListener("change", (e) => {
    state.category = e.target.value;
    state.family = "";
    state.base = "";
    render();
  });

  els.familyFilter.addEventListener("change", (e) => {
    state.family = e.target.value;
    state.base = "";
    render();
  });

  els.baseFilter.addEventListener("change", (e) => {
    state.base = e.target.value;
    render();
  });

  els.thesisFilter.addEventListener("change", (e) => {
    state.thesis = e.target.value;
    renderCards();
  });

  els.realFilter.addEventListener("change", (e) => {
    state.real = e.target.value;
    renderCards();
  });

  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderCards();
  });

  els.resetBtn.addEventListener("click", () => {
    Object.assign(state, {
      search: "",
      category: "",
      family: "",
      base: "",
      thesis: "",
      real: "",
      priority: "",
      sort: "priority"
    });

    els.searchInput.value = "";
    els.thesisFilter.value = "";
    els.realFilter.value = "";
    els.sortSelect.value = "priority";

    render();
  });

  els.closeModal.addEventListener("click", closeModal);

  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function render() {
  renderFilters();
  renderCards();
}

loadData();
