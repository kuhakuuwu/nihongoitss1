-- Drop all existing policies for classes table
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON classes;

-- Drop all existing policies for class_students table
DROP POLICY IF EXISTS "Teachers can view their class students" ON class_students;
DROP POLICY IF EXISTS "Teachers can add students to their classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can remove students from their classes" ON class_students;

-- Disable Row Level Security
ALTER TABLE IF EXISTS classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS class_students DISABLE ROW LEVEL SECURITY;
