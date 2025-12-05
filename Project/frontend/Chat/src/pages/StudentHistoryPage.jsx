// 学生履歴一覧 - 既読メッセージ
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StudentLayout from "../components/Layout/StudentLayout";
import { supabase } from "../supabaseClient";

const ITEMS_PER_PAGE = 10;

export default function StudentHistoryPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);

            // Lấy user hiện tại từ localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            // recipient_id có thể là id (uuid) hoặc email hoặc username
            const possibleRecipientIds = [
                currentUser?.id,
                currentUser?.email,
                currentUser?.username
            ].filter(Boolean);

            if (possibleRecipientIds.length === 0) {
                setMessages([]);
                setTotalCount(0);
                setLoading(false);
                return;
            }

            // Đếm tổng số tin nhắn đã đọc của student hiện tại
            const { count } = await supabase
                .from("messages")
                .select("*", { count: 'exact', head: true })
                .in('recipient_id', possibleRecipientIds)
                .not('read_at', 'is', null); // Chỉ lấy tin đã đọc

            setTotalCount(count || 0);

            // Lấy danh sách tin nhắn có phân trang
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .in('recipient_id', possibleRecipientIds)
                .not('read_at', 'is', null)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (!error) {
                setMessages(data || []);
            }
            setLoading(false);
        };
        loadMessages();
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

    // Xử lý xem chi tiết tin nhắn
    const handleViewDetail = (id) => {
        navigate(`/student/message/${id}`);
    };

    if (loading) {
        return (
            <StudentLayout title={t('studentHistory.title')}>
                <div className="text-center py-10 text-gray-500">
                    {t('common.loading')}
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title={t('studentHistory.title')}>
            <div className="space-y-4">
                {/* Bảng danh sách tin nhắn */}
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('studentHistory.subject')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('studentHistory.sender')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('studentHistory.received_date')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('studentHistory.read_date')}
                                </th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {t('studentHistory.action')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-gray-500">
                                        {t('studentHistory.no_read_messages')}
                                    </td>
                                </tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">{msg.title}</span>
                                                    {msg.is_complex && (
                                                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                                            {t('studentHistory.complex')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                {msg.sender_id}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {new Date(msg.created_at).toLocaleString("ja-JP")}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {msg.read_at ? new Date(msg.read_at).toLocaleString("ja-JP") : '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleViewDetail(msg.id)}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                            >
                                                {t('common.detail')}
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
        </StudentLayout>
    );
}
