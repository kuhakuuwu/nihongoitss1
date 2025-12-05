import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/Layout/StudentLayout";
import { supabase } from "../supabaseClient";

export default function StudentMainPage() {
    const [messages, setMessages] = useState([]);

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
        <StudentLayout title="受信メッセージ一覧">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">件名</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">送信者</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">送信日時</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">状態</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">操作</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {messages.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-6 text-gray-500">
                                    メッセージがありません
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
                                        {message.status}
                                    </span>
                                </td>

                                {/* 操作 */}
                                <td className="py-4 px-6">
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/student/message/${message.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                                        >
                                            詳細
                                        </Link>

                                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm">
                                            返信
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
