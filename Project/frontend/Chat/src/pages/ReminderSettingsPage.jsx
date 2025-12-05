// リマインド設定
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";

export default function ReminderSettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    // Lấy thông tin message từ state hoặc fetch từ DB
    const [message, setMessage] = useState(location.state?.message || null);
    const [loading, setLoading] = useState(!location.state?.message);

    // Reminder settings state
    const [reminderOnNoReply, setReminderOnNoReply] = useState(false);
    const [reminderOption, setReminderOption] = useState("1hour"); // 1hour, tomorrow_morning, 3days, custom
    const [customDate, setCustomDate] = useState("");
    const [customTime, setCustomTime] = useState("");
    const [memo, setMemo] = useState("");
    const [saving, setSaving] = useState(false);

    // Fetch message nếu không có trong state
    useEffect(() => {
        if (!message && id) {
            const fetchMessage = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("id", Number(id))
                    .single();

                if (error) {
                    console.error("Error fetching message:", error);
                } else {
                    setMessage(data);
                }
                setLoading(false);
            };
            fetchMessage();
        }
    }, [id, message]);

    // Tính toán ngày giờ dựa trên option
    const calculateReminderDateTime = () => {
        const now = new Date();
        
        switch (reminderOption) {
            case "1hour":
                return new Date(now.getTime() + 60 * 60 * 1000);
            case "tomorrow_morning":
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                return tomorrow;
            case "3days":
                return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            case "custom":
                if (customDate && customTime) {
                    return new Date(`${customDate}T${customTime}`);
                }
                return null;
            default:
                return null;
        }
    };

    // Xử lý lưu cài đặt
    const handleSave = async () => {
        setSaving(true);
        
        const reminderDateTime = calculateReminderDateTime();
        
        if (!reminderDateTime) {
            alert(t('reminder.error_invalid_datetime'));
            setSaving(false);
            return;
        }

        // TODO: Lưu vào database
        const reminderData = {
            message_id: id,
            reminder_datetime: reminderDateTime.toISOString(),
            remind_on_no_reply: reminderOnNoReply,
            memo: memo,
        };

        console.log("Saving reminder:", reminderData);

        // Giả lập lưu thành công
        setTimeout(() => {
            setSaving(false);
            navigate(-1); // Quay lại trang trước
        }, 500);
    };

    // Xử lý hủy
    const handleCancel = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <TeacherLayout title={t('reminder.title')}>
                <div className="text-center text-gray-500 py-10 text-lg">
                    {t('common.loading')}
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title={t('reminder.title')}>
            <div className="max-w-2xl mx-auto">
                {/* 1. Đối tượng message */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reminder.target_message')}
                    </label>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={reminderOnNoReply}
                            onChange={(e) => setReminderOnNoReply(e.target.checked)}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded mr-2"
                        />
                        <span className="text-gray-700">
                            {t('reminder.remind_on_no_reply')}
                        </span>
                    </div>
                    <p className="mt-2 text-gray-800 font-medium">
                        {message?.title || t('reminder.no_message_selected')}
                    </p>
                </div>

                {/* 2. Lựa chọn thời gian nhắc nhở */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        {t('reminder.datetime_label')}
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="reminderOption"
                                value="1hour"
                                checked={reminderOption === "1hour"}
                                onChange={(e) => setReminderOption(e.target.value)}
                                className="h-4 w-4 text-green-600 border-gray-300"
                            />
                            <span className="ml-2 text-gray-700">{t('reminder.option_1hour')}</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="reminderOption"
                                value="tomorrow_morning"
                                checked={reminderOption === "tomorrow_morning"}
                                onChange={(e) => setReminderOption(e.target.value)}
                                className="h-4 w-4 text-green-600 border-gray-300"
                            />
                            <span className="ml-2 text-gray-700">{t('reminder.option_tomorrow')}</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="reminderOption"
                                value="3days"
                                checked={reminderOption === "3days"}
                                onChange={(e) => setReminderOption(e.target.value)}
                                className="h-4 w-4 text-green-600 border-gray-300"
                            />
                            <span className="ml-2 text-gray-700">{t('reminder.option_3days')}</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="reminderOption"
                                value="custom"
                                checked={reminderOption === "custom"}
                                onChange={(e) => setReminderOption(e.target.value)}
                                className="h-4 w-4 text-green-600 border-gray-300"
                            />
                            <span className="ml-2 text-gray-700">{t('reminder.option_custom')}</span>
                        </label>
                    </div>
                </div>

                {/* 3. Custom datetime input */}
                <div className="mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                disabled={reminderOption !== "custom"}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    reminderOption !== "custom" 
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                        : "bg-white"
                                }`}
                                placeholder="dd/mm/yyyy"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    disabled={reminderOption !== "custom"}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        reminderOption !== "custom" 
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                            : "bg-white"
                                    }`}
                                    placeholder="--:--:--"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Memo */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('reminder.memo_label')}
                    </label>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        placeholder={t('reminder.memo_placeholder')}
                    />
                </div>

                {/* 5. Buttons */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? t('common.processing') : t('reminder.save_button')}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.cancel')}
                    </button>
                    
                    {/* 6. Link quay về message detail */}
                    <button
                        onClick={() => navigate(`/teacher/message/${id}`)}
                        className="ml-auto text-green-600 hover:underline text-sm"
                    >
                        {t('reminder.back_to_message')}
                    </button>
                </div>
            </div>
        </TeacherLayout>
    );
}