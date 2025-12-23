// Trang chi tiết lớp học
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TeacherLayout from '../components/Layout/TeacherLayout';
import { supabase } from '../supabaseClient';

export default function ClassDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Edit modal states
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [availableStudents, setAvailableStudents] = useState([]);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentsToAdd, setStudentsToAdd] = useState([]);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchClassDetail();
    }, [id]);

    const fetchClassDetail = async () => {
        setLoading(true);
        try {
            // Lấy thông tin lớp học
            const { data: classInfo, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('id', id)
                .single();

            if (classError) throw classError;
            setClassData(classInfo);
            setEditName(classInfo.name);
            setEditDescription(classInfo.description || '');

            // Lấy danh sách học sinh trong lớp
            const { data: classStudents, error: studentsError } = await supabase
                .from('class_students')
                .select(`
                    student_id,
                    users:student_id (
                        id,
                        username,
                        email,
                        user_code,
                        first_name,
                        last_name
                    )
                `)
                .eq('class_id', id);

            if (studentsError) throw studentsError;

            const studentsList = classStudents.map(cs => cs.users);
            setStudents(studentsList);
        } catch (error) {
            console.error('Error fetching class detail:', error);
            setError(t('classManagement.create_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    // Lấy tên đầy đủ của học sinh
    const getStudentFullName = (student) => {
        if (student.first_name && student.last_name) {
            return i18n.language === 'vn'
                ? `${student.last_name} ${student.first_name}`
                : `${student.last_name} ${student.first_name}`;
        }
        return student.username || student.email;
    };

    // Lấy màu avatar cho học sinh
    const getAvatarColor = (index) => {
        const colors = [
            'bg-purple-500',
            'bg-blue-500', 
            'bg-pink-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-indigo-500',
            'bg-teal-500'
        ];
        return colors[index % colors.length];
    };

    // Lấy chữ cái đầu
    const getInitial = (student) => {
        const name = getStudentFullName(student);
        return name.charAt(0).toUpperCase();
    };

    // Tìm kiếm học sinh trong lớp
    const filteredStudents = students.filter(student => {
        const query = searchQuery.toLowerCase();
        const fullName = getStudentFullName(student).toLowerCase();
        const email = student.email?.toLowerCase() || '';
        const userCode = student.user_code?.toLowerCase() || '';
        
        return fullName.includes(query) || email.includes(query) || userCode.includes(query);
    });

    // Tìm kiếm học sinh để thêm vào lớp
    const searchStudentsToAdd = async (query) => {
        if (!query.trim()) {
            setAvailableStudents([]);
            return;
        }

        try {
            // Lấy tất cả học sinh đã có trong class_students
            const { data: studentsInClasses, error: classStudentsError } = await supabase
                .from('class_students')
                .select('student_id');

            const studentIdsInClasses = studentsInClasses ? studentsInClasses.map(cs => cs.student_id) : [];

            // Lấy học sinh chưa có trong lớp nào
            const currentStudentIds = students.map(s => s.id);
            const studentsToAddIds = studentsToAdd.map(s => s.id);
            const excludedIds = [...currentStudentIds, ...studentsToAddIds];

            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, user_code, first_name, last_name, class')
                .eq('role', 'student')
                .not('id', 'in', `(${excludedIds.join(',')})`)
                .or(`email.ilike.%${query}%,username.ilike.%${query}%,user_code.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .limit(10);

            if (error) throw error;

            // Lọc bỏ học sinh đã có trong lớp khác
            const filtered = (data || []).filter(student => !studentIdsInClasses.includes(student.id));
            setAvailableStudents(filtered);
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    // Thêm học sinh vào danh sách sẽ thêm
    const addStudentToList = (student) => {
        setStudentsToAdd([...studentsToAdd, student]);
        setAvailableStudents(availableStudents.filter(s => s.id !== student.id));
        setStudentSearchQuery('');
    };

    // Xóa học sinh khỏi danh sách sẽ thêm
    const removeStudentFromList = (studentId) => {
        setStudentsToAdd(studentsToAdd.filter(s => s.id !== studentId));
    };

    // Xóa học sinh khỏi lớp
    const removeStudentFromClass = async (studentId) => {
        try {
            const { error } = await supabase
                .from('class_students')
                .delete()
                .eq('class_id', id)
                .eq('student_id', studentId);

            if (error) throw error;

            // Xóa trường class trong bảng users
            const { error: updateError } = await supabase
                .from('users')
                .update({ class: null })
                .eq('id', studentId);

            if (updateError) throw updateError;

            setStudents(students.filter(s => s.id !== studentId));
            setSuccess(t('classManagement.update_success'));
        } catch (error) {
            console.error('Error removing student:', error);
            setError(t('classManagement.update_failed'));
        }
    };

    // Cập nhật lớp học
    const handleUpdateClass = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!editName.trim()) {
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

            // Kiểm tra tên lớp đã tồn tại (trừ lớp hiện tại)
            const { data: existingClass } = await supabase
                .from('classes')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('name', editName.trim())
                .neq('id', id)
                .single();

            if (existingClass) {
                setError(t('classManagement.class_name_exists'));
                return;
            }

            // Cập nhật thông tin lớp
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    name: editName.trim(),
                    description: editDescription.trim() || null
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Thêm học sinh mới vào lớp
            if (studentsToAdd.length > 0) {
                const newClassStudents = studentsToAdd.map(student => ({
                    class_id: id,
                    student_id: student.id
                }));

                const { error: addError } = await supabase
                    .from('class_students')
                    .insert(newClassStudents);

                if (addError) throw addError;

                // Cập nhật trường class trong bảng users
                const studentIds = studentsToAdd.map(s => s.id);
                const { error: updateClassError } = await supabase
                    .from('users')
                    .update({ class: editName.trim() })
                    .in('id', studentIds);

                if (updateClassError) throw updateClassError;
            }

            setSuccess(t('classManagement.update_success'));
            setShowEditModal(false);
            setStudentsToAdd([]);
            fetchClassDetail();
        } catch (error) {
            console.error('Error updating class:', error);
            setError(t('classManagement.update_failed'));
        }
    };

    // Xóa lớp học
    const handleDeleteClass = async () => {
        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            navigate('/teacher/classes');
        } catch (error) {
            console.error('Error deleting class:', error);
            setError(t('classManagement.delete_failed'));
        }
    };

    if (loading) {
        return (
            <TeacherLayout title={t('classManagement.class_detail')}>
                <div className="text-center py-10 text-gray-500">
                    {t('common.loading')}
                </div>
            </TeacherLayout>
        );
    }

    if (!classData) {
        return (
            <TeacherLayout title={t('classManagement.class_detail')}>
                <div className="text-center py-10 text-red-500">
                    {t('classManagement.no_classes')}
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title={t('classManagement.class_detail')}>
            <div className="space-y-6">
                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}
                {error && !showEditModal && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Header với nút quay lại */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate('/teacher/classes')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                        <span className="text-xl">←</span>
                        {t('common.back')}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="bg-yellow-500 text-white px-5 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                        >
                            {t('common.edit')}
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                </div>

                {/* Thông tin lớp học */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        {classData.name}
                    </h2>
                    {classData.description && (
                        <p className="text-gray-600 mb-3">{classData.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                        {t('classManagement.created_date')}: {new Date(classData.created_at).toLocaleDateString(i18n.language === 'vn' ? 'vi-VN' : 'ja-JP')}
                    </div>
                </div>

                {/* Tìm kiếm học sinh */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('classManagement.search_students')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Danh sách học sinh */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">
                            {t('classManagement.student_list')} ({students.length})
                        </h3>
                    </div>
                    
                    {filteredStudents.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            {students.length === 0 
                                ? t('classManagement.no_students_in_class')
                                : t('classManagement.no_available_students')
                            }
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">
                                            {t('classManagement.student_name')}
                                        </th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">
                                            {t('classManagement.student_code')}
                                        </th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">
                                            {t('classManagement.student_email')}
                                        </th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">
                                            {t('teacher.action')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-bold shadow-sm`}>
                                                        {getInitial(student)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">
                                                        {getStudentFullName(student)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 text-sm">
                                                {student.user_code || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 text-sm">
                                                {student.email}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => navigate('/teacher/create-message', { state: { recipientId: student.id } })}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
                                                >
                                                    {t('classManagement.send_message')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal chỉnh sửa lớp */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                    {t('classManagement.edit_class')}
                                </h3>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleUpdateClass} className="space-y-6">
                                    {/* Tên lớp */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.class_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Mô tả */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.description')}
                                        </label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Thêm học sinh */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('classManagement.add_students')}
                                        </label>
                                        <input
                                            type="text"
                                            value={studentSearchQuery}
                                            onChange={(e) => {
                                                setStudentSearchQuery(e.target.value);
                                                searchStudentsToAdd(e.target.value);
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
                                                        onClick={() => addStudentToList(student)}
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

                                        {/* Học sinh sẽ được thêm */}
                                        {studentsToAdd.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                                    {t('classManagement.selected_students')} ({studentsToAdd.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {studentsToAdd.map(student => (
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
                                                                onClick={() => removeStudentFromList(student.id)}
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
                                                setShowEditModal(false);
                                                setEditName(classData.name);
                                                setEditDescription(classData.description || '');
                                                setStudentsToAdd([]);
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
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {t('classManagement.delete_confirm_title')}
                            </h3>
                            <p className="text-gray-600 mb-2">
                                {t('classManagement.delete_confirm_message')} <span className="font-semibold">{classData.name}</span>?
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('classManagement.delete_confirm_note')}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteClass}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}
