// ユーザー追加 (学生・教師) / 学生をクラスに追加 (教師用)
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/Layout/TeacherLayout';
import { supabase } from '../supabaseClient';


export default function AddUserPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // Lấy role của user hiện tại từ localStorage
    const [currentUserRole] = useState(() => {
        if (typeof window === "undefined") return "admin";
        const stored = window.localStorage.getItem("user");
        if (!stored) return "admin";
        try {
            const user = JSON.parse(stored);
            return user.role || "admin";
        } catch (e) {
            return "admin";
        }
    });

    const isTeacherMode = currentUserRole === 'teacher';

    // States for Admin mode (add new user)
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [userCode, setUserCode] = useState('');
    const [classValue, setClassValue] = useState('');
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [sendNotification, setSendNotification] = useState(false);
    
    // States for Teacher mode (search and update student class)
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newClass, setNewClass] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);
    
    // Common states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load all students for teacher mode
    useEffect(() => {
        if (isTeacherMode) {
            loadStudents();
            loadAvailableClasses();
        }
    }, [isTeacherMode]);

    const loadAvailableClasses = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('classes')
                .select('name')
                .order('name', { ascending: true });

            if (fetchError) {
                console.error('Fetch classes error:', fetchError);
            } else {
                setAvailableClasses(data || []);
            }
        } catch (err) {
            console.error('Error loading classes:', err);
        }
    };

    const loadStudents = async () => {
        setSearchLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('id, username, user_code, class, email')
                .eq('role', 'student')
                .order('username', { ascending: true });

            if (fetchError) {
                console.error('Fetch error:', fetchError);
                setError(t('addUser.load_failed'));
            } else {
                setStudents(data || []);
                setFilteredStudents(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
            setError(t('addUser.load_failed'));
        } finally {
            setSearchLoading(false);
        }
    };

    // Filter students based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = students.filter(student => 
                student.username?.toLowerCase().includes(query) ||
                student.user_code?.toLowerCase().includes(query)
            );
            setFilteredStudents(filtered);
        }
    }, [searchQuery, students]);

    // Handle student selection
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setNewClass(student.class || '');
        setError('');
        setSuccess('');
    };

    // Handle update student class
    const handleUpdateClass = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const newClassName = newClass.trim();

            // Kiểm tra class có tồn tại trong bảng classes không
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id, name')
                .eq('name', newClassName)
                .single();

            if (classError && classError.code !== 'PGRST116') {
                throw classError;
            }

            if (!classData) {
                setError('Lớp không tồn tại. Vui lòng chọn lớp từ danh sách.');
                setLoading(false);
                return;
            }

            // Bước 1: Xóa record cũ trong class_students (nếu có)
            await supabase
                .from('class_students')
                .delete()
                .eq('student_id', selectedStudent.id);

            // Bước 2: Thêm record mới vào class_students
            const { error: insertError } = await supabase
                .from('class_students')
                .insert({
                    class_id: classData.id,
                    student_id: selectedStudent.id
                });

            if (insertError) throw insertError;

            // Bước 3: Update trường class trong bảng users
            const { error: updateError } = await supabase
                .from('users')
                .update({ class: newClassName })
                .eq('id', selectedStudent.id);

            if (updateError) throw updateError;

            setSuccess(t('addUser.update_success'));
            // Update local state
            setStudents(prev => prev.map(s => 
                s.id === selectedStudent.id ? { ...s, class: newClassName } : s
            ));
            setSelectedStudent(prev => ({ ...prev, class: newClassName }));
        } catch (err) {
            console.error('Error:', err);
            setError(t('addUser.update_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Handle add new user (Admin mode)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Kiểm tra email đã tồn tại chưa
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                setError(t('addUser.email_exists'));
                setLoading(false);
                return;
            }

            // Hash the temporary password before storing
            const hashedPassword = await hashPassword(tempPassword);

            // Thêm user mới vào database
            const { data, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username: name.trim(),
                        email: email,
                        password: hashedPassword,
                        role: role,
                        user_code: userCode.trim(),
                        class: role === 'student' ? classValue : null
                    }
                ])
                .select();

            if (insertError) {
                console.error('Insert error:', insertError);
                setError(t('addUser.add_failed'));
                setLoading(false);
                return;
            }

            console.log('User created:', data);
            setSuccess(t('addUser.add_success'));
            
            // Reset form
            setName('');
            setUserCode('');
            setClassValue('');
            setEmail('');
            setTempPassword('');
            setSendNotification(false);
            
        } catch (err) {
            console.error('Error:', err);
            setError(t('addUser.add_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Render Teacher Mode - Add student to class
    if (isTeacherMode) {
        return (
            <TeacherLayout title={t('addUser.add_student_title')}>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('addUser.add_student_to_class')}</h2>
                        
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        {/* Success Message */}
                        {success && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                {success}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Search and Student List */}
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('addUser.search_student')}
                                    </label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('addUser.search_placeholder')}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Student List */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {t('addUser.student_list')} ({filteredStudents.length})
                                        </span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {searchLoading ? (
                                            <div className="p-4 text-center text-gray-500">
                                                {t('common.loading')}
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                {t('addUser.no_students_found')}
                                            </div>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => handleSelectStudent(student)}
                                                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-green-50 transition-colors ${
                                                        selectedStudent?.id === student.id ? 'bg-green-100 border-l-4 border-l-green-500' : ''
                                                    }`}
                                                >
                                                    <div className="font-medium text-gray-900">{student.username}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {t('addUser.user_code')}: {student.user_code} | {t('addUser.class')}: {student.class || '-'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Selected Student Info & Update Class */}
                            <div>
                                {selectedStudent ? (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            {t('addUser.selected_student')}
                                        </h3>
                                        
                                        <div className="space-y-3 mb-5">
                                            <div>
                                                <span className="text-sm text-gray-500">{t('addUser.name')}:</span>
                                                <p className="font-medium text-gray-900">{selectedStudent.username}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">{t('addUser.user_code')}:</span>
                                                <p className="font-medium text-gray-900">{selectedStudent.user_code}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">{t('addUser.current_class')}:</span>
                                                <p className="font-medium text-gray-900">{selectedStudent.class || '-'}</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleUpdateClass} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    {t('addUser.new_class')} <span className="text-red-500">*</span>
                                                </label>
                                                {availableClasses.length > 0 ? (
                                                    <select
                                                        value={newClass}
                                                        onChange={(e) => setNewClass(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                                        required
                                                    >
                                                        <option value="">{t('addUser.class_placeholder')}</option>
                                                        {availableClasses.map((cls, idx) => (
                                                            <option key={idx} value={cls.name}>{cls.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newClass}
                                                        onChange={(e) => setNewClass(e.target.value)}
                                                        placeholder={t('addUser.class_placeholder')}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                                        required
                                                    />
                                                )}
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? t('common.processing') : t('addUser.update_class')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 flex items-center justify-center h-full min-h-[200px]">
                                        <p className="text-gray-500 text-center">
                                            {t('addUser.select_student_hint')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Back Button */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                {t('common.back')}
                            </button>
                        </div>
                    </div>
                </div>
            </TeacherLayout>
        );
    }

    // Render Admin Mode - Add new user
    return (
        <TeacherLayout title={t('addUser.title')}>
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{t('addUser.add_new_user')}</h2>
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('addUser.role')} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={role === 'student'}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{t('common.student')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        checked={role === 'teacher'}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{t('common.teacher')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('addUser.name_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.user_code')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={userCode}
                                    onChange={(e) => setUserCode(e.target.value)}
                                    placeholder={t('addUser.user_code_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Class Field - Only show for students */}
                        {role === 'student' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.class')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={classValue}
                                    onChange={(e) => setClassValue(e.target.value)}
                                    placeholder={t('addUser.class_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('addUser.email')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('addUser.email_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Temporary Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('addUser.temp_password')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                placeholder={t('addUser.temp_password_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                minLength={8}
                                required
                            />
                        </div>

                        {/* Notification Checkbox */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="notification"
                                    checked={sendNotification}
                                    onChange={(e) => setSendNotification(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="notification" className="text-sm font-medium text-gray-700">
                                    {t('addUser.send_notification')}
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.processing') : t('common.add')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TeacherLayout>
    );
}