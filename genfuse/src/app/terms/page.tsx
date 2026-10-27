import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Điều khoản sử dụng' };

// MẪU: thay các mục [trong ngoặc vuông] bằng thông tin thật của đơn vị vận hành và nhờ luật sư rà soát trước khi kinh doanh.
export default function Terms() {
  return (
    <LegalPage title="Điều khoản sử dụng" updated="[ngày/tháng/năm]">
      <p>Genfuse (“Dịch vụ”) do [TÊN ĐƠN VỊ VẬN HÀNH], địa chỉ [ĐỊA CHỈ], email liên hệ [EMAIL HỖ TRỢ] cung cấp. Khi tạo hoặc tham gia một gia đình trên Genfuse, bạn đồng ý với các điều khoản dưới đây.</p>

      <h2>1. Dịch vụ</h2>
      <p>Genfuse giúp các thành viên trong gia đình lưu câu chuyện và ký ức, đặt nhắc nhở, chơi trò chơi chung, tra cứu từ ngữ Gen Z và trò chuyện với trợ lý “Cháu Ngoan”. Dịch vụ không phải là dịch vụ y tế hay cấp cứu. Các lời nhắc và câu trả lời của trợ lý chỉ mang tính hỗ trợ; khi có dấu hiệu nguy hiểm đến sức khỏe, hãy gọi cấp cứu 115 hoặc đến cơ sở y tế.</p>

      <h2>2. Mã gia đình và trách nhiệm</h2>
      <ul>
        <li>Mã gia đình gồm 6 ký tự là chìa khóa vào gia đình. Ai có mã đều xem và thêm nội dung của gia đình đó. Hãy chỉ chia sẻ mã với người thân tin cậy.</li>
        <li>Chủ gia đình có thể đăng ký bằng email để quản lý thành viên.</li>
        <li>Bạn chịu trách nhiệm về nội dung mình đăng (chữ, ảnh, giọng nói) và cam kết có quyền sử dụng nội dung đó, không vi phạm pháp luật, không xâm phạm quyền của người khác.</li>
      </ul>

      <h2>3. Gói miễn phí và gói PRO</h2>
      <ul>
        <li>Mỗi gia đình có một số lượt dùng miễn phí (hiển thị trên thanh đầu trang), dùng chung cho cả gia đình. Các thao tác như lưu câu chuyện, hỏi trợ lý, dùng gợi ý AI, bắt đầu một ván trò chơi hoặc thêm nhắc nhở sẽ tính lượt.</li>
        <li>Gói PRO mở khóa không giới hạn lượt trong thời hạn đã mua (theo tháng hoặc theo năm), áp dụng cho cả gia đình. Giá hiển thị trong ứng dụng tại thời điểm thanh toán, tính bằng VND.</li>
        <li>Thanh toán qua cổng PayOS (chuyển khoản VietQR). Gói được kích hoạt tự động khi nhận đủ tiền. Gia hạn sẽ cộng thêm thời gian vào hạn hiện tại; Dịch vụ không tự động trừ tiền.</li>
        <li>Hoàn tiền: [CHÍNH SÁCH HOÀN TIỀN CỦA BẠN, ví dụ: hoàn trong 7 ngày nếu chưa sử dụng, liên hệ email hỗ trợ].</li>
      </ul>

      <h2>4. Trợ lý AI</h2>
      <p>Một số tính năng dùng trí tuệ nhân tạo của bên thứ ba. Câu trả lời có thể chưa chính xác. Đừng gửi thông tin nhạy cảm không cần thiết (số căn cước, số tài khoản, mật khẩu) vào khung trò chuyện.</p>

      <h2>5. Sử dụng không phù hợp</h2>
      <p>Không dùng Dịch vụ để đăng nội dung bất hợp pháp, quấy rối, độc hại; không cố truy cập gia đình của người khác, tấn công hay làm quá tải hệ thống. Chúng tôi có thể xóa nội dung hoặc tạm khóa gia đình vi phạm.</p>

      <h2>6. Nội dung của bạn</h2>
      <p>Nội dung thuộc về gia đình bạn. Bạn cho phép chúng tôi lưu trữ và hiển thị nội dung đó cho các thành viên của gia đình nhằm vận hành Dịch vụ. Hãy tự sao lưu những ký ức quan trọng.</p>

      <h2>7. Giới hạn trách nhiệm</h2>
      <p>Dịch vụ được cung cấp “như hiện có”. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp, mất dữ liệu do sự cố ngoài tầm kiểm soát hoặc việc bỏ lỡ lời nhắc do thiết bị (ví dụ trang bị đóng, tắt âm). Lời nhắc chỉ đổ chuông khi trang đang mở.</p>

      <h2>8. Thay đổi và liên hệ</h2>
      <p>Chúng tôi có thể cập nhật điều khoản và sẽ thông báo trong ứng dụng khi có thay đổi quan trọng. Luật áp dụng là pháp luật Việt Nam. Mọi thắc mắc: [EMAIL HỖ TRỢ].</p>
    </LegalPage>
  );
}
