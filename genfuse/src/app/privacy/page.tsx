import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Chính sách bảo mật' };

// MẪU: thay các mục [trong ngoặc vuông] bằng thông tin thật và nhờ luật sư rà soát trước khi kinh doanh.
export default function Privacy() {
  return (
    <LegalPage title="Chính sách bảo mật" updated="[ngày/tháng/năm]">
      <p>[TÊN ĐƠN VỊ VẬN HÀNH] (“chúng tôi”) vận hành Genfuse. Trang này giải thích chúng tôi thu thập, dùng và bảo vệ dữ liệu của gia đình bạn như thế nào.</p>

      <h2>1. Dữ liệu chúng tôi lưu</h2>
      <ul>
        <li>Mã gia đình, tên và hình đại diện của từng thành viên, vai trò (ông bà, bố mẹ, thiếu niên, trẻ nhỏ).</li>
        <li>Câu chuyện, năm, ảnh và ghi âm giọng nói mà gia đình đăng.</li>
        <li>Lời nhắc (nội dung, giờ nhắc), trạng thái các trò chơi chung, lựa chọn giao diện.</li>
        <li>Email của chủ gia đình nếu bạn đăng ký quản lý bằng email.</li>
        <li>Thông tin đơn thanh toán (mã đơn, gói, số tiền, trạng thái). Chúng tôi không nhận hay lưu số thẻ hay mật khẩu ngân hàng của bạn.</li>
        <li>Tin nhắn gửi cho trợ lý “Cháu Ngoan” được gửi đến nhà cung cấp AI để tạo câu trả lời; lịch sử trò chuyện hiển thị được lưu trên chính thiết bị của bạn.</li>
      </ul>

      <h2>2. Mục đích sử dụng</h2>
      <p>Để vận hành các tính năng bạn dùng, đồng bộ giữa các thiết bị trong gia đình, kích hoạt gói PRO, hỗ trợ khi có sự cố và bảo vệ Dịch vụ khỏi lạm dụng. Chúng tôi không bán dữ liệu của bạn và không dùng nội dung gia đình để quảng cáo.</p>

      <h2>3. Bên xử lý dữ liệu</h2>
      <ul>
        <li>Supabase: cơ sở dữ liệu, lưu trữ ảnh và ghi âm, đăng nhập email.</li>
        <li>Vercel: máy chủ chạy ứng dụng.</li>
        <li>Google (Gemini) hoặc OpenAI: tạo câu trả lời của trợ lý và gợi ý AI.</li>
        <li>PayOS: xử lý thanh toán VietQR.</li>
      </ul>
      <p>Dữ liệu có thể được xử lý ở máy chủ nằm ngoài Việt Nam. [Bổ sung thông tin vùng lưu trữ thực tế bạn chọn.]</p>

      <h2>4. Trẻ em</h2>
      <p>Genfuse dành cho cả gia đình, gồm cả trẻ nhỏ. Hồ sơ của trẻ nhỏ do người lớn trong gia đình tạo và quản lý. Phụ huynh hoặc người giám hộ chịu trách nhiệm về nội dung và ảnh của trẻ mà họ đăng.</p>

      <h2>5. Thời gian lưu và quyền của bạn</h2>
      <ul>
        <li>Dữ liệu được lưu cho đến khi gia đình hoặc nội dung bị xóa. Xóa một thành viên sẽ xóa các lời nhắc gắn với thành viên đó.</li>
        <li>Bạn có quyền yêu cầu xem, chỉnh sửa, xóa dữ liệu hoặc rút lại sự đồng ý bằng cách gửi email tới [EMAIL BẢO MẬT]. Chúng tôi sẽ phản hồi trong [số ngày] ngày làm việc.</li>
      </ul>

      <h2>6. Bảo mật</h2>
      <p>Dữ liệu gia đình chỉ truy cập được qua máy chủ của chúng tôi và được kiểm tra bằng mã gia đình; trình duyệt không đọc trực tiếp cơ sở dữ liệu. Tuy vậy, ai biết mã gia đình đều vào được gia đình đó, nên hãy giữ kín mã. Không có hệ thống nào an toàn tuyệt đối; nếu phát hiện sự cố hãy báo ngay cho chúng tôi.</p>

      <h2>7. Lưu trên thiết bị</h2>
      <p>Chúng tôi lưu trên thiết bị của bạn (localStorage) mã gia đình, hồ sơ đang dùng, ngôn ngữ, giao diện và bản nhớ tạm danh sách thành viên để ứng dụng mở nhanh. Chúng tôi không dùng cookie quảng cáo.</p>

      <h2>8. Liên hệ</h2>
      <p>[TÊN ĐƠN VỊ], [ĐỊA CHỈ], [EMAIL BẢO MẬT]. Chúng tôi có thể cập nhật chính sách này và sẽ thông báo khi có thay đổi quan trọng.</p>
    </LegalPage>
  );
}
