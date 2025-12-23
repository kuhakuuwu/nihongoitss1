-- Drop existing foreign key constraints nếu có
ALTER TABLE IF EXISTS classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE IF EXISTS class_students DROP CONSTRAINT IF EXISTS class_students_student_id_fkey;

-- Recreate foreign key constraints với đúng schema
ALTER TABLE classes 
ADD CONSTRAINT classes_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE class_students 
ADD CONSTRAINT class_students_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Verify constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('classes', 'class_students');
