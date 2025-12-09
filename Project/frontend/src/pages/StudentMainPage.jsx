import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StudentLayout from "../components/Layout/StudentLayout";
import { supabase } from "../supabaseClient";


export default function StudentMainPage() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const handleViewDetail = async (msgId) => {
    // Update trạng thái thành 既読
    await supabase
        .from("messages")
        .update({ status: "既読" })
        .eq("id", msgId);

    // Điều hướng sang trang chi tiết
    navigate(`/student/message/${msgId}`);
};

    useEffect(() => {
        const fetchMessages = async () => {
            const studentData = JSON.parse(localStorage.getItem("user"));
            if (!studentData) return;

            const studentId = studentData.username; // VD: student001

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("recipient_id", studentId)
                .order("created_at", { ascending: false });

            if (!error && data) {
                // Format lại dữ liệu để đưa vào UI
                const formatted = data.map((m) => ({
                    id: m.id,
                    title: m.title,
                    sender: m.sender_id,
                    date: new Date(m.created_at).toLocaleDateString("ja-JP"),
                    status: m.status,
                    color: "bg-blue-200"
                }));

                setMessages(formatted);
            }
        };

        fetchMessages();
    }, []);

    return (
        <StudentLayout title={t('student.message_list')}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('student.subject')}</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('student.sender')}</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('student.send_date')}</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('student.status')}</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('student.action')}</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {messages.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-6 text-gray-500">
                                    {t('common.no_messages')}
                                </td>
                            </tr>
                        )}

                        {messages.map((message) => (
                            <tr key={message.id} className="hover:bg-gray-50 transition-colors">

                                {/* 件名 */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full ${message.color} flex items-center justify-center font-bold text-gray-700 shadow-sm`}>
                                            {message.title.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {message.title}
                                        </span>
                                    </div>
                                </td>

                                {/* 送信者 */}
                                <td className="py-4 px-6 text-gray-600 text-sm">
                                    {message.sender}
                                </td>

                                {/* 送信日時 */}
                                <td className="py-4 px-6 text-gray-500 text-sm">
                                    {message.date}
                                </td>

                                {/* 状態 */}
                                <td className="py-4 px-6">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            message.status === "未読"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {message.status === "未読" ? t('teacher.unread') : t('teacher.read')}
                                    </span>
                                </td>

                                {/* 操作 */}
                                <td className="py-4 px-6">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewDetail(message.id)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm shadow-sm"
>
                                            {t('common.detail')}
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/student/reply/${message.id}`)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                                        >
                                            {t('common.reply')}
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </StudentLayout>
    );
}
