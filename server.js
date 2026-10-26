/**
 * The Story Video Studio - Standalone Server
 * Chạy trên cổng 8090 (hoặc PORT do môi trường cấu hình)
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const archiver = require("archiver");
const { templates, languages, buildTemplateHtml } = require("./lib/templateRenderer");
const { parseStories, SAMPLE_STORIES } = require("./lib/storyParser");
const { findChromePath, getFfmpegPath, renderSingleVideo } = require("./lib/renderEngine");

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Phục vụ giao diện web tĩnh
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/outputs", express.static(path.join(__dirname, "public/outputs")));

// Lưu trạng thái các lô render trong bộ nhớ
const renderBatches = {};

// 1. Kiểm tra trạng thái hệ thống (Chrome & FFmpeg)
app.get("/api/system-status", (req, res) => {
  const chrome = findChromePath();
  const ffmpeg = getFfmpegPath();
  res.json({
    success: true,
    chromeFound: !!chrome,
    chromePath: chrome,
    ffmpegFound: !!ffmpeg,
    ffmpegPath: ffmpeg,
    os: os.type(),
    arch: os.arch()
  });
});

// 2. Lấy danh sách 5 mẫu thẻ bài chuẩn
app.get("/api/templates", (req, res) => {
  res.json({ success: true, data: templates });
});

// 3. Lấy danh sách ngôn ngữ hỗ trợ
app.get("/api/languages", (req, res) => {
  res.json({ success: true, data: languages });
});

// 4. Lấy danh sách avatars
app.get("/api/avatars", (req, res) => {
  try {
    const avDir = path.join(__dirname, "assets/avatars");
    const files = fs.readdirSync(avDir)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("."));
    res.json({ success: true, data: files });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

// 5. Lấy danh sách nhạc nền
app.get("/api/audio", (req, res) => {
  try {
    const auDir = path.join(__dirname, "assets/audio");
    const files = fs.readdirSync(auDir)
      .filter((f) => /\.(mp3|mp4|m4a|wav|aac)$/i.test(f) && !f.startsWith("."));
    res.json({ success: true, data: files });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

// 6. Lấy kịch bản mẫu
app.get("/api/sample-stories", (req, res) => {
  res.json({
    success: true,
    rawText: SAMPLE_STORIES,
    parsed: parseStories(SAMPLE_STORIES)
  });
});

// 7. Parse kịch bản từ text
app.post("/api/parse-stories", (req, res) => {
  const { rawText } = req.body;
  const stories = parseStories(rawText);
  res.json({ success: true, data: stories });
});

// 8. Tạo HTML cho Live Preview (Iframe)
app.post("/api/preview-html", (req, res) => {
  try {
    const { templateId, paletteIndex, story, locale, avatarFile } = req.body;
    const tpl = templates.find((t) => t.id === templateId) || templates[0];

    let avatarDataUrl = null;
    if (avatarFile) {
      const fullAvPath = path.isAbsolute(avatarFile)
        ? avatarFile
        : path.join(__dirname, "assets/avatars", avatarFile);
      if (fs.existsSync(fullAvPath)) {
        const ext = path.extname(fullAvPath).toLowerCase().replace(".", "");
        const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const b64 = fs.readFileSync(fullAvPath).toString("base64");
        avatarDataUrl = `data:${mime};base64,${b64}`;
      }
    }

    const html = buildTemplateHtml(tpl, Number(paletteIndex || 0), locale || "pl", {
      name: story?.author,
      time: story?.timeAgo,
      body: story?.content,
      highlights: story?.highlights,
      cta: story?.cta,
      avatarUrl: avatarDataUrl
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    res.status(500).send("Lỗi tạo preview: " + e.message);
  }
});

// 9. Bắt đầu Render Lô Video
app.post("/api/render-batch", async (req, res) => {
  try {
    const {
      stories,
      templateSelection, // { mode: 'cycle'|'single', selectedIds: [...], singleId, paletteIndices: {} }
      videoSettings,    // { duration, resolution, fps, volume }
      avatarSetting,    // { mode: 'random'|'single', avatarFile }
      audioSetting      // { mode: 'random'|'single', audioFile }
    } = req.body;

    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return res.status(400).json({ success: false, error: "Danh sách câu chuyện rỗng." });
    }

    const batchId = "batch_" + Date.now();
    const batchOutputDir = path.join(__dirname, "public/outputs", batchId);
    fs.mkdirSync(batchOutputDir, { recursive: true });

    // Lấy pool avatar và audio
    const avDir = path.join(__dirname, "assets/avatars");
    const allAvatars = fs.readdirSync(avDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("."));

    const auDir = path.join(__dirname, "assets/audio");
    const allAudio = fs.readdirSync(auDir).filter((f) => /\.(mp3|mp4|m4a|wav|aac)$/i.test(f) && !f.startsWith("."));

    const selectedTemplateIds = (templateSelection?.selectedIds && templateSelection.selectedIds.length > 0)
      ? templateSelection.selectedIds
      : templates.map((t) => t.id);

    const batchRecord = {
      id: batchId,
      status: "queued",
      createdAt: new Date().toISOString(),
      total: stories.length,
      completedCount: 0,
      failedCount: 0,
      currentStep: "Đang khởi tạo hàng đợi...",
      overallProgress: 0,
      items: [],
      outputDir: batchOutputDir
    };

    renderBatches[batchId] = batchRecord;

    // Phản hồi ngay để client theo dõi tiến trình
    res.json({ success: true, batchId });

    // Khởi chạy tác vụ render trong tiến trình nền
    (async () => {
      batchRecord.status = "rendering";

      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        story.index = i + 1;

        // Xác định template & palette cho video này
        let chosenTplId = selectedTemplateIds[0];
        if (templateSelection?.mode === "single" && templateSelection.singleId) {
          chosenTplId = templateSelection.singleId;
        } else {
          chosenTplId = selectedTemplateIds[i % selectedTemplateIds.length];
        }

        const tplObj = templates.find((t) => t.id === chosenTplId) || templates[0];
        const palIdx = templateSelection?.paletteIndices?.[chosenTplId] !== undefined
          ? Number(templateSelection.paletteIndices[chosenTplId])
          : (i % tplObj.pals.length);

        // Xác định avatar
        let chosenAvatar = null;
        if (avatarSetting?.mode === "single" && avatarSetting.avatarFile) {
          chosenAvatar = avatarSetting.avatarFile;
        } else if (allAvatars.length > 0) {
          chosenAvatar = allAvatars[i % allAvatars.length];
        }

        // Xác định audio
        let chosenAudio = null;
        if (audioSetting?.mode === "single" && audioSetting.audioFile) {
          chosenAudio = audioSetting.audioFile;
        } else if (allAudio.length > 0) {
          chosenAudio = allAudio[i % allAudio.length];
        }

        const audioFullPath = chosenAudio ? path.join(auDir, chosenAudio) : null;

        const itemRecord = {
          seq: i + 1,
          storyId: story.id,
          title: story.title || `Video ${i + 1}`,
          templateId: chosenTplId,
          paletteIndex: palIdx,
          avatarFile: chosenAvatar,
          audioFile: chosenAudio,
          status: "rendering",
          progress: 0,
          statusText: "Bắt đầu...",
          videoUrl: null,
          captionUrl: null,
          error: null
        };
        batchRecord.items.push(itemRecord);

        batchRecord.currentStep = `Đang dựng video ${i + 1}/${stories.length}: ${story.title || chosenTplId}`;

        try {
          const renderResult = await renderSingleVideo(story, {
            templateId: chosenTplId,
            paletteIndex: palIdx,
            duration: Number(videoSettings?.duration || tplObj.duration || 16.1),
            resolution: videoSettings?.resolution || "1080x1920",
            fps: Number(videoSettings?.fps || 30),
            volume: Number(videoSettings?.volume || 0.8),
            avatarFile: chosenAvatar,
            audioPath: audioFullPath,
            outputDir: batchOutputDir,
            onProgress: (pct, msg) => {
              itemRecord.progress = pct;
              itemRecord.statusText = msg;
              const completedWeight = (batchRecord.completedCount / stories.length) * 100;
              const currentWeight = (pct / stories.length);
              batchRecord.overallProgress = Math.min(99, Math.round(completedWeight + currentWeight));
            }
          });

          itemRecord.status = "completed";
          itemRecord.progress = 100;
          itemRecord.statusText = "Thành công!";
          itemRecord.videoUrl = `/outputs/${batchId}/${renderResult.videoFileName}`;
          itemRecord.captionUrl = `/outputs/${batchId}/${renderResult.captionFileName}`;
          itemRecord.fileSize = renderResult.fileSize;
          batchRecord.completedCount++;
        } catch (itemErr) {
          console.error(`Lỗi render video ${i + 1}:`, itemErr);
          itemRecord.status = "failed";
          itemRecord.error = itemErr.message;
          itemRecord.statusText = "Lỗi: " + itemErr.message;
          batchRecord.failedCount++;
        }

        batchRecord.overallProgress = Math.round(((i + 1) / stories.length) * 100);
      }

      batchRecord.status = batchRecord.failedCount === stories.length ? "failed" : "completed";
      batchRecord.currentStep = `Hoàn tất lô! Thành công: ${batchRecord.completedCount}/${stories.length}`;
      batchRecord.finishedAt = new Date().toISOString();
    })();
  } catch (err) {
    console.error("Lỗi khởi tạo lô:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Kiểm tra tiến trình Lô Render
app.get("/api/batch-status/:id", (req, res) => {
  const batch = renderBatches[req.params.id];
  if (!batch) {
    return res.status(404).json({ success: false, error: "Không tìm thấy lô dựng này." });
  }
  res.json({ success: true, data: batch });
});

// 11. Tải toàn bộ kết quả lô dưới dạng file ZIP
app.get("/api/download-zip/:id", (req, res) => {
  const batch = renderBatches[req.params.id];
  const batchDir = path.join(__dirname, "public/outputs", req.params.id);

  if (!fs.existsSync(batchDir)) {
    return res.status(404).send("Thư mục video không tồn tại.");
  }

  const archive = archiver("zip", { zlib: { level: 6 } });

  res.attachment(`reels_videos_${req.params.id}.zip`);

  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(batchDir, false);
  archive.finalize();
});

// Khởi động server
app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================================");
  console.log(`🎬 THE STORY VIDEO STUDIO (STANDALONE) ĐANG CHẠY!`);
  console.log(`👉 Truy cập trình duyệt tại: http://localhost:${PORT}`);
  console.log("==================================================================");
});
