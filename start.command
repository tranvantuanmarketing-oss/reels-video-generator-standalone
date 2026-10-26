#!/bin/zsh
# ==============================================================================
# The Story Video Studio - Khởi Động Trên macOS
# ==============================================================================

cd "$(dirname "$0")" || exit 1

echo "=================================================================="
echo "🎬 ĐANG KHỞI ĐỘNG REELS STORY STUDIO (PORTABLE)..."
echo "=================================================================="

# Kiểm tra Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Chưa tìm thấy Node.js trên máy của bạn!"
  echo "👉 Vui lòng tải và cài đặt Node.js từ https://nodejs.org (khuyên dùng bản LTS)."
  echo "Nhấn Enter để thoát..."
  read
  exit 1
fi

# Tự động cài dependencies nếu chưa có
if [ ! -d "node_modules" ]; then
  echo "📦 Lần đầu chạy: Đang tự động cài đặt thư viện cần thiết (npm install)..."
  npm install || { echo "❌ Cài đặt thất bại. Kiểm tra kết nối mạng."; read; exit 1; }
fi

PORT=8090

# Mở trình duyệt sau 1.5 giây
(sleep 1.5 && open "http://localhost:$PORT") &

# Chạy server
node server.js
