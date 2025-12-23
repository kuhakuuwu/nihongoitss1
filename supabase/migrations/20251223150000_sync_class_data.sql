-- Migration: Đồng bộ dữ liệu từ users.class sang classes và class_students
-- Tạo ngày: 2025-12-23

-- Bước 1: Tạo các lớp trong bảng classes từ users.class (nếu chưa tồn tại)
INSERT INTO classes (name, teacher_id, description, created_at, updated_at)
SELECT DISTINCT 
    u.class as name,
    t.id as teacher_id,
    'Lớp được tạo tự động từ dữ liệu có sẵn' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
-- Lấy giáo viên đầu tiên làm owner (hoặc có thể chọn theo logic khác)
CROSS JOIN LATERAL (
    SELECT id 
    FROM users 
    WHERE role = 'teacher' 
    LIMIT 1
) t
WHERE u.class IS NOT NULL 
  AND u.class != '' 
  AND u.role = 'student'
  -- Chỉ tạo nếu chưa tồn tại trong classes
  AND NOT EXISTS (
    SELECT 1 FROM classes c WHERE c.name = u.class
  )
GROUP BY u.class, t.id;

-- Bước 2: Tạo liên kết trong class_students
INSERT INTO class_students (class_id, student_id, added_at)
SELECT DISTINCT
    c.id as class_id,
    u.id as student_id,
    NOW() as added_at
FROM users u
INNER JOIN classes c ON c.name = u.class
WHERE u.role = 'student'
  AND u.class IS NOT NULL
  AND u.class != ''
  -- Chỉ thêm nếu chưa tồn tại
  AND NOT EXISTS (
    SELECT 1 
    FROM class_students cs 
    WHERE cs.class_id = c.id 
      AND cs.student_id = u.id
  );

-- Bước 3: Cập nhật lại users.class cho những học sinh đã có trong class_students nhưng class field null
UPDATE users u
SET class = c.name
FROM class_students cs
INNER JOIN classes c ON c.id = cs.class_id
WHERE u.id = cs.student_id
  AND u.role = 'student'
  AND (u.class IS NULL OR u.class = '');

-- Xác nhận kết quả
DO $$
DECLARE
    class_count INTEGER;
    class_student_count INTEGER;
    user_with_class_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO class_count FROM classes;
    SELECT COUNT(*) INTO class_student_count FROM class_students;
    SELECT COUNT(*) INTO user_with_class_count FROM users WHERE role = 'student' AND class IS NOT NULL AND class != '';
    
    RAISE NOTICE 'Đồng bộ hoàn tất:';
    RAISE NOTICE '- Số lớp trong bảng classes: %', class_count;
    RAISE NOTICE '- Số liên kết trong class_students: %', class_student_count;
    RAISE NOTICE '- Số học sinh có class: %', user_with_class_count;
END $$;
