# Genfuse v4: cài đặt và đưa lên mạng

## A. Chạy trên máy (VS Code)
1. Cài **Node.js 20 LTS** và **VS Code**. Giải nén zip, `File > Open Folder` chọn thư mục `genfuse`.
2. Terminal: `npm install`
3. Sao chép `.env.example` thành `.env.local`, điền các khóa (mục B, C).
4. `npm run dev`, mở http://localhost:3000 và http://localhost:3000/api/health (mọi mục phải `ok: true`).
5. Trước mỗi lần đưa lên mạng chạy `npm run build` và `npm test`. Nếu báo lỗi, đừng deploy.

## B. Supabase (làm 1 lần, và làm lại khi nâng cấp từ bản cũ)
1. Tạo project. **SQL Editor > New query**, dán toàn bộ `supabase/schema.sql`, Run.
   Tệp này dùng cho cả dự án mới lẫn dự án cũ đang chạy, chạy lại nhiều lần vẫn an toàn.
   **Nâng cấp từ "Gia Đình Số": bắt buộc chạy lại tệp này** để bộ đếm lượt chính xác tuyệt đối (thêm cột `rev` và trigger).
   Dữ liệu cũ (gia đình, câu chuyện, thanh toán) được giữ nguyên.
2. **Project Settings > API:** lấy URL, anon key, service_role key.
3. **Authentication > URL Configuration:** Site URL = địa chỉ thật (ví dụ `https://genfuse.vn`), Redirect URLs thêm `https://genfuse.vn/**` và `http://localhost:3000/**`.

## C. Khóa AI và PayOS
- **Gemini:** https://aistudio.google.com/apikey, dán vào `GEMINI_API_KEY`.
- **PayOS:** `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Webhook = `https://TÊN-MIỀN/api/payos/webhook`.

## D. Đưa lên Vercel
1. Đẩy mã lên GitHub, import repo ở https://vercel.com/new, thêm các biến môi trường trong `.env.example`.
2. **Settings > Functions > Function Region:** chọn vùng **cùng khu vực với Supabase** của bạn (ví dụ Singapore `sin1` nếu Supabase ở Singapore). Đây là cách giảm độ trễ lớn nhất cho người dùng ở Việt Nam.
3. Bật **Automatically expose System Environment Variables**. Deploy.
4. Mở `/api/health`. Khi mọi thứ xanh, đặt biến `HEALTH_KEY` (một chuỗi ngẫu nhiên dài) rồi Redeploy; từ đó mở `/api/health?key=CHUỖI-ĐÓ`.
5. Đổi tên miền: thêm tên miền ở Vercel, đặt `NEXT_PUBLIC_APP_URL`, cập nhật Site URL ở Supabase và webhook ở PayOS.

## E. Danh sách kiểm tra sau khi deploy
- Mở link: thấy chữ **Genfuse** ngay, vài trăm mili giây sau là cây câu chuyện, lật thẻ bài, vòng quay, nút chat Cháu Ngoan đều bấm được.
- Tạo gia đình mới, thêm một thành viên: vào thẳng màn hình chính, thanh trên cùng hiện đúng "Còn 5 lượt".
- Dùng 1 lượt (lưu câu chuyện, hoặc 1 tin nhắn cho Cháu Ngoan): thanh trên cùng đúng 4. Dùng tiếp: 3, 2, 1, 0. Tải lại trang, đổi tab, mở trên điện thoại thứ hai: số luôn khớp, không bao giờ tăng lại.
- Hai thiết bị cùng gia đình: Lật bài chạy mượt; Vòng quay (≥ 2 thành viên) hiện người thắng trên mọi máy.
- Thanh toán 39.000đ: quét QR, app tự mở khóa PRO trong vài giây.
- Điện thoại: "Thêm vào màn hình chính" để dùng như một ứng dụng.

## F. Trước khi kinh doanh thật
- Điền thông tin thật vào `/terms` và `/privacy` (các chỗ [trong ngoặc vuông]) và nhờ luật sư rà soát.
- Vercel gói Hobby chỉ dành cho dự án phi thương mại: khi thu tiền hãy dùng gói Pro. Cân nhắc gói Supabase Pro để có sao lưu tự động hằng ngày.
- Mã gia đình 6 ký tự chính là "mật khẩu" của gia đình (ai có mã đều vào được). Hãy nói rõ với khách hàng và khuyến khích chủ gia đình đăng ký bằng email.
- Lời nhắc chỉ đổ chuông khi trang đang mở (đã ghi trong điều khoản). Nếu muốn nhắc khi đóng trang cần thêm thông báo đẩy, là một hạng mục phát triển riêng.
