# Reels Story Studio Portable (Standalone) 🎬

Tool tạo video Facebook Reels / TikTok / Shorts chuẩn 9:16 độc lập, chạy trực tiếp trên máy tính cá nhân (macOS & Windows), không cần server ngoài, không cần cơ sở dữ liệu.

---

## 🌟 Tính Năng Nổi Bật
- **Độc lập 100%:** Chạy hoàn toàn trên máy local, an toàn, bảo mật dữ liệu.
- **Tích hợp 5 mẫu video thịnh hành nhất:** Đi kèm hơn 20 bảng màu bắt mắt.
- **Auto-fit Typography:** Tự động co giãn cỡ chữ chuẩn xác theo nội dung, không bao giờ bị tràn viền hay che mặt nhân vật.
- **Âm thanh chuyên nghiệp:** Hỗ trợ kho nhạc nền tự động căn thời lượng, có hiệu ứng Fade-in / Fade-out mượt mà.
- **Xuất video chuẩn sắc nét:** Xuất MP4 H.264 Full HD (1080×1920) hoặc HD (720×1280).
- **Tự động tạo Caption & Comment:** Kèm hashtag và link dẫn Phần 2 cho từng câu chuyện.
- **Hỗ trợ tải trọn gói:** Tải từng video hoặc tải toàn bộ lô qua 1 file nén ZIP.

---

## 📌 Yêu Cầu Hệ Thống
1. **Node.js**: Phiên bản 18, 20 hoặc mới nhất (Tải tại [nodejs.org](https://nodejs.org) - khuyên dùng bản LTS).
2. **Trình duyệt**: Đã cài đặt **Google Chrome** hoặc **Microsoft Edge** (dùng cho Headless rendering thẻ bài chất lượng cao).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Tải source code về máy
```bash
git clone https://github.com/tranvantuanmarketing-oss/reels-video-generator-standalone.git
cd reels-video-generator-standalone
```

### 2. Khởi động nhanh (Khuyên dùng)
- **Trên macOS:** Click đúp vào file `start.command` (Hệ thống sẽ tự động chạy `npm install` nếu là lần đầu và tự mở trình duyệt).
- **Trên Windows:** Click đúp vào file `start.bat` (Hệ thống sẽ tự động cài đặt thư viện và mở trình duyệt).

### 3. Hoặc chạy thủ công qua dòng lệnh
```bash
# 1. Cài đặt thư viện (chỉ cần chạy lần đầu)
npm install

# 2. Khởi chạy tool
npm start
```

Mở trình duyệt truy cập: **`http://localhost:8090`**

---

## 📖 Hướng Dẫn Chi Tiết
Xem toàn bộ hướng dẫn sử dụng 4 bước và mẹo tùy chỉnh tại:
👉 [HUONG_DAN_CAI_DAT_VA_SU_DUNG.md](HUONG_DAN_CAI_DAT_VA_SU_DUNG.md)

---

## 📁 Cấu Trúc Dự Án
```text
reels-video-generator-standalone/
├── assets/
│   ├── audio/              # Nhạc nền MP3/MP4
│   ├── avatars/            # Ảnh đại diện nhân vật
│   ├── backgrounds/        # Video nền mẫu
│   ├── templates.json      # Cấu hình 5 mẫu video chuẩn
│   └── languages.json      # Từ điển đa ngôn ngữ (PL, FR, NL, EN, DE,...)
├── lib/
│   ├── renderEngine.js     # Engine dựng MP4 (Headless Chrome + FFmpeg)
│   ├── templateRenderer.js # Bộ tạo HTML mẫu thẻ bài
│   └── storyParser.js      # Bộ tách kịch bản câu chuyện
├── public/
│   ├── index.html          # Giao diện chính
│   ├── style.css           # Styling giao diện
│   ├── app.js              # Xử lý tương tác frontend
│   └── outputs/            # Thư mục chứa video đã kết xuất
├── server.js               # Web server Node.js Express (Port 8090)
├── start.command           # Khởi động 1-click macOS
├── start.bat               # Khởi động 1-click Windows
└── package.json            # Thư viện & cấu hình dự án
```
