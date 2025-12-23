-- Thêm các cột theo dõi deadline và tracking cho bảng messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reply_deadline_locked BOOLEAN DEFAULT false;

-- Thêm các cột tracking cho bảng message_recipients
ALTER TABLE message_recipients
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_late_reply BOOLEAN DEFAULT false;

-- Tạo index để tăng hiệu suất query
CREATE INDEX IF NOT EXISTS idx_messages_deadline ON messages(deadline);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_recipients_status ON message_recipients(status);
CREATE INDEX IF NOT EXISTS idx_message_recipients_read_at ON message_recipients(read_at);

-- Comment để giải thích
COMMENT ON COLUMN messages.deadline IS 'Thời hạn phản hồi cho tin nhắn';
COMMENT ON COLUMN messages.reply_deadline_locked IS 'Khóa phản hồi sau deadline';
COMMENT ON COLUMN message_recipients.read_at IS 'Thời điểm người nhận đọc tin nhắn';
COMMENT ON COLUMN message_recipients.replied_at IS 'Thời điểm người nhận phản hồi';
COMMENT ON COLUMN message_recipients.is_late_reply IS 'Đánh dấu phản hồi muộn (sau deadline)';
