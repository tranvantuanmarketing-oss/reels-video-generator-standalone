/**
 * Reels Story Studio Standalone - Frontend Application Logic
 */

// Application State
const state = {
  currentStep: 1,
  stories: [],
  selectedStoryIndex: 0,
  templates: [],
  selectedTemplateIds: [],
  paletteIndices: {}, // { 'the-tim-vet-vang': 0, ... }
  templateMode: "cycle", // 'cycle' | 'single' | 'random'
  singleTemplateId: "the-tim-vet-vang",
  avatars: [],
  selectedAvatar: null,
  avatarMode: "random", // 'random' | 'single'
  audioList: [],
  selectedAudio: null,
  audioMode: "random", // 'random' | 'single'
  settings: {
    resolution: "1080x1920",
    duration: "auto",
    volume: 0.8,
    locale: "pl"
  },
  activeBatchId: null,
  pollTimer: null
};

// DOM Elements
const el = {
  chromePill: document.getElementById("chromeStatusPill"),
  ffmpegPill: document.getElementById("ffmpegStatusPill"),
  storyInput: document.getElementById("storyInputText"),
  storyCountBadge: document.getElementById("storyCountBadge"),
  storyChipsList: document.getElementById("storyChipsList"),
  selectedStoryPreview: document.getElementById("selectedStoryPreviewCard"),
  btnLoadSample: document.getElementById("btnLoadSampleStories"),
  btnClearStories: document.getElementById("btnClearStories"),
  templatesContainer: document.getElementById("templatesCardsContainer"),
  templateApplyMode: document.getElementById("templateApplyMode"),
  avatarList: document.getElementById("avatarSelectorList"),
  avatarModeSelect: document.getElementById("avatarPickMode"),
  avatarCountBadge: document.getElementById("avatarCountBadge"),
  audioList: document.getElementById("audioSelectorList"),
  audioModeSelect: document.getElementById("audioPickMode"),
  globalAudioPlayer: document.getElementById("globalAudioPlayer"),
  settingRes: document.getElementById("settingResolution"),
  settingDur: document.getElementById("settingDuration"),
  settingVol: document.getElementById("settingVolume"),
  volLabel: document.getElementById("volumeValueLabel"),
  settingLoc: document.getElementById("settingLocale"),
  previewIframe: document.getElementById("previewIframe"),
  previewResBadge: document.getElementById("previewResBadge"),
  previewInfoText: document.getElementById("previewInfoText"),
  summaryCount: document.getElementById("summaryVideoCount"),
  summaryTplMode: document.getElementById("summaryTemplateMode"),
  summaryRes: document.getElementById("summaryResolution"),
  btnStartRender: document.getElementById("btnStartRender"),
  progressBox: document.getElementById("renderProgressBox"),
  overallStatusText: document.getElementById("overallStatusText"),
  overallPercentText: document.getElementById("overallPercentText"),
  overallProgressBar: document.getElementById("overallProgressBar"),
  currentStepDetail: document.getElementById("currentStepDetail"),
  resultsBox: document.getElementById("renderResultsBox"),
  btnDownloadZip: document.getElementById("btnDownloadAllZip"),
  resultsContainer: document.getElementById("resultsItemsContainer")
};

// Khởi chạy khi load trang
window.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await checkSystemStatus();
  await loadInitialData();
});

// 1. Kiểm tra trạng thái hệ thống
async function checkSystemStatus() {
  try {
    const res = await fetch("/api/system-status");
    const json = await res.json();
    if (json.success) {
      if (json.chromeFound) {
        el.chromePill.innerHTML = `<span class="status-dot dot-green"></span><span>Chrome: Đã sẵn sàng</span>`;
      } else {
        el.chromePill.innerHTML = `<span class="status-dot dot-warn"></span><span>Cần cài đặt Google Chrome!</span>`;
      }

      if (json.ffmpegFound) {
        el.ffmpegPill.innerHTML = `<span class="status-dot dot-green"></span><span>FFmpeg: Đã sẵn sàng</span>`;
      } else {
        el.ffmpegPill.innerHTML = `<span class="status-dot dot-warn"></span><span>Thiếu FFmpeg</span>`;
      }
    }
  } catch (e) {
    console.error("Lỗi kiểm tra hệ thống:", e);
  }
}

// 2. Tải dữ liệu ban đầu
async function loadInitialData() {
  try {
    // Tải danh sách 5 templates
    const tplRes = await fetch("/api/templates");
    const tplJson = await tplRes.json();
    if (tplJson.success) {
      state.templates = tplJson.data;
      state.selectedTemplateIds = state.templates.map((t) => t.id);
      state.templates.forEach((t) => {
        state.paletteIndices[t.id] = 0;
      });
      renderTemplatesList();
    }

    // Tải Avatars
    const avRes = await fetch("/api/avatars");
    const avJson = await avRes.json();
    if (avJson.success && avJson.data.length > 0) {
      state.avatars = avJson.data;
      state.selectedAvatar = state.avatars[0];
      el.avatarCountBadge.textContent = `${state.avatars.length} ảnh`;
      renderAvatarSelector();
    }

    // Tải Nhạc
    const auRes = await fetch("/api/audio");
    const auJson = await auRes.json();
    if (auJson.success && auJson.data.length > 0) {
      state.audioList = auJson.data;
      state.selectedAudio = state.audioList[0];
      renderAudioSelector();
    }

    // Tự động nạp kịch bản mẫu ban đầu
    await loadSampleStories();

  } catch (e) {
    console.error("Lỗi nạp dữ liệu ban đầu:", e);
  }
}

// 3. Setup Sự Kiện
function setupEventListeners() {
  // Chuyển tab bước
  document.querySelectorAll(".flow-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.getAttribute("data-step"));
      goToStep(step);
    });
  });

  // Kịch bản
  el.btnLoadSample.addEventListener("click", loadSampleStories);
  el.btnClearStories.addEventListener("click", () => {
    el.storyInput.value = "";
    parseCurrentStoryInput();
  });

  let parseTimeout = null;
  el.storyInput.addEventListener("input", () => {
    clearTimeout(parseTimeout);
    parseTimeout = setTimeout(parseCurrentStoryInput, 300);
  });

  // Chế độ phối mẫu
  el.templateApplyMode.addEventListener("change", (e) => {
    state.templateMode = e.target.value;
    updateSummary();
    updateLivePreview();
  });

  // Cấu hình video
  el.settingRes.addEventListener("change", (e) => {
    state.settings.resolution = e.target.value;
    el.previewResBadge.textContent = state.settings.resolution.replace("x", " × ");
    updateSummary();
  });

  el.settingDur.addEventListener("change", (e) => {
    state.settings.duration = e.target.value;
  });

  el.settingVol.addEventListener("input", (e) => {
    state.settings.volume = Number(e.target.value);
    el.volLabel.textContent = `${Math.round(state.settings.volume * 100)}%`;
  });

  el.settingLoc.addEventListener("change", (e) => {
    state.settings.locale = e.target.value;
    updateLivePreview();
  });

  el.avatarModeSelect.addEventListener("change", (e) => {
    state.avatarMode = e.target.value;
  });

  el.audioModeSelect.addEventListener("change", (e) => {
    state.audioMode = e.target.value;
  });

  // Bắt đầu render
  el.btnStartRender.addEventListener("click", startBatchRender);
}

// Chuyển Tab
window.goToStep = function (step) {
  state.currentStep = step;
  document.querySelectorAll(".flow-step-btn").forEach((b) => {
    const s = Number(b.getAttribute("data-step"));
    b.classList.toggle("active", s === step);
  });
  document.querySelectorAll(".step-pane").forEach((p, idx) => {
    p.classList.toggle("active", idx + 1 === step);
  });

  if (step === 4) {
    updateSummary();
    updateLivePreview();
  }
};

// 4. Parse Kịch Bản
async function loadSampleStories() {
  try {
    const res = await fetch("/api/sample-stories");
    const json = await res.json();
    if (json.success) {
      el.storyInput.value = json.rawText;
      state.stories = json.parsed;
      state.selectedStoryIndex = 0;
      renderStoryChips();
      updateSelectedStoryPreview();
      updateSummary();
    }
  } catch (e) {
    console.error("Lỗi nạp mẫu:", e);
  }
}

async function parseCurrentStoryInput() {
  const text = el.storyInput.value;
  try {
    const res = await fetch("/api/parse-stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: text })
    });
    const json = await res.json();
    if (json.success) {
      state.stories = json.data;
      if (state.selectedStoryIndex >= state.stories.length) {
        state.selectedStoryIndex = 0;
      }
      renderStoryChips();
      updateSelectedStoryPreview();
      updateSummary();
      updateLivePreview();
    }
  } catch (e) {
    console.error("Lỗi parse stories:", e);
  }
}

function renderStoryChips() {
  el.storyCountBadge.innerHTML = `Đã nhận diện: <strong>${state.stories.length} câu chuyện</strong>`;
  el.storyChipsList.innerHTML = "";

  state.stories.forEach((st, idx) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `story-chip ${idx === state.selectedStoryIndex ? "active" : ""}`;
    chip.textContent = `#${st.index} ${st.author}`;
    chip.addEventListener("click", () => {
      state.selectedStoryIndex = idx;
      renderStoryChips();
      updateSelectedStoryPreview();
      updateLivePreview();
    });
    el.storyChipsList.appendChild(chip);
  });
}

function updateSelectedStoryPreview() {
  const cur = state.stories[state.selectedStoryIndex];
  if (!cur) {
    el.selectedStoryPreview.innerHTML = `<p class="empty-state-text">Chưa có câu chuyện nào được chọn.</p>`;
    return;
  }

  const lines = (cur.content || "").split("\n").map((l) => `<p style="margin:4px 0;">${escapeHtml(l)}</p>`).join("");
  const hlText = (cur.highlights || []).join(" • ");

  el.selectedStoryPreview.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;border-bottom:1px solid #334155;padding-bottom:8px;">
      <strong style="color:#60a5fa;font-size:14px;">#${cur.index} • ${escapeHtml(cur.author)} (${escapeHtml(cur.timeAgo)})</strong>
      <span style="color:#94a3b8;font-size:12px;">${escapeHtml(cur.pageName || "")}</span>
    </div>
    <div style="color:#e2e8f0;margin-bottom:12px;line-height:1.5;">${lines}</div>
    ${hlText ? `<div style="font-size:12px;color:#f87171;margin-bottom:8px;"><strong>Highlights:</strong> ${escapeHtml(hlText)}</div>` : ""}
    <div style="font-size:12px;color:#fbbf24;margin-bottom:8px;"><strong>Nút CTA:</strong> ${escapeHtml(cur.cta)}</div>
    <div style="font-size:12px;color:#94a3b8;background:#1e293b;padding:8px;border-radius:6px;">
      <strong>Caption:</strong> ${escapeHtml(cur.caption || "")}
    </div>
  `;
}

// 5. Render 5 Mẫu Thẻ (Khớp ảnh giao diện)
function renderTemplatesList() {
  el.templatesContainer.innerHTML = "";

  state.templates.forEach((tpl, idx) => {
    const isPicked = state.selectedTemplateIds.includes(tpl.id);
    const palIdx = state.paletteIndices[tpl.id] || 0;
    const curPal = tpl.pals[palIdx % tpl.pals.length];

    const card = document.createElement("article");
    card.className = `template-card ${isPicked ? "picked" : ""}`;
    card.id = `tpl-card-${tpl.id}`;

    // Tags
    const tagsHtml = (tpl.nhan || ["Nền tĩnh", "Chữ tối"])
      .slice(0, 2)
      .map((t) => `<span class="tpl-tag">${escapeHtml(t)}</span>`)
      .join("");

    card.innerHTML = `
      <div class="tpl-stage-wrap">
        <iframe id="iframe-thumb-${tpl.id}" src="about:blank"></iframe>
      </div>
      <div class="tpl-meta-box">
        <div class="tpl-header-row">
          <span class="tpl-seq-id">#${String(idx + 6).padStart(2, "0")}</span>
          <span class="tpl-slug-name">${escapeHtml(tpl.id)}</span>
          <span class="tpl-duration">${tpl.duration || 16.1}s</span>
        </div>
        <div class="tpl-tags-row">
          ${tagsHtml}
        </div>
        <div class="tpl-palette-switch">
          <button type="button" class="pal-nav-btn" data-action="prev" data-id="${tpl.id}" title="Bảng màu trước">‹</button>
          <span class="pal-label-text">${escapeHtml(curPal.id)} • ${palIdx + 1}/${tpl.pals.length}</span>
          <button type="button" class="pal-nav-btn" data-action="next" data-id="${tpl.id}" title="Bảng màu tiếp">›</button>
        </div>
        <div class="tpl-action-row">
          <label class="tpl-check-label">
            <input type="checkbox" class="tpl-checkbox" data-id="${tpl.id}" ${isPicked ? "checked" : ""}>
            <span>Chọn mẫu này</span>
          </label>
          <a class="tpl-edit-link" data-id="${tpl.id}">
            ✏️ Sửa
          </a>
        </div>
      </div>
    `;

    // Sự kiện chuyển bảng màu
    card.querySelectorAll(".pal-nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        const tid = btn.getAttribute("data-id");
        const tObj = state.templates.find((t) => t.id === tid);
        let cur = state.paletteIndices[tid] || 0;
        if (action === "prev") {
          cur = (cur - 1 + tObj.pals.length) % tObj.pals.length;
        } else {
          cur = (cur + 1) % tObj.pals.length;
        }
        state.paletteIndices[tid] = cur;
        renderTemplatesList();
        updateLivePreview();
      });
    });

    // Sự kiện chọn checkbox
    const chk = card.querySelector(".tpl-checkbox");
    chk.addEventListener("change", (e) => {
      const tid = chk.getAttribute("data-id");
      if (e.target.checked) {
        if (!state.selectedTemplateIds.includes(tid)) {
          state.selectedTemplateIds.push(tid);
        }
      } else {
        state.selectedTemplateIds = state.selectedTemplateIds.filter((id) => id !== tid);
        if (state.selectedTemplateIds.length === 0) {
          state.selectedTemplateIds.push(tid); // Giữ ít nhất 1 mẫu
          chk.checked = true;
          return;
        }
      }
      card.classList.toggle("picked", chk.checked);
      updateSummary();
      updateLivePreview();
    });

    // Sự kiện click Sửa / Preview mẫu này
    card.querySelector(".tpl-edit-link").addEventListener("click", () => {
      state.singleTemplateId = tpl.id;
      updateLivePreview();
      goToStep(4);
    });

    el.templatesContainer.appendChild(card);

    // Load iframe thumbnail
    loadThumbnailIframe(tpl, palIdx);
  });
}

async function loadThumbnailIframe(template, paletteIndex) {
  const iframe = document.getElementById(`iframe-thumb-${template.id}`);
  if (!iframe) return;

  const sampleStory = state.stories[state.selectedStoryIndex] || {
    author: "Maja Nowak",
    timeAgo: "3 godz. temu",
    content: "Ngày thứ tư sau ca mổ, mẹ chồng đặt trước mặt tôi tập giấy.\nCon gái tôi nằm lồng kính tầng ba, sinh non tuần ba mươi hai.\nTôi mới nhìn con đúng bốn mươi giây thì họ đẩy tôi đi.\nBà vào lúc chín giờ hai mươi, không gõ cửa. \"Ký mấy cái này, thủ tục cho con bé thôi.\"\nTôi lật trang đầu. Không phải giấy khai sinh. Bên được ủy quyền: mẹ chồng tôi...",
    highlights: ["Ký mấy cái này", "Bên được ủy quyền: mẹ chồng tôi", "nét chữ của mẹ tôi"],
    cta: "Czytaj dalej"
  };

  try {
    const res = await fetch("/api/preview-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        paletteIndex,
        story: sampleStory,
        locale: state.settings.locale,
        avatarFile: state.selectedAvatar
      })
    });
    const html = await res.text();
    iframe.srcdoc = html;
  } catch (e) {
    console.error("Lỗi thumbnail iframe:", e);
  }
}

// 6. Render Avatar & Audio
function renderAvatarSelector() {
  el.avatarList.innerHTML = "";
  state.avatars.forEach((file) => {
    const img = document.createElement("img");
    img.src = `/assets/avatars/${file}`;
    img.className = `avatar-thumb ${file === state.selectedAvatar ? "active" : ""}`;
    img.title = file;
    img.addEventListener("click", () => {
      state.selectedAvatar = file;
      el.avatarModeSelect.value = "single";
      state.avatarMode = "single";
      renderAvatarSelector();
      updateLivePreview();
    });
    el.avatarList.appendChild(img);
  });
}

function renderAudioSelector() {
  el.audioList.innerHTML = "";
  state.audioList.forEach((file) => {
    const row = document.createElement("div");
    row.className = `audio-item-row ${file === state.selectedAudio ? "active" : ""}`;
    row.innerHTML = `
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${escapeHtml(file)}</span>
      <button type="button" class="btn btn-sm btn-secondary" style="padding:2px 8px;">▶ Nghe</button>
    `;
    row.addEventListener("click", () => {
      state.selectedAudio = file;
      el.audioModeSelect.value = "single";
      state.audioMode = "single";
      renderAudioSelector();
      el.globalAudioPlayer.src = `/assets/audio/${file}`;
      el.globalAudioPlayer.play().catch(() => {});
    });
    el.audioList.appendChild(row);
  });
}

// 7. Cập Nhật Tóm Tắt & Live Preview 9:16
function updateSummary() {
  el.summaryCount.textContent = `${state.stories.length} video`;
  const tplCount = state.selectedTemplateIds.length;
  if (state.templateMode === "single") {
    el.summaryTplMode.textContent = `Khóa 1 mẫu (${state.singleTemplateId})`;
  } else {
    el.summaryTplMode.textContent = `Xoay vòng ${tplCount} mẫu đã chọn`;
  }
  el.summaryRes.textContent = `${state.settings.resolution} (9:16)`;
}

async function updateLivePreview() {
  const curStory = state.stories[state.selectedStoryIndex] || {
    author: "Maja Nowak",
    timeAgo: "3 godz. temu",
    content: "Ngày thứ tư sau ca mổ, mẹ chồng đặt trước mặt tôi tập giấy.\nCon gái tôi nằm lồng kính tầng ba, sinh non tuần ba mươi hai.\nTôi mới nhìn con đúng bốn mươi giây thì họ đẩy tôi đi.\nBà vào lúc chín giờ hai mươi, không gõ cửa. \"Ký mấy cái này, thủ tục cho con bé thôi.\"\nTôi lật trang đầu. Không phải giấy khai sinh. Bên được ủy quyền: mẹ chồng tôi...",
    highlights: ["Ký mấy cái này", "Bên được ủy quyền: mẹ chồng tôi", "nét chữ của mẹ tôi"],
    cta: "Czytaj dalej"
  };

  const tplId = state.templateMode === "single"
    ? state.singleTemplateId
    : (state.selectedTemplateIds[0] || "the-tim-vet-vang");

  const tplObj = state.templates.find((t) => t.id === tplId) || state.templates[0];
  const palIdx = state.paletteIndices[tplId] || 0;
  const curPal = tplObj ? tplObj.pals[palIdx % tplObj.pals.length] : { id: "default" };

  el.previewInfoText.textContent = `Mẫu: ${tplId} • Màu: ${curPal.id} (${palIdx + 1}/${tplObj?.pals.length || 1})`;

  try {
    const res = await fetch("/api/preview-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: tplId,
        paletteIndex: palIdx,
        story: curStory,
        locale: state.settings.locale,
        avatarFile: state.selectedAvatar
      })
    });
    const html = await res.text();
    el.previewIframe.srcdoc = html;
  } catch (e) {
    console.error("Lỗi cập nhật preview:", e);
  }
}

// 8. Bắt Đầu Render Lô Video
async function startBatchRender() {
  if (state.stories.length === 0) {
    alert("Vui lòng nhập ít nhất 1 câu chuyện để dựng video!");
    goToStep(1);
    return;
  }

  el.btnStartRender.disabled = true;
  el.btnStartRender.textContent = "⏳ ĐANG DỰNG VIDEO...";
  el.progressBox.classList.remove("hidden");
  el.resultsBox.classList.add("hidden");
  el.overallProgressBar.style.width = "0%";
  el.overallPercentText.textContent = "0%";
  el.overallStatusText.textContent = "Đang khởi tạo...";

  try {
    const payload = {
      stories: state.stories,
      templateSelection: {
        mode: state.templateMode,
        selectedIds: state.selectedTemplateIds,
        singleId: state.singleTemplateId,
        paletteIndices: state.paletteIndices
      },
      videoSettings: {
        duration: state.settings.duration === "auto" ? null : Number(state.settings.duration),
        resolution: state.settings.resolution,
        fps: 30,
        volume: state.settings.volume
      },
      avatarSetting: {
        mode: state.avatarMode,
        avatarFile: state.selectedAvatar
      },
      audioSetting: {
        mode: state.audioMode,
        audioFile: state.selectedAudio
      }
    };

    const res = await fetch("/api/render-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Không thể khởi tạo lô.");
    }

    state.activeBatchId = json.batchId;
    startPollingBatchStatus(json.batchId);

  } catch (e) {
    alert("Lỗi khi dựng video: " + e.message);
    el.btnStartRender.disabled = false;
    el.btnStartRender.textContent = "🚀 BẮT ĐẦU DỰNG LÔ VIDEO";
  }
}

// 9. Polling tiến trình
function startPollingBatchStatus(batchId) {
  clearInterval(state.pollTimer);

  state.pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/batch-status/${batchId}`);
      const json = await res.json();
      if (!json.success) return;

      const batch = json.data;

      // Cập nhật giao diện tiến trình
      el.overallStatusText.textContent = batch.currentStep;
      el.overallPercentText.textContent = `${batch.overallProgress || 0}%`;
      el.overallProgressBar.style.width = `${batch.overallProgress || 0}%`;

      const activeItem = batch.items.find((it) => it.status === "rendering");
      if (activeItem) {
        el.currentStepDetail.textContent = `Video #${activeItem.seq}: ${activeItem.title} (${activeItem.statusText || ""})`;
      }

      // Khi hoàn tất toàn bộ lô
      if (batch.status === "completed" || batch.status === "failed") {
        clearInterval(state.pollTimer);
        el.btnStartRender.disabled = false;
        el.btnStartRender.textContent = "🚀 TIẾP TỤC DỰNG LÔ MỚI";
        el.progressBox.classList.add("hidden");
        el.resultsBox.classList.remove("hidden");
        el.btnDownloadZip.href = `/api/download-zip/${batchId}`;
        renderCompletedResults(batch.items);
      }
    } catch (e) {
      console.error("Lỗi poll status:", e);
    }
  }, 1000);
}

// 10. Hiển thị danh sách kết quả video
function renderCompletedResults(items) {
  el.resultsContainer.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-item-card";

    const isSuccess = item.status === "completed";
    const sizeMb = item.fileSize ? (item.fileSize / (1024 * 1024)).toFixed(1) : "0";

    card.innerHTML = `
      <div class="res-info">
        <span class="res-seq">#${String(item.seq).padStart(2, "0")}</span>
        <div>
          <div class="res-title">${escapeHtml(item.title)}</div>
          <div class="res-sub">Mẫu: ${escapeHtml(item.templateId)} • ${isSuccess ? `Dung lượng: ${sizeMb} MB` : `<span style="color:#ef4444;">${escapeHtml(item.error || "Lỗi")}</span>`}</div>
        </div>
      </div>
      <div class="res-actions">
        ${isSuccess ? `
          <a href="${item.videoUrl}" target="_blank" class="btn btn-sm btn-primary">▶ Xem & Tải MP4</a>
          <a href="${item.captionUrl}" target="_blank" class="btn btn-sm btn-secondary">📄 Caption & Comment</a>
        ` : `
          <span style="color:#ef4444;font-size:12px;font-weight:700;">Thất bại</span>
        `}
      </div>
    `;

    el.resultsContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
