-- Tạo storage bucket cho avatar người dùng
-- Chạy lệnh này trong Supabase SQL Editor hoặc tạo bucket qua Dashboard

-- Lưu ý: Bucket "user-avatars" cần được tạo thủ công trong Supabase Dashboard
-- hoặc sử dụng Storage API

-- Cấu hình policies cho storage bucket user-avatars
-- 1. Cho phép người dùng upload avatar của chính họ
-- 2. Cho phép tất cả mọi người xem avatar (public read)

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('user-avatars', 'user-avatars', true);

-- Public Read Policy
-- CREATE POLICY "Avatar are publicly accessible"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'user-avatars');

-- Upload Policy - Người dùng chỉ có thể upload avatar của mình
-- CREATE POLICY "Users can upload their own avatar"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'user-avatars' AND
--   (storage.foldername(name))[1] = 'avatars'
-- );

-- Update Policy
-- CREATE POLICY "Users can update their own avatar"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'user-avatars');

-- Delete Policy
-- CREATE POLICY "Users can delete their own avatar"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'user-avatars');

-- Thêm các cột cần thiết vào bảng users nếu chưa có
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS kana_first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS kana_last_name VARCHAR(100);

-- Comment
COMMENT ON COLUMN users.avatar_url IS 'URL ảnh đại diện người dùng';
COMMENT ON COLUMN users.phone IS 'Số điện thoại';
COMMENT ON COLUMN users.address IS 'Địa chỉ';
COMMENT ON COLUMN users.gender IS 'Giới tính: male, female, other';
COMMENT ON COLUMN users.date_of_birth IS 'Ngày sinh';
COMMENT ON COLUMN users.kana_first_name IS 'Tên viết bằng Kana (cho học sinh Nhật)';
COMMENT ON COLUMN users.kana_last_name IS 'Họ viết bằng Kana (cho học sinh Nhật)';
