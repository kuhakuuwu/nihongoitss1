// メッセージ作成
import TeacherLayout from "../components/Layout/TeacherLayout";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";        
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

export default function CreateMessagePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy recipientId từ state nếu được truyền từ TeacherMainPage
    const preSelectedRecipient = location.state?.recipientId || "";
    
    const [recipient, setRecipient] = useState(preSelectedRecipient);
    const [students, setStudents] = useState([]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [attachment, setAttachment] = useState(null);

    const [isComplexMessage, setIsComplexMessage] = useState(false);
    const [requireConfirmation, setRequireConfirmation] = useState(false);

    // Recent messages
    const [recentMessages, setRecentMessages] = useState([]);
    const [sending, setSending] = useState(false);

    // ============================================================
    // 1. Load danh sách học sinh
    // ============================================================
    useEffect(() => {
        const fetchStudents = async () => {
            // Lấy user hiện tại
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            let query = supabase
                .from("users")
                .select("id, username, first_name, last_name, class")
                .eq("role", "student")
                .order("username", { ascending: true });
            
            // Nếu có class của giáo viên, chỉ lấy học sinh cùng lớp
            if (currentUser?.id) {
                const { data: teacherData } = await supabase
                    .from('users')
                    .select('class')
                    .eq('id', currentUser.id)
                    .single();
                
                if (teacherData?.class) {
                    query = query.eq('class', teacherData.class);
                }
            }

            const { data, error } = await query;
            if (!error && data) setStudents(data);
        };

        fetchStudents();
    }, []);

    // ============================================================
    // 2. Gửi tin nhắn
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        const teacher = JSON.parse(localStorage.getItem("user"));
        if (!teacher) {
            alert(t('common.login_required'));
            setSending(false);
            return;
        }

        const payload = {
            sender_id: teacher.username,
            recipient_id: recipient,
            title,
            content,
            status: "未読",
            is_complex: isComplexMessage,
            require_confirmation: requireConfirmation,
        };

        const { data, error } = await supabase
            .from("messages")
            .insert(payload)
            .select("*");

        if (error) {
            console.error(error);
            alert(t('common.send_failed'));
            setSending(false);
            return;
        }

        // Thêm tin mới vào recentMessages
        if (data && data.length > 0) {
            setRecentMessages((prev) => [data[0], ...prev]);
        }

        // Reset form
        setRecipient("");
        setTitle("");
        setContent("");
        setAttachment(null);
        setIsComplexMessage(false);
        setRequireConfirmation(false);
        setSending(false);

        // Navigate to send complete page
        navigate('/teacher/send-complete');
    };

    // Xử lý hủy
    const handleCancel = () => {
        navigate(-1);
    };

    // Lấy tên hiển thị của học sinh
    const getStudentDisplayName = (student) => {
        if (student.first_name && student.last_name) {
            return `${student.last_name} ${student.first_name}`;
        }
        return student.username;
    };

    // ============================================================
    // 3. UI
    // ============================================================
    return (
        <TeacherLayout title={t('message.create_title')}>
            <div className="flex gap-6">

                {/* LEFT SIDE - Form */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* RECIPIENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.recipient')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                required
                            >
                                <option value="">{t('message.recipient_placeholder')}</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.username}>
                                        {getStudentDisplayName(s)} {s.class ? `(${s.class})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* TITLE */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.subject')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('message.subject_placeholder')}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.content')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                placeholder={t('message.content_placeholder')}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                required
                            />
                        </div>

                        {/* ATTACHMENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.attachment')}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => setAttachment(e.target.files[0])}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    {t('message.select_file')}
                                </label>

                                {attachment && (
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 bg-gray-50">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-700">{attachment.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachment(null)}
                                            className="text-red-500 hover:text-red-700 ml-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OPTIONS */}
                        <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{t('message.options')}</p>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isComplexMessage}
                                    onChange={(e) => setIsComplexMessage(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{t('message.complex_message')}</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={requireConfirmation}
                                    onChange={(e) => setRequireConfirmation(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{t('message.require_reply')}</span>
                            </label>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="submit" 
                                disabled={sending}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? t('common.processing') : t('common.send')}
                            </button>

                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>

                    </form>
                </div>

                {/* RIGHT SIDE — Recent Messages */}
                <div className="w-80">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col">

                        <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('message.recent_messages')}
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {/* Khi chưa có tin nhắn */}
                            {recentMessages.length === 0 && (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-400 text-sm">
                                        {t('message.no_recent_messages')}
                                    </p>
                                </div>
                            )}

                            {/* Khi có tin nhắn */}
                            {recentMessages.map((m) => (
                                <div
                                    key={m.id}
                                    className="bg-white border border-gray-200 shadow-sm rounded-lg p-3 hover:shadow-md hover:border-green-200 transition cursor-pointer"
                                    onClick={() => navigate(`/teacher/history/${m.id}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex justify-center items-center text-green-700 font-semibold shrink-0">
                                            {m.title.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{m.title}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {t('message.to')}: {m.recipient_id}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {m.created_at
                                                    ? new Date(m.created_at).toLocaleString("ja-JP")
                                                    : ""}
                                            </p>
                                        </div>

                                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}

                        </div>

                    </div>
                </div>

            </div>
        </TeacherLayout>
    );
}
