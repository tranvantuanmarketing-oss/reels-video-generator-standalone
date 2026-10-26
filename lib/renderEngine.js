/**
 * Render Engine - Dựng Video MP4 9:16 bằng Headless Chrome & FFmpeg
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");
const { buildTemplateHtml, templates } = require("./templateRenderer");

const execute = promisify(execFile);

// Tìm trình duyệt Chrome / Chromium / Edge trên Mac, Windows, Linux
function findChromePath() {
  const envBin = process.env.CHROME_BIN;
  if (envBin && fs.existsSync(envBin)) return envBin;

  const candidates = [
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ];

  for (let p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

// Tìm FFmpeg (ffmpeg-static hoặc ffmpeg hệ thống)
function getFfmpegPath() {
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch (e) {}

  // Fallback to system ffmpeg
  return "ffmpeg";
}

async function renderSingleVideo(story, options = {}) {
  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error(
      "Không tìm thấy Google Chrome hoặc Microsoft Edge trên máy này. Vui lòng cài đặt Google Chrome để render video!"
    );
  }

  const ffmpegPath = getFfmpegPath();
  const templateId = options.templateId || "the-tim-vet-vang";
  const paletteIndex = Number(options.paletteIndex || 0);
  const duration = Number(options.duration || 16.1);
  const resolution = options.resolution || "1080x1920";
  const fps = Number(options.fps || 30);
  const volume = Number(options.volume || 0.8);
  const outputDir = options.outputDir || path.join(__dirname, "../public/outputs");
  const onProgress = options.onProgress || (() => {});

  const [w, h] = resolution.split("x").map(Number);
  const tpl = templates.find((t) => t.id === templateId) || templates[0];

  // Resolve background video
  let bgPath = options.backgroundPath;
  if (!bgPath || !fs.existsSync(bgPath)) {
    bgPath = path.join(__dirname, "../assets/backgrounds/2.mp4");
  }

  // Resolve audio
  let audioPath = options.audioPath;
  if (audioPath && !fs.existsSync(audioPath)) {
    audioPath = null;
  }

  // Resolve avatar to base64 or url
  let avatarDataUrl = options.avatarUrl;
  if (options.avatarFile) {
    const fullAvPath = path.isAbsolute(options.avatarFile)
      ? options.avatarFile
      : path.join(__dirname, "../assets/avatars", options.avatarFile);
    if (fs.existsSync(fullAvPath)) {
      const ext = path.extname(fullAvPath).toLowerCase().replace(".", "");
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const b64 = fs.readFileSync(fullAvPath).toString("base64");
      avatarDataUrl = `data:${mime};base64,${b64}`;
    }
  }

  // Build HTML
  const compiledHtml = buildTemplateHtml(tpl, paletteIndex, options.locale || "pl", {
    name: story.author,
    time: story.timeAgo,
    body: story.content,
    highlights: story.highlights,
    cta: story.cta,
    avatarUrl: avatarDataUrl
  });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "reels-render-"));
  const htmlFile = path.join(tempDir, "card.html");
  const pngFile = path.join(tempDir, "card.png");

  fs.mkdirSync(outputDir, { recursive: true });

  const safeTitle = (story.title || "video").replace(/[^\w\d-_]/g, "_").slice(0, 30);
  const baseName = `${String(story.index || 1).padStart(2, "0")}_${tpl.id}_${safeTitle}`;
  const finalMp4 = path.join(outputDir, `${baseName}.mp4`);
  const captionFile = path.join(outputDir, `${baseName}_caption.txt`);
  const partMp4 = path.join(outputDir, `${baseName}.part.mp4`);

  try {
    onProgress(10, "Đang chụp ảnh thẻ bài chất lượng cao...");

    // Scale card 720x1280 to target window size without distortion
    const htmlWrapper = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;overflow:hidden;"><style>body{transform:scale(${w / 720});transform-origin:top left;}html{width:${w}px;height:${h}px;overflow:hidden;}</style>${compiledHtml}</body></html>`;

    fs.writeFileSync(htmlFile, htmlWrapper, "utf-8");

    // Capture screenshot with Headless Chrome
    const chromeArgs = [
      "--headless=new",
      "--disable-gpu",
      `--user-data-dir=${path.join(tempDir, "chrome_profile")}`,
      "--hide-scrollbars",
      "--no-first-run",
      `--window-size=${w},${h}`,
      "--force-device-scale-factor=1",
      "--virtual-time-budget=2500",
      `--screenshot=${pngFile}`,
      `file://${htmlFile}`
    ];

    try {
      await execute(chromePath, chromeArgs, { timeout: 45000, maxBuffer: 10 * 1024 * 1024 });
    } catch (chromeErr) {
      // Fallback for older chrome versions
      chromeArgs[0] = "--headless";
      await execute(chromePath, chromeArgs, { timeout: 45000, maxBuffer: 10 * 1024 * 1024 });
    }

    if (!fs.existsSync(pngFile) || fs.statSync(pngFile).size === 0) {
      throw new Error("Không thể chụp ảnh thẻ bài từ Chrome.");
    }

    onProgress(35, "Đang ghép video và xử lý âm thanh...");

    // Build FFmpeg command
    const ffmpegArgs = [
      "-y",
      "-stream_loop", "-1", "-i", bgPath,
      "-loop", "1", "-framerate", String(fps), "-i", pngFile
    ];

    if (audioPath && fs.existsSync(audioPath)) {
      ffmpegArgs.push("-stream_loop", "-1", "-i", audioPath);
    }

    ffmpegArgs.push(
      "-filter_complex",
      `[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1[bg];[1:v]scale=${w}:${h}[card];[bg][card]overlay=0:0:shortest=1[v]`,
      "-map", "[v]"
    );

    if (audioPath && fs.existsSync(audioPath)) {
      ffmpegArgs.push(
        "-map", "2:a:0",
        "-af", `volume=${volume},afade=t=in:st=0:d=0.25,afade=t=out:st=${Math.max(0, duration - 0.6)}:d=0.6`,
        "-c:a", "aac",
        "-b:a", "192k"
      );
    } else {
      ffmpegArgs.push("-an");
    }

    ffmpegArgs.push(
      "-t", String(duration),
      "-r", String(fps),
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-progress", "pipe:1",
      "-nostats",
      partMp4
    );

    await new Promise((resolve, reject) => {
      const child = spawn(ffmpegPath, ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });
      let errors = "";
      let buffer = "";

      child.stdout.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const m = line.match(/^out_time_us=(\d+)/);
          if (m) {
            const currentSec = Number(m[1]) / 1e6;
            const pct = Math.min(95, 35 + Math.round((currentSec / duration) * 60));
            onProgress(pct, `Đang kết xuất khung hình (${currentSec.toFixed(1)}s / ${duration}s)...`);
          }
        }
      });

      child.stderr.on("data", (chunk) => {
        errors += chunk.toString();
      });

      child.on("error", (err) => reject(err));
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg lỗi (code ${code}): ${errors.slice(-800)}`));
      });
    });

    if (fs.existsSync(partMp4)) {
      fs.renameSync(partMp4, finalMp4);
    }

    // Write companion caption & comment text file
    const txtContent = `=== STORY ${story.index || 1} ===
Tác giả: ${story.author || ""}
Thời gian: ${story.timeAgo || ""}
Tên Page: ${story.pageName || ""}
Tiêu đề: ${story.title || ""}

Nội dung thẻ bài:
${story.content || ""}

Nút CTA: ${story.cta || ""}

Caption đăng Reels/TikTok:
${story.caption || ""}

Comment 1 (Ghim đầu bài):
${story.comment1 || ""}
`;

    fs.writeFileSync(captionFile, txtContent, "utf-8");

    onProgress(100, "Hoàn tất!");

    return {
      success: true,
      videoPath: finalMp4,
      videoFileName: path.basename(finalMp4),
      captionPath: captionFile,
      captionFileName: path.basename(captionFile),
      fileSize: fs.existsSync(finalMp4) ? fs.statSync(finalMp4).size : 0,
      duration,
      resolution
    };
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
      if (fs.existsSync(partMp4)) fs.unlinkSync(partMp4);
    } catch (e) {}
  }
}

module.exports = {
  findChromePath,
  getFfmpegPath,
  renderSingleVideo
};
