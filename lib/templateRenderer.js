/**
 * Template Renderer - Trình biên dịch HTML thẻ bài cho Live Preview và Render Video
 */
const fs = require("fs");
const path = require("path");

const templatesPath = path.join(__dirname, "../assets/templates.json");
const languagesPath = path.join(__dirname, "../assets/languages.json");
const assetsMapPath = path.join(__dirname, "../assets/assets.json");

let templates = [];
let languages = [];
let assetsMap = {};

try {
  templates = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
} catch (e) {
  console.error("Không thể đọc templates.json:", e);
}

try {
  languages = JSON.parse(fs.readFileSync(languagesPath, "utf-8"));
} catch (e) {
  console.error("Không thể đọc languages.json:", e);
}

try {
  assetsMap = JSON.parse(fs.readFileSync(assetsMapPath, "utf-8"));
} catch (e) {
  console.error("Không thể đọc assets.json:", e);
}

function getLanguage(locale) {
  const norm = (locale || "en").toLowerCase();
  const found = languages.find((l) => l.id.toLowerCase() === norm);
  return found || languages.find((l) => l.id === "en") || languages[0] || {
    sampleName: "Maja Nowak",
    time: "3 godz. temu",
    ctaBar: "Czytaj dalej w komentarzach",
    ctaBox: "Czytaj dalej",
    ctaPill: "Czytaj dalej",
    cta: { default: "Czytaj dalej" }
  };
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

function buildTemplateHtml(template, paletteIndex = 0, locale = "pl", customContent = {}) {
  if (!template || !template.pals || template.pals.length === 0) {
    return "<div style='color:red;padding:20px;'>Mẫu không tồn tại</div>";
  }

  const L = getLanguage(locale);
  const pal = template.pals[paletteIndex % template.pals.length];
  let html = pal.html;

  // 1. Thay thế assets cơ bản (@@AV@@, @@CLIP@@, @@ANH@@)
  for (const [key, uri] of Object.entries(assetsMap)) {
    if (key === "@@AV@@" && customContent.avatarUrl) {
      html = html.split(key).join(customContent.avatarUrl);
    } else {
      html = html.split(key).join(uri);
    }
  }

  // 2. Thay thế thông tin tác giả, mốc thời gian, nút CTA
  const authorName = customContent.name || customContent.author || L.sampleName;
  const timeText = customContent.time || customContent.timeAgo || L.time;
  const ctaText = customContent.cta || (L.cta && (L.cta[template.id] || L.cta.default)) || "Czytaj dalej";

  html = html
    .split("@@NAME@@").join(escapeHtml(authorName))
    .split("@@TIME@@").join(escapeHtml(timeText))
    .split("@@CTA@@").join(escapeHtml(ctaText))
    .split("@@CTABOX@@").join(escapeHtml(ctaText || L.ctaBox))
    .split("@@CTAPILL@@").join(escapeHtml(ctaText || L.ctaPill))
    .split("@@BAR@@").join(escapeHtml(ctaText || L.ctaBar));

  // 3. Thay thế nội dung chữ câu chuyện (Body)
  let rawBody = customContent.body || customContent.content || "";
  let lines = [];
  if (Array.isArray(customContent.bodyLines) && customContent.bodyLines.length > 0) {
    lines = customContent.bodyLines;
  } else if (rawBody) {
    lines = rawBody.split("\n").filter((l) => l.trim().length > 0);
  }

  if (lines.length > 0) {
    const linesHtml = lines
      .map((line, idx) => {
        let safeLine = escapeHtml(line);
        if (customContent.highlights && Array.isArray(customContent.highlights)) {
          for (const hl of customContent.highlights) {
            if (hl && hl.trim()) {
              const safeHl = escapeHtml(hl.trim());
              if (safeLine.includes(safeHl)) {
                safeLine = safeLine.split(safeHl).join(`<span class="r font-bold">${safeHl}</span>`);
              }
            }
          }
        }
        return `<p class="line line-${idx + 1}" style="margin: 0 0 0.5em 0;">${safeLine}</p>`;
      })
      .join("");

    // Thay thế sạch sẽ nội dung trong container #body
    html = html.replace(/(<div[^>]*\bid=["']?body["']?[^>]*>)([\s\S]*?)(<\/div>)/i, (_match, open, previous, close) => {
      const inlineCta = previous.match(/<span\b[^>]*class=["'][^"']*\bcta\b[^"']*["'][^>]*>[\s\S]*?<\/span>/i)?.[0] || "";
      return `${open}${linesHtml}${inlineCta}${close}`;
    });
  }

  // 4. Script tự động căn chỉnh cỡ chữ (fitBody)
  const injection = `
    <script>
      (function() {
        function initCard() {
          if (typeof window.fitBody === 'function') {
            window.fitBody();
          }
          if (document.fonts) {
            document.fonts.ready.then(function(){ if(window.fitBody) window.fitBody(); });
          }
          document.querySelectorAll('img').forEach(function(img){
            img.addEventListener('load', function(){ if(window.fitBody) window.fitBody(); });
          });
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initCard);
        } else {
          initCard();
        }
        window.addEventListener('resize', initCard);
      })();
    </script>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${injection}</body>`);
  }
  return html + injection;
}

module.exports = {
  templates,
  languages,
  assetsMap,
  getLanguage,
  buildTemplateHtml
};
