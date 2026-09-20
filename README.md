# CineLight Cinema — Hệ Thống Đặt Vé Xem Phim & Gợi Ý Cá Nhân Hóa

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

> **Đồ Án Tốt Nghiệp / Bài Tập Lớn Chuyên Ngành Kỹ Thuật Phần Mềm**  
> **Phong cách thiết kế**: **Vibe Sáng (Light Clean Elegant Cinema)** — Sang trọng, tinh tế, tương phản cao, chuẩn công nghiệp chiếu rạp hiện đại.

---

## 📌 1. Kiến Trúc Dự Án (Clean Monorepo)

Hệ thống được tổ chức phân tầng rõ ràng theo mô hình Micro-service / Clean Monorepo:
- **`client/`**: Ứng dụng Web Frontend dành cho Khán giả và Quản trị viên (React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Sonner).
- **`server/`**: Máy chủ Backend RESTful API (Node.js, Express, TypeScript, Prisma ORM, MySQL 8.0).
- **`ml-service/`**: Dịch vụ thông minh gợi ý phim cá nhân hóa (Python, FastAPI, Scikit-learn, Content-based Cosine Similarity).

---

## ⚡ 2. Tính Năng Nghiệp Vụ Nổi Bật

1. **Giữ Ghế Thời Gian Thực Chống Đặt Trùng**:
   - Khóa ghế giữ chỗ chuẩn ngành **7 phút (420 giây)**.
   - Cơ chế bảo vệ xung đột đa luồng: Ràng buộc cơ sở dữ liệu `@@unique([showtimeId, seatId])` kết hợp `prisma.$transaction` ngăn chặn 100% race condition.
2. **Cổng Thanh Toán & Webhook HMAC-SHA512**:
   - Sinh mã VietQR động theo đơn đặt vé với tài khoản ngân hàng chính thức.
   - Xác thực chữ ký an toàn HMAC-SHA512 qua `crypto.timingSafeEqual` và kiểm tra khớp số tiền, trạng thái đơn hàng.
3. **Vé Điện Tử Rách Mép & Soát Vé QR Siêu Tốc**:
   - Vé điện tử hiển thị mã QR có chữ ký bảo mật HMAC-SHA256.
   - Thao tác soát vé nguyên tử (Atomic Check-in) chống quét đúp đồng thời và giới hạn khung giờ suất chiếu.
4. **Phân Hệ Quản Trị & Nhân Viên Rạp**:
   - **Admin Dashboard (`/admin`)**: Giám sát doanh thu trực tiếp, quản lý phim/suất chiếu, duyệt yêu cầu hoàn tiền, quản lý tài khoản nhân viên theo cụm rạp, xuất báo cáo doanh thu ra file Excel đa sheet (`.xlsx`).
   - **Staff Console (`/staff`)**: Soát vé QR, bán vé tại quầy (Box Office Walk-in), đổi ghế sự cố, đối chiếu sĩ số phòng chiếu.
5. **Đánh Giá & Nhận Xét Phim**:
   - Chấm điểm 1-10 sao tương tác kèm nhãn cảm xúc trực quan, tính toán điểm trung bình phim tự động, bảng phân bố cảm xúc người xem.

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết:
- **Node.js** >= 20.x
- **MySQL Server** >= 8.0 (đang chạy cổng 3306)
- **Git**

### Bước 1: Khởi tạo Cơ sở Dữ liệu & Server
1. Điều hướng vào thư mục backend:
   ```bash
   cd server
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Thiết lập tệp cấu hình môi trường:
   ```bash
   cp .env.example .env
   # Chỉnh sửa DATABASE_URL trong .env nếu mật khẩu MySQL khác '123456'
   ```
4. Thực thi Prisma Migrations để tạo cấu trúc bảng:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Khởi chạy máy chủ backend (Port 5000):
   ```bash
   npm run dev
   ```

### Bước 2: Khởi chạy Client Frontend
1. Mở một terminal mới và điều hướng vào thư mục client:
   ```bash
   cd client
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
4. Khởi chạy máy chủ phát triển Vite (Port 5173):
   ```bash
   npm run dev
   ```
5. Mở trình duyệt tại: `http://localhost:5173`

---

## 🔑 4. Danh Sách Tài Khoản Kiểm Thử Mặc Định

| Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu | Ranh Giới Quyền Hạn |
|---|---|---|---|
| **Quản Trị Viên (Admin)** | `admin@cinema.vn` | `123456` | Toàn quyền quản trị hệ thống, xem doanh thu, duyệt hoàn tiền, quản lý nhân viên |
| **Nhân Viên Rạp (Staff)** | `staff@cinema.vn` | `123456` | Quản lý soát vé và bán vé tại cụm rạp Landmark 81 |
| **Khách Hàng (Customer)** | `demo@cinema.vn` | `123456` | Đặt vé xem phim, giữ ghế 7 phút, thanh toán QR, gửi nhận xét phim |

---

## 🧪 5. Kiểm Thử Hệ Thống (Automated Test Suites)

- **Kiểm thử Backend (12 Test Files, 90+ Tests)**:
  ```bash
  cd server && npm run test
  ```
- **Kiểm thử Frontend (13 Test Files, 80+ Tests)**:
  ```bash
  cd client && npm run test
  ```
- **Kiểm tra biên dịch Type-safe**:
  ```bash
  cd server && npm run build
  cd client && npm run build
  ```
