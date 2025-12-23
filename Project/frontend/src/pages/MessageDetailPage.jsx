// 送信メッセージ詳細 - Sử dụng giao diện CreateMessagePage (View Mode)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeacherLayout from "../components/Layout/TeacherLayout";
import StudentLayout from "../components/Layout/StudentLayout";

import { supabase } from "../supabaseClient";

export default function MessageDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [recipientsStatus, setRecipientsStatus] = useState([]); // Tracking status từng người
    const [attachments, setAttachments] = useState([]);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // ✅ Lấy role từ localStorage
    const [role] = useState(() => {
        if (typeof window === "undefined") {
            return "teacher";
        }

        const stored = window.localStorage.getItem("user");
        if (!stored) return "teacher";

        try {
            const user = JSON.parse(stored);
            return user.role || "teacher";
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            return "teacher";
        }
    });

    // ✅ Lấy thông tin tin nhắn, recipients và attachments
    useEffect(() => {
        async function fetchMessage() {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) {
                setMessage(data);
                
                // Lấy danh sách recipients từ message_recipients với trạng thái
                const { data: recipientData } = await supabase
                    .from("message_recipients")
                    .select("recipient_id, status, read_at, replied_at, is_late_reply")
                    .eq("message_id", id);
                
                if (recipientData && recipientData.length > 0) {
                    const recipientIds = recipientData.map(r => r.recipient_id);
                    const { data: userData } = await supabase
                        .from("users")
                        .select("id, username, first_name, last_name")
                        .in("id", recipientIds);
                    
                    // Kết hợp thông tin user với status
                    if (userData) {
                        const recipientsWithStatus = userData.map(user => {
                            const statusInfo = recipientData.find(r => r.recipient_id === user.id);
                            return {
                                ...user,
                                status: statusInfo?.status || '未読',
                                read_at: statusInfo?.read_at,
                                replied_at: statusInfo?.replied_at,
                                is_late_reply: statusInfo?.is_late_reply || false
                            };
                        });
                        setRecipients(recipientsWithStatus);
                        setRecipientsStatus(recipientData);
                    }
                } else if (data.recipient_id) {
                    // Fallback: parse từ recipient_id text field
                    const recipientUsernames = data.recipient_id.split(',');
                    const { data: userData } = await supabase
                        .from("users")
                        .select("id, username, first_name, last_name")
                        .in("username", recipientUsernames);
                    
                    setRecipients(userData || []);
                }

                // Lấy attachments
                const { data: attachmentData } = await supabase
                    .from("attachments")
                    .select("*")
                    .eq("message_id", id);
                
                setAttachments(attachmentData || []);

                // Lấy replies (tin nhắn trả lời)
                const { data: repliesData } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("parent_id", id)
                    .neq("title", "[REACTION]") // Loại bỏ reactions
                    .order("created_at", { ascending: true });
                
                setReplies(repliesData || []);
            }
            setLoading(false);
        }

        fetchMessage();
    }, [id]);

    const handleBack = () => {
        navigate(-1);
    };
    
    const handleDelete = async () => {
        if (!window.confirm(t('message.confirm_delete'))) return;
        
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            alert(t('message.delete_success'));
            navigate('/teacher/history');
        } catch (error) {
            console.error('Delete error:', error);
            alert(t('message.delete_failed'));
        }
    };
    
    const handleSendReminder = async (type) => {
        try {
            let targetRecipients = [];
            
            if (type === 'unread') {
                targetRecipients = recipients.filter(r => !r.read_at);
            } else if (type === 'unreplied') {
                targetRecipients = recipients.filter(r => !r.replied_at);
            }
            
            if (targetRecipients.length === 0) {
                alert(t('message.no_recipients_to_remind'));
                return;
            }
            
            // Gửi reminder (có thể tích hợp với email service)
            console.log('Send reminder to:', targetRecipients);
            alert(t('message.reminder_sent'));
        } catch (error) {
            console.error('Reminder error:', error);
        }
    };

    const getRecipientDisplayName = (recipient) => {
        if (recipient.first_name && recipient.last_name) {
            return `${recipient.last_name} ${recipient.first_name}`;
        }
        return recipient.username;
    };
    
    const getStatusBadge = (recipient) => {
        if (recipient.replied_at) {
            if (recipient.is_late_reply) {
                return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">{t('message.late_reply_status')}</span>;
            }
            return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{t('message.replied_status')}</span>;
        }
        if (recipient.read_at) {
            return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{t('message.read_status')}</span>;
        }
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{t('message.unread_status')}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500 text-lg">
                {t('common.loading')}
            </div>
        );
    }

    // Chọn Layout theo role
    const Layout = role === "student" ? StudentLayout : TeacherLayout;

    if (!message) {
        return (
            <Layout title={t('message.detail_title')}>
                <div className="text-center text-red-500 py-10 text-lg">
                    {t('message.not_found')}
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={t('message.detail_title')}>
            <div className="flex gap-6">
                {/* LEFT SIDE - Form (View Only) */}
                <div className="flex-1">
                    <div className="space-y-5">

                        {/* RECIPIENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.recipient')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {recipients.map(recipient => (
                                    <div 
                                        key={recipient.id}
                                        className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm"
                                    >
                                        {getRecipientDisplayName(recipient)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* RECIPIENT STATUS TABLE - Only for teacher */}
                        {role === "teacher" && recipients.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    {t('message.recipient_status')}
                                </h3>
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-2 px-4 text-left font-medium text-gray-600">{t('message.recipient')}</th>
                                                <th className="py-2 px-4 text-left font-medium text-gray-600">{t('message.status')}</th>
                                                <th className="py-2 px-4 text-left font-medium text-gray-600">{t('message.read_date')}</th>
                                                <th className="py-2 px-4 text-left font-medium text-gray-600">{t('message.reply_time')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recipients.map(recipient => (
                                                <tr key={recipient.id} className="hover:bg-gray-50">
                                                    <td className="py-2 px-4 text-gray-900 font-medium">
                                                        {getRecipientDisplayName(recipient)}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        {getStatusBadge(recipient)}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-600">
                                                        {recipient.read_at ? new Date(recipient.read_at).toLocaleString("ja-JP") : '-'}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-600">
                                                        {recipient.replied_at ? new Date(recipient.replied_at).toLocaleString("ja-JP") : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Reminder buttons */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSendReminder('unread')}
                                        className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors text-sm font-medium"
                                    >
                                        {t('message.send_reminder_to_unread')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSendReminder('unreplied')}
                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        {t('message.send_reminder_to_unreplied')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TITLE */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.subject')}
                            </label>
                            <div className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700">
                                {message.title}
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.content')}
                            </label>
                            <div className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 whitespace-pre-line min-h-[200px]">
                                {message.content}
                            </div>
                        </div>

                        {/* ATTACHMENT */}
                        {(attachments.length > 0 || message.attachment_url) && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('message.attachment')}
                                </label>
                                <div className="space-y-2">
                                    {/* Attachments từ bảng attachments */}
                                    {attachments.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <span className="flex-1">{file.file_name}</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    ))}
                                    
                                    {/* Fallback: attachment_url từ bảng messages (cho tin nhắn cũ) */}
                                    {message.attachment_url && attachments.length === 0 && (
                                        <a
                                            href={message.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <span className="flex-1">{message.attachment_url.split('/').pop().split('?')[0] || 'Tệp đính kèm'}</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* OPTIONS */}
                        <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{t('message.options')}</p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={message.is_complex}
                                    disabled
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{t('message.complex_message')}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={message.require_confirmation}
                                    disabled
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{t('message.require_reply')}</span>
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={handleBack}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            
                            {/* Edit and Delete buttons - Only for teacher */}
                            {role === "teacher" && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/teacher/create-message`, { state: { editMessage: message } })}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        {t('message.edit_message')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                                    >
                                        {t('message.delete_message')}
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>

                {/* RIGHT SIDE — Message Info */}
                <div className="w-80">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('message.message_info')}
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-500">{t('message.sender')}:</span>
                                <p className="font-medium text-gray-900">{message.sender_id}</p>
                            </div>
                            
                            <div>
                                <span className="text-gray-500">{t('message.send_date')}:</span>
                                <p className="font-medium text-gray-900">
                                    {message.created_at ? new Date(message.created_at).toLocaleString("ja-JP") : ""}
                                </p>
                            </div>

                            <div>
                                <span className="text-gray-500">{t('message.status')}:</span>
                                <p className={`font-semibold ${message.status === "未読" ? "text-red-600" : "text-green-600"}`}>
                                    {message.status === "未読" ? t("teacher.unread") : t("teacher.read")}
                                </p>
                            </div>

                            {message.read_at && (
                                <div>
                                    <span className="text-gray-500">{t('message.read_date')}:</span>
                                    <p className="font-medium text-gray-900">
                                        {new Date(message.read_at).toLocaleString("ja-JP")}
                                    </p>
                                </div>
                            )}
                            
                            {message.deadline && (
                                <div>
                                    <span className="text-gray-500">{t('message.deadline')}:</span>
                                    <p className="font-semibold text-orange-600">
                                        {new Date(message.deadline).toLocaleString("ja-JP")}
                                    </p>
                                    {message.reply_deadline_locked && (
                                        <p className="text-xs text-red-600 mt-1">
                                            🔒 {t('message.lock_reply_after_deadline')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* REPLIES SECTION */}
                {replies.length > 0 && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            {t('message.replies')} ({replies.length})
                        </h3>

                        <div className="space-y-4">
                            {replies.map((reply) => (
                                <div key={reply.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                            {reply.sender_id.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{reply.sender_id}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(reply.created_at).toLocaleString("ja-JP")}
                                                </span>
                                            </div>
                                            {reply.title !== `Re: ${message.title}` && (
                                                <p className="text-sm font-medium text-gray-700 mb-2">{reply.title}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pl-13 text-gray-800 whitespace-pre-line leading-relaxed">
                                        {reply.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>               
            </div>
        </Layout>
    );
}
