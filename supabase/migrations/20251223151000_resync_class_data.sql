-- Migration: Cập nhật lại các thông tin cũ từ users.class vào classes và class_students
-- Tạo ngày: 2025-12-23

-- Bước 1: Tạo các lớp còn thiếu trong bảng classes từ users.class
INSERT INTO classes (name, teacher_id, description, created_at, updated_at)
SELECT DISTINCT 
    u.class as name,
    t.id as teacher_id,
    'Lớp được tạo tự động từ dữ liệu có sẵn' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
-- Lấy giáo viên đầu tiên làm owner
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

-- Bước 2: Đồng bộ lại class_students từ users.class
-- Xóa các record không khớp
DELETE FROM class_students cs
WHERE NOT EXISTS (
    SELECT 1 
    FROM users u 
    INNER JOIN classes c ON c.name = u.class
    WHERE u.id = cs.student_id 
      AND c.id = cs.class_id
      AND u.role = 'student'
);

-- Thêm các record còn thiếu
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

-- Bước 3: Cập nhật ngược lại users.class từ class_students (cho những TH bị null)
UPDATE users u
SET class = c.name
FROM class_students cs
INNER JOIN classes c ON c.id = cs.class_id
WHERE u.id = cs.student_id
  AND u.role = 'student'
  AND (u.class IS NULL OR u.class = '' OR u.class != c.name);

-- Bước 4: Xóa users.class cho học sinh không còn trong lớp nào
UPDATE users u
SET class = NULL
WHERE u.role = 'student'
  AND u.class IS NOT NULL
  AND u.class != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM class_students cs 
    WHERE cs.student_id = u.id
  );

-- Xác nhận kết quả
DO $$
DECLARE
    class_count INTEGER;
    class_student_count INTEGER;
    user_with_class_count INTEGER;
    mismatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO class_count FROM classes;
    SELECT COUNT(*) INTO class_student_count FROM class_students;
    SELECT COUNT(*) INTO user_with_class_count FROM users WHERE role = 'student' AND class IS NOT NULL AND class != '';
    
    -- Kiểm tra số lượng không khớp
    SELECT COUNT(*) INTO mismatched_count
    FROM users u
    LEFT JOIN class_students cs ON cs.student_id = u.id
    LEFT JOIN classes c ON c.id = cs.class_id
    WHERE u.role = 'student'
      AND (
        (u.class IS NOT NULL AND u.class != '' AND cs.student_id IS NULL) OR
        (u.class IS NOT NULL AND u.class != '' AND c.name != u.class)
      );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Đồng bộ lại hoàn tất:';
    RAISE NOTICE '- Số lớp trong bảng classes: %', class_count;
    RAISE NOTICE '- Số liên kết trong class_students: %', class_student_count;
    RAISE NOTICE '- Số học sinh có class: %', user_with_class_count;
    RAISE NOTICE '- Số bản ghi không khớp: %', mismatched_count;
    RAISE NOTICE '========================================';
    
    IF mismatched_count > 0 THEN
        RAISE WARNING 'Còn % bản ghi không khớp giữa users.class và class_students!', mismatched_count;
    END IF;
END $$;
