// Trang danh sách lớp học của giáo viên
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TeacherLayout from '../components/Layout/TeacherLayout';
import { supabase } from '../supabaseClient';

export default function ClassListPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [deletingClass, setDeletingClass] = useState(null);
    const [className, setClassName] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Lấy danh sách lớp học
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Lấy user ID thực từ database dựa trên email
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', currentUser.email)
                .single();

            if (userError || !userData) {
                console.error('User not found:', userError);
                setError('Không tìm thấy thông tin người dùng');
                setLoading(false);
                return;
            }

            const teacherId = userData.id;
            
            // Lấy danh sách lớp với số lượng học sinh
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    *,
                    class_students(count)
                `)
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format data với student count
            const formattedData = data.map(cls => ({
                ...cls,
                student_count: cls.class_students?.[0]?.count || 0
            }));

            setClasses(formattedData);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setError(t('classManagement.create_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Tìm kiếm học sinh
    const searchStudents = async (query) => {
        if (!query.trim()) {
            setAvailableStudents([]);
            return;
        }

        try {
            // Chỉ lấy học sinh chưa có trong class_students (chưa thuộc lớp nào)
            const { data: studentsInClasses, error: classStudentsError } = await supabase
                .from('class_students')
                .select('student_id');

            const studentIdsInClasses = studentsInClasses ? studentsInClasses.map(cs => cs.student_id) : [];

            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, user_code, first_name, last_name, class')
                .eq('role', 'student')
                .or(`email.ilike.%${query}%,username.ilike.%${query}%,user_code.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .limit(10);

            if (error) throw error;

            // Lọc bỏ học sinh đã được chọn hoặc đã có trong lớp khác
            const filtered = data.filter(
                student => !selectedStudents.find(s => s.id === student.id) && !studentIdsInClasses.includes(student.id)
            );

            setAvailableStudents(filtered);
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    // Thêm học sinh vào danh sách đã chọn
    const addStudent = (student) => {
        setSelectedStudents([...selectedStudents, student]);
        setAvailableStudents(availableStudents.filter(s => s.id !== student.id));
        setSearchQuery('');
    };

    // Xóa học sinh khỏi danh sách đã chọn
    const removeStudent = (studentId) => {
        setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
    };

    // Tạo lớp học mới
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!className.trim()) {
            setError(t('classManagement.class_name_required'));
            return;
        }

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Current user from localStorage:', currentUser);

            // Lấy user ID thực từ database dựa trên email
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', currentUser.email)
                .single();

            console.log('User data from DB:', userData, 'Error:', userError);

            if (userError || !userData) {
                setError('Không tìm thấy thông tin người dùng');
                console.error('Failed to get user ID:', userError);
                return;
            }

            const teacherId = userData.id;
            console.log('Teacher ID to use:', teacherId);

            // Kiểm tra tên lớp đã tồn tại
            const { data: existingClass } = await supabase
                .from('classes')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('name', className.trim())
                .single();

            if (existingClass) {
                setError(t('classManagement.class_name_exists'));
                return;
            }

            // Tạo lớp học
            const { data: newClass, error: classError } = await supabase
                .from('classes')
                .insert({
                    name: className.trim(),
                    description: description.trim() || null,
                    teacher_id: teacherId
                })
                .select()
                .single();

            if (classError) throw classError;

            // Thêm học sinh vào lớp
            if (selectedStudents.length > 0) {
                const classStudents = selectedStudents.map(student => ({
                    class_id: newClass.id,
                    student_id: student.id
                }));

                const { error: studentsError } = await supabase
                    .from('class_students')
                    .insert(classStudents);

                if (studentsError) throw studentsError;

                // Cập nhật trường class trong bảng users
                const studentIds = selectedStudents.map(s => s.id);
                const { error: updateClassError } = await supabase
                    .from('users')
                    .update({ class: className.trim() })
                    .in('id', studentIds);

                if (updateClassError) throw updateClassError;
            }

            setSuccess(t('classManagement.create_success'));
            setShowCreateModal(false);
            setClassName('');
            setDescription('');
            setSelectedStudents([]);
            fetchClasses();
        } catch (error) {
            console.error('Error creating class:', error);
            setError(t('classManagement.create_failed'));
        }
    };

    // Mở modal chỉnh sửa lớp
    const handleOpenEditModal = (cls) => {
        setEditingClass(cls);
        setClassName(cls.name);
        setDescription(cls.description || '');
        setShowEditModal(true);
        setError('');
        setSuccess('');
    };

    // Cập nhật lớp học
    const handleUpdateClass = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!className.trim()) {
            setError(t('classManagement.class_name_required'));
            return;
        }

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            // Lấy user ID thực từ database dựa trên email
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', currentUser.email)
                .single();

            if (userError || !userData) {
                setError('Không tìm thấy thông tin người dùng');
                return;
            }

            const teacherId = userData.id;

            // Kiểm tra tên lớp đã tồn tại (trừ lớp đang chỉnh sửa)
            const { data: existingClass } = await supabase
                .from('classes')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('name', className.trim())
                .neq('id', editingClass.id)
                .single();

            if (existingClass) {
                setError(t('classManagement.class_name_exists'));
                return;
            }

            // Cập nhật lớp học
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    name: className.trim(),
                    description: description.trim() || null
                })
                .eq('id', editingClass.id);

            if (updateError) throw updateError;

            // Nếu tên lớp thay đổi, cập nhật users.class cho học sinh trong lớp
            if (className.trim() !== editingClass.name) {
                const { data: classStudents } = await supabase
                    .from('class_students')
                    .select('student_id')
                    .eq('class_id', editingClass.id);

                if (classStudents && classStudents.length > 0) {
                    const studentIds = classStudents.map(cs => cs.student_id);
                    await supabase
                        .from('users')
                        .update({ class: className.trim() })
                        .in('id', studentIds);
                }
            }

            setSuccess(t('classManagement.update_success'));
            setShowEditModal(false);
            setEditingClass(null);
            setClassName('');
            setDescription('');
            fetchClasses();
        } catch (error) {
            console.error('Error updating class:', error);
            setError(t('classManagement.update_failed'));
        }
    };

    // Mở modal xác nhận xóa
    const handleOpenDeleteModal = (cls) => {
        setDeletingClass(cls);
        setShowDeleteModal(true);
        setError('');
        setSuccess('');
    };

    // Xóa lớp học
    const handleDeleteClass = async () => {
        try {
            // Lấy danh sách học sinh trong lớp để cập nhật users.class
            const { data: classStudents } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', deletingClass.id);

            // Xóa lớp học (cascade sẽ xóa class_students tự động nếu có ON DELETE CASCADE)
            const { error: deleteError } = await supabase
                .from('classes')
                .delete()
                .eq('id', deletingClass.id);

            if (deleteError) throw deleteError;

            // Cập nhật users.class về null cho học sinh trong lớp
            if (classStudents && classStudents.length > 0) {
                const studentIds = classStudents.map(cs => cs.student_id);
                await supabase
                    .from('users')
                    .update({ class: null })
                    .in('id', studentIds);
            }

            setSuccess(t('classManagement.delete_success'));
            setShowDeleteModal(false);
            setDeletingClass(null);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            setError(t('classManagement.delete_failed'));
            setShowDeleteModal(false);
        }
    };

    // Format ngày tháng
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'vn' ? 'vi-VN' : 'ja-JP');
    };

    // Lấy tên đầy đủ của học sinh
    const getStudentFullName = (student) => {
        if (student.first_name && student.last_name) {
            return i18n.language === 'vn'
                ? `${student.last_name} ${student.first_name}`
                : `${student.last_name} ${student.first_name}`;
        }
        return student.username || student.email;
    };

    if (loading) {
        return (
            <TeacherLayout title={t('classManagement.title')}>
                <div className="text-center py-10 text-gray-500">
                    {t('common.loading')}
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title={t('classManagement.title')}>
            <div className="space-y-4">
                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}
                {error && !showCreateModal && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Header với nút tạo lớp */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        {t('classManagement.create_class')}
                    </button>
                </div>

                {/* Bảng danh sách lớp */}
                {classes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                        {t('classManagement.no_classes')}
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {t('classManagement.class_name')}
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {t('classManagement.description')}
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {t('classManagement.student_count')}
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {t('classManagement.created_date')}
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {t('teacher.action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-900">
                                            {cls.name}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {cls.description || '—'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {cls.student_count}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {formatDate(cls.created_at)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/teacher/class/${cls.id}`)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                                                >
                                                    {t('common.detail')}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(cls)}
                                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium shadow-sm"
                                                >
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDeleteModal(cls)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal tạo lớp học */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                    {t('classManagement.create_class')}
                                </h3>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleCreateClass} className="space-y-6">
                                    {/* Tên lớp */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.class_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={className}
                                            onChange={(e) => setClassName(e.target.value)}
                                            placeholder={t('classManagement.class_name_placeholder')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Mô tả */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.description')}
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={t('classManagement.description_placeholder')}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Tìm kiếm và thêm học sinh */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.add_students')}
                                        </label>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                searchStudents(e.target.value);
                                            }}
                                            placeholder={t('classManagement.search_student_to_add')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />

                                        {/* Danh sách học sinh tìm kiếm */}
                                        {availableStudents.length > 0 && (
                                            <div className="mt-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                                                {availableStudents.map(student => (
                                                    <div
                                                        key={student.id}
                                                        onClick={() => addStudent(student)}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                                    >
                                                        <div className="font-medium text-gray-900">
                                                            {getStudentFullName(student)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.email} {student.user_code && `• ${student.user_code}`}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Học sinh đã chọn */}
                                        {selectedStudents.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                                    {t('classManagement.selected_students')} ({selectedStudents.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {selectedStudents.map(student => (
                                                        <div
                                                            key={student.id}
                                                            className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {getStudentFullName(student)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {student.email}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeStudent(student.id)}
                                                                className="text-red-600 hover:text-red-800 font-bold text-xl"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                setClassName('');
                                                setDescription('');
                                                setSelectedStudents([]);
                                                setError('');
                                            }}
                                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            {t('common.add')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal chỉnh sửa lớp học */}
                {showEditModal && editingClass && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                    {t('classManagement.edit_class')}
                                </h3>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleUpdateClass} className="space-y-4">
                                    {/* Tên lớp */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.class_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={className}
                                            onChange={(e) => setClassName(e.target.value)}
                                            placeholder={t('classManagement.class_name_placeholder')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Mô tả */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.description')}
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={t('classManagement.description_placeholder')}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setEditingClass(null);
                                                setClassName('');
                                                setDescription('');
                                                setError('');
                                            }}
                                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            {t('common.save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal xác nhận xóa */}
                {showDeleteModal && deletingClass && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {t('classManagement.delete_confirm_title')}
                                </h3>
                                
                                <p className="text-gray-700 mb-2">
                                    {t('classManagement.delete_confirm_message')} <span className="font-semibold">{deletingClass.name}</span>?
                                </p>
                                
                                <p className="text-sm text-gray-500 mb-6">
                                    {t('classManagement.delete_confirm_note')}
                                </p>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeletingClass(null);
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleDeleteClass}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}
