// 教師メイン - 学生一覧
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/Layout/TeacherLayout';
import { supabase } from '../supabaseClient';

const ITEMS_PER_PAGE = 10;

export default function TeacherMainPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [teacherClass, setTeacherClass] = useState(null);

    // Lấy thông tin giáo viên hiện tại và danh sách học sinh
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Lấy user hiện tại từ localStorage hoặc session
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Nếu có user, lấy thông tin class của giáo viên
            let classFilter = null;
            if (currentUser?.id) {
                const { data: teacherData } = await supabase
                    .from('users')
                    .select('class')
                    .eq('id', currentUser.id)
                    .single();
                
                if (teacherData?.class) {
                    classFilter = teacherData.class;
                    setTeacherClass(teacherData.class);
                }
            }

            // Đếm tổng số học sinh
            let countQuery = supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');
            
            if (classFilter) {
                countQuery = countQuery.eq('class', classFilter);
            }
            
            const { count } = await countQuery;
            setTotalCount(count || 0);

            // Lấy danh sách học sinh có phân trang
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('users')
                .select('*')
                .eq('role', 'student')
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (classFilter) {
                query = query.eq('class', classFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching students:', error);
            } else {
                setStudents(data || []);
            }
            
            setLoading(false);
        };

        fetchData();
    }, [currentPage]);

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Xử lý chuyển trang
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Tạo danh sách số trang để hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    // Màu sắc avatar ngẫu nhiên
    const getAvatarColor = (index) => {
        const colors = ['bg-yellow-200', 'bg-orange-200', 'bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-pink-200'];
        return colors[index % colors.length];
    };

    // Xử lý gửi tin nhắn
    const handleSendMessage = (studentId) => {
        navigate('/teacher/create-message', { state: { recipientId: studentId } });
    };

    if (loading) {
        return (
            <TeacherLayout title={t('teacher.student_list')}>
                <div className="text-center py-10 text-gray-500">
                    {t('common.loading')}
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title={t('teacher.student_list')}>
            <div className="space-y-4">
                {/* Thông tin lớp phụ trách */}
                {teacherClass && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
                        {t('teacher.managing_class')}: <span className="font-semibold">{teacherClass}</span>
                    </div>
                )}

                {/* Bảng danh sách học sinh */}
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('teacher.student_name')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('teacher.class')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('teacher.email')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('teacher.status')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('teacher.action')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-gray-500">
                                        {t('teacher.no_students')}
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center font-bold text-gray-700 shadow-sm text-sm`}>
                                                    {(student.username || student.first_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">
                                                        {student.first_name && student.last_name 
                                                            ? `${student.last_name} ${student.first_name}`
                                                            : student.username}
                                                    </span>
                                                    {student.user_code && (
                                                        <p className="text-xs text-gray-500">{student.user_code}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                {student.class || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {student.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                student.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {student.is_active ? t('teacher.active') : t('teacher.inactive')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button 
                                                onClick={() => handleSendMessage(student.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                                            >
                                                {t('common.send')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
                        <div className="text-sm text-gray-700">
                            {t('pagination.showing')} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} {t('pagination.of')} {totalCount} {t('pagination.items')}
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Nút Previous */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded text-sm ${
                                    currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                ←
                            </button>

                            {/* Số trang */}
                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1 rounded text-sm ${
                                        currentPage === page
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Nút Next */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded text-sm ${
                                    currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}