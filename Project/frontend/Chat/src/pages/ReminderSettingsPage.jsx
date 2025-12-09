// リマインド設定
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";

export default function ReminderSettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    // Danh sách tin nhắn đã gửi của giáo viên
    const [teacherMessages, setTeacherMessages] = useState([]);
    const [selectedMessageId, setSelectedMessageId] = useState(
        id ? Number(id) : null
    );
    const [loading, setLoading] = useState(true);

    // Trạng thái cài đặt nhắc nhở
    const [reminderOnNoReply, setReminderOnNoReply] = useState(true); // bật mặc định
    const [reminderOption, setReminderOption] = useState("1hour"); // 1hour, tomorrow_morning, 3days, custom
    const [customDate, setCustomDate] = useState("");
    const [customTime, setCustomTime] = useState("");
    const [memo, setMemo] = useState("");
    const [saving, setSaving] = useState(false);

    // Lấy danh sách tin nhắn đã gửi của giáo viên
    useEffect(() => {
        const fetchTeacherMessages = async () => {
            setLoading(true);

            try {
                const stored = localStorage.getItem("user");
                if (!stored) {
                    setTeacherMessages([]);
                    setLoading(false);
                    return;
                }

                const currentUser = JSON.parse(stored);
                const teacherUsername = currentUser?.username;

                if (!teacherUsername) {
                    setTeacherMessages([]);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("messages")
                    .select("id, title, recipient_id") // LẤY THÊM recipient_id
                    .eq("sender_id", teacherUsername)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching teacher messages:", error);
                    setTeacherMessages([]);
                } else {
                    setTeacherMessages(data || []);
                    setSelectedMessageId((prev) => {
                        if (prev) return prev;
                        if (id) return Number(id);
                        return data && data.length > 0 ? data[0].id : null;
                    });
                }
            } catch (err) {
                console.error("Error loading teacher messages:", err);
                setTeacherMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherMessages();
    }, [id]);

    const selectedMessage =
        teacherMessages.find((m) => m.id === selectedMessageId) || null;

    // Tính toán thời gian nhắc nhở dựa trên lựa chọn
    const calculateReminderDateTime = () => {
        const now = new Date();

        switch (reminderOption) {
            case "1hour": {
                const dt = new Date(now);
                dt.setHours(dt.getHours() + 1);
                return dt;
            }
            case "tomorrow_morning": {
                const dt = new Date(now);
                dt.setDate(dt.getDate() + 1);
                dt.setHours(9, 0, 0, 0); // 9:00 sáng
                return dt;
            }
            case "3days": {
                const dt = new Date(now);
                dt.setDate(dt.getDate() + 3);
                return dt;
            }
            case "custom": {
                if (!customDate || !customTime) return null;
                const dt = new Date(`${customDate}T${customTime}`);
                if (Number.isNaN(dt.getTime())) return null;
                return dt;
            }
            default:
                return null;
        }
    };

    // Xử lý lưu cài đặt
    const handleSave = async () => {
        setSaving(true);

        if (!selectedMessageId || !selectedMessage) {
            alert(t("reminder.no_message_selected"));
            setSaving(false);
            return;
        }

        // Lấy thông tin giáo viên hiện tại
        const stored = localStorage.getItem("user");
        const currentUser = stored ? JSON.parse(stored) : null;
        const teacherUsername = currentUser?.username;

        if (!teacherUsername) {
            alert("Không xác định được giáo viên đang đăng nhập.");
            setSaving(false);
            return;
        }

        // Học sinh nhận nhắc nhở chính là recipient của message gốc
        const studentId = selectedMessage.recipient_id;
        if (!studentId) {
            alert("Không tìm được học sinh nhận tin nhắn gốc.");
            setSaving(false);
            return;
        }

        let reminderDateTime = null;

        // Chỉ bắt buộc chọn thời gian nếu bật nhắc nhở
        if (reminderOnNoReply) {
            reminderDateTime = calculateReminderDateTime();
            if (!reminderDateTime) {
                alert(t("reminder.error_invalid_datetime"));
                setSaving(false);
                return;
            }
        } else {
            alert("Bạn cần bật nhắc nhở và chọn thời gian.");
            setSaving(false);
            return;
        }

        const reminderData = {
            message_id: selectedMessageId,
            student_id: studentId,
            teacher_id: teacherUsername,
            reminder_datetime: reminderDateTime.toISOString(),
            remind_on_no_reply: reminderOnNoReply,
            memo,
        };

        try {
            console.log("Saving reminder:", reminderData);

            const { error } = await supabase
                .from("reminders")
                .insert(reminderData);

            if (error) {
                console.error("Error saving reminder:", error);
                alert("Lưu nhắc nhở thất bại. Vui lòng thử lại.");
            } else {
                alert("Đã lưu lịch nhắc nhở.");
                // Sau khi lưu xong quay về màn chi tiết tin nhắn
                navigate(`/teacher/message/${selectedMessageId}`);
            }
        } catch (err) {
            console.error("Error saving reminder:", err);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <TeacherLayout title={t("reminder.title")}>
                <div className="text-center text-gray-500 py-10 text-lg">
                    {t("common.loading")}
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title={t("reminder.title")}>
            <div className="max-w-2xl mx-auto">
                {/* 1. 対象メッセージ: chọn tin đã gửi của giáo viên */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("reminder.target_message")}
                    </label>

                    <select
                        value={selectedMessageId || ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedMessageId(value ? Number(value) : null);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">
                            {t("reminder.no_message_selected")}
                        </option>
                        {teacherMessages.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.title}
                            </option>
                        ))}
                    </select>

                    {selectedMessage && (
                        <p className="mt-2 text-gray-800 font-medium bg-yellow-100 px-3 py-2 rounded">
                            {selectedMessage.title}
                        </p>
                    )}
                </div>

                {/* 2. Checkbox: nhắc nếu không có phản hồi */}
                <div className="mb-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={reminderOnNoReply}
                            onChange={(e) =>
                                setReminderOnNoReply(e.target.checked)
                            }
                            className="h-4 w-4 text-green-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">
                            {t("reminder.remind_on_no_reply")}
                        </span>
                    </label>
                </div>

                {/* 2 + 3. Chỉ hiển thị phần chọn thời gian & nhập datetime khi đã tick checkbox */}
                {reminderOnNoReply && (
                    <>
                        {/* 2. リマインド日時選択 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {t("reminder.datetime_label")}
                            </label>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="reminderOption"
                                        value="1hour"
                                        checked={reminderOption === "1hour"}
                                        onChange={(e) =>
                                            setReminderOption(e.target.value)
                                        }
                                        className="h-4 w-4 text-green-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-gray-700">
                                        {t("reminder.option_1hour")}
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="reminderOption"
                                        value="tomorrow_morning"
                                        checked={
                                            reminderOption ===
                                            "tomorrow_morning"
                                        }
                                        onChange={(e) =>
                                            setReminderOption(e.target.value)
                                        }
                                        className="h-4 w-4 text-green-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-gray-700">
                                        {t("reminder.option_tomorrow")}
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="reminderOption"
                                        value="3days"
                                        checked={reminderOption === "3days"}
                                        onChange={(e) =>
                                            setReminderOption(e.target.value)
                                        }
                                        className="h-4 w-4 text-green-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-gray-700">
                                        {t("reminder.option_3days")}
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="reminderOption"
                                        value="custom"
                                        checked={reminderOption === "custom"}
                                        onChange={(e) =>
                                            setReminderOption(e.target.value)
                                        }
                                        className="h-4 w-4 text-green-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-gray-700">
                                        {t("reminder.option_custom")}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* 3. 日時入力フィールド (chỉ dùng khi chọn カスタム) */}
                        <div className="mb-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) =>
                                            setCustomDate(e.target.value)
                                        }
                                        disabled={reminderOption !== "custom"}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            reminderOption !== "custom"
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-white"
                                        }`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="time"
                                        value={customTime}
                                        onChange={(e) =>
                                            setCustomTime(e.target.value)
                                        }
                                        disabled={reminderOption !== "custom"}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            reminderOption !== "custom"
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-white"
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 4. メモ入力フィールド */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("reminder.memo_label")}
                    </label>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t("reminder.memo_placeholder")}
                    />
                </div>

                {/* 5. 設定・キャンセルボタン + 6. 戻るリンク */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        {t("reminder.save_button")}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                selectedMessageId
                                    ? `/teacher/message/${selectedMessageId}`
                                    : "/teacher/history"
                            )
                        }
                        className="px-5 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                    >
                        {t("common.cancel")}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/teacher")}
                        className="ml-auto text-green-600 hover:underline text-sm"
                    >
                        ≪メッセージ詳細へ戻る
                    </button>
                </div>
            </div>
        </TeacherLayout>
    );
}
