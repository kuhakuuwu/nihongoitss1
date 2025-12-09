// 送信メッセージ詳細
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
    const [loading, setLoading] = useState(true);

    // ✅ Lấy role từ localStorage ngay trong useState (không dùng effect)
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

    // ✅ Lấy thông tin tin nhắn từ Supabase (effect này là “chuẩn” nên React không phàn nàn)
    useEffect(() => {
        async function fetchMessage() {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("id", id)
                .single();

            if (!error) {
                setMessage(data);
            }
            setLoading(false);
        }

        fetchMessage();
    }, [id]);

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
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">

                {/* 🔙 Quay lại đúng màn hình */}
                <div className="mb-4">
                    <button
                        onClick={() => {
                            if (role === "student") {
                                // StudentMainPage (router hiện tại dùng /student)
                                navigate("/student");
                            } else {
                                // Giáo viên: quay lại màn tạo tin nhắn
                                navigate("/teacher/create-message");
                            }
                        }}
                        className="text-blue-600 text-sm hover:underline"
                    >
                        ← {t('message.back_to_create')}
                    </button>
                </div>

                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {message.title}
                </h2>

                {/* Info */}
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                    <p>
                        <span className="font-semibold">{t('message.sender')}:</span>{" "}
                        {message.sender_id}
                    </p>
                    <p>
                        <span className="font-semibold">{t('message.recipient_label')}:</span>{" "}
                        {message.recipient_id}
                    </p>
                    <p>
                        <span className="font-semibold">{t('message.send_date')}:</span>{" "}
                        {message.created_at
                            ? new Date(message.created_at).toLocaleString("ja-JP")
                            : ""}
                    </p>

                    <p>
                        <span className="font-semibold">{t('message.status')}:</span>{" "}
                        <span
                            className={
                                message.status === "未読"
                                    ? "text-red-600 font-semibold"
                                    : "text-green-600 font-semibold"
                            }
                        >
                            {message.status === "未読"
                                ? t("teacher.unread")
                                : t("teacher.read")}
                        </span>
                    </p>
                </div>

                {/* Nội dung */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-line leading-relaxed text-gray-800">
                    {message.content}
                </div>
            </div>
        </Layout>
    );
}
