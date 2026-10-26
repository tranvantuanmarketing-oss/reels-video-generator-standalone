# 🎬 HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG TOOL REELS STORY STUDIO (PORTABLE)

> **Bản Độc Lập (Standalone)**: Chạy 100% trên máy tính cá nhân (Mac & Windows), hoàn toàn độc lập, không cần tài khoản, không cần server ngoài, không cần cài đặt phức tạp.

---

## 📌 YÊU CẦU MÁY TÍNH
1. **Node.js**: Đã cài Node.js (phiên bản 18, 20 hoặc mới nhất LTS từ [https://nodejs.org](https://nodejs.org)).
2. **Google Chrome** hoặc **Microsoft Edge**: Tool sử dụng trình duyệt để kết xuất thẻ bài chất lượng cao 1080×1920 (Windows có sẵn Edge hoặc Chrome; Mac có sẵn Chrome).

---

## 🚀 CÁCH KHỞI ĐỘNG TOOL

### 🍎 Dành cho người dùng macOS:
1. Giải nén thư mục `reels-video-generator-standalone`.
2. Click đúp vào file **`start.command`**.
   *(Lần đầu chạy tool sẽ tự động cài đặt thư viện cần thiết và mở trình duyệt tại `http://localhost:8090`)*.
   *(Nếu macOS báo "file from unidentified developer", vào System Settings -> Privacy & Security -> bấm Open Anyway)*.

### 🪟 Dành cho người dùng Windows:
1. Giải nén thư mục `reels-video-generator-standalone`.
2. Click đúp vào file **`start.bat`**.
   *(Tool sẽ tự động mở trình duyệt web và bắt đầu hoạt động)*.

### 💻 Hoặc chạy qua dòng lệnh (Terminal / CMD):
```bash
npm install
npm start
```
Mở trình duyệt truy cập: `http://localhost:8090`

---

## 🎨 5 MẪU VIDEO CHUẨN ĐƯỢC TÍCH HỢP SẴN
Bản này được tích hợp đúng **5 mẫu thẻ bài thịnh hành nhất** (như trong ảnh):

1. **#06 the-tim-vet-vang** (16.1s • Nền tĩnh • Chữ tối)
   - Bảng màu: `oai-huong` (mặc định), `xam-bac`, `xanh-la`.
2. **#07 photo-card** (22s • Nền tĩnh • Chữ tối)
   - Bảng màu: `butter` (mặc định), `mint`, `peach`, `sky`, `lilac`, `rose`, `sand`, `sage`.
3. **#08 the-vet-den-vang** (16.1s • Nền tĩnh • Chữ sáng)
   - Bảng màu: `than` (mặc định), `den-nau`, `den-xanh`.
4. **#09 the-vet-vang-nang** (16.1s • Nền tĩnh • Chữ tối)
   - Bảng màu: `vang-nang` (mặc định), `vang-bo`, `cam-nhat`.
5. **#10 the-vet-xanh-bien** (16.1s • Nền tĩnh • Chữ tối)
   - Bảng màu: `xanh-bien` (mặc định), `xanh-thep`, `xanh-troi`.

> **Mẹo**: Bạn có thể bấm nút **`‹`** hoặc **`›`** ngay trên từng card mẫu để đổi màu sắc mong muốn!

---

## 📖 QUY TRÌNH 4 BƯỚC TẠO VIDEO

### Bước 1: Nhập Kịch Bản Câu Chuyện
- Dán danh sách câu chuyện của bạn vào ô kịch bản. Tool hỗ trợ chuẩn định dạng `=== STORY ===` hoặc văn bản tự do.
- **Nếu chưa có kịch bản sẵn:** Bấm nút **"✨ Nạp 5 Kịch Bản Mẫu"** để thử nghiệm ngay lập tức.
- Bên phải sẽ hiển thị các thẻ câu chuyện đã nhận diện. Bấm vào từng câu chuyện để xem nội dung chi tiết.

### Bước 2: Chọn Mẫu Video
- Tích chọn các mẫu bạn muốn dùng.
- Chọn chế độ phối mẫu:
  - **Xoay vòng qua các mẫu đã chọn (Khuyên dùng):** Video 1 dùng mẫu 1, Video 2 dùng mẫu 2... giúp kênh đa dạng giao diện.
  - **Khóa 1 mẫu cố định:** Dùng duy nhất 1 mẫu cho toàn bộ các video trong lô.
  - **Phối ngẫu nhiên.**

### Bước 3: Nhạc Nền, Avatar & Thông Số
- **Avatar:** Chọn xoay vòng tự động từ kho 20 khuôn mặt hoặc chọn 1 ảnh cố định. (Có thể thả thêm ảnh vào thư mục `assets/avatars/`).
- **Nhạc nền:** Chọn xoay vòng các bản nhạc kịch tính/trầm ấm, bấm nút "▶ Nghe" để nghe thử. (Có thể thả thêm file `.mp3` vào thư mục `assets/audio/`).
- **Độ phân giải:** 1080 × 1920 (Full HD sắc nét cho Reels/TikTok) hoặc 720 × 1280.
- **Âm lượng nhạc:** Mặc định 80%, có sẵn hiệu ứng tự động fade-in khi bắt đầu và fade-out khi kết thúc.

### Bước 4: Xem Trước & Dựng Video
- Xem khung hiển thị điện thoại 9:16 (Live Preview) để kiểm tra chữ có vừa vặn, màu sắc có đẹp không.
- Bấm nút **"🚀 BẮT ĐẦU DỰNG LÔ VIDEO"**.
- Theo dõi thanh tiến trình thời gian thực (0% → 100%).
- Khi dựng xong, bạn có thể:
  - Bấm **"▶ Xem & Tải MP4"** để tải từng video về máy.
  - Bấm **"📄 Caption & Comment"** để copy nội dung đăng bài kèm hashtag và link phần 2.
  - Bấm **"📦 Tải Trọn Bộ File ZIP"** để tải toàn bộ video và caption của cả lô chỉ trong 1 file nén.

---

## 📁 CẤU TRÚC THƯ MỤC
```text
reels-video-generator-standalone/
├── assets/
│   ├── audio/           # Kho nhạc nền MP3/MP4 (có thể thêm nhạc của bạn)
│   ├── avatars/         # Kho ảnh đại diện nhân vật (có thể thêm ảnh của bạn)
│   ├── backgrounds/     # Video nền 2.mp4
│   ├── templates.json   # Cấu hình 5 mẫu thẻ bài chuẩn
│   └── languages.json   # Từ điển đa ngôn ngữ (PL, FR, NL, EN, DE,...)
├── lib/
│   ├── renderEngine.js      # Bộ kết xuất MP4 bằng Chrome Headless & FFmpeg
│   ├── templateRenderer.js  # Bộ sinh HTML thẻ bài
│   └── storyParser.js       # Bộ tách câu chuyện
├── public/
│   ├── index.html       # Giao diện người dùng
│   ├── style.css        # Giao diện hiện đại
│   ├── app.js           # Xử lý logic frontend
│   └── outputs/         # Thư mục chứa video đã xuất
├── server.js            # Máy chủ web độc lập (Port 8090)
├── start.command        # File khởi động nhanh trên macOS
├── start.bat            # File khởi động nhanh trên Windows
└── package.json         # Danh sách thư viện Node.js
```

---

## ❓ CÂU HỎI THƯỜNG GẶP (FAQ)
1. **Tôi muốn thêm nhạc của mình thì làm thế nào?**
   - Chỉ cần copy file `.mp3` vào thư mục `assets/audio/` rồi tải lại trang web là nhạc mới sẽ xuất hiện ngay!
2. **Tôi muốn thêm ảnh avatar thì làm thế nào?**
   - Copy file ảnh `.jpg` hoặc `.png` vào thư mục `assets/avatars/`.
3. **Video xuất ra lưu ở đâu?**
   - Video và file text chú thích được lưu trong thư mục `public/outputs/batch_xxx/`. Bạn cũng có thể tải trực tiếp qua giao diện web.
