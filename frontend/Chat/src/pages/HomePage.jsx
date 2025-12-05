import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/Layout/AuthLayout";
import { getLanguage } from "../utils/language";

import Logo from "../assets/logo.svg";

export default function HomePage() {
    const navigate = useNavigate();
    const [lang] = useState(() => getLanguage());

    const JP_TEXT = {
        title: "EduConnect",
        desc: "返信期限・既読確認・自動リマインドと学生の返信支援で、授業連絡を確実に。",
        login: "ログイン"
    };

    const VN_TEXT = {
        title: "EduConnect",
        desc: "Hỗ trợ phản hồi, xác nhận đã đọc và nhắc nhở tự động để đảm bảo liên lạc học tập hiệu quả.",
        login: "Đăng nhập"
    };

    const TEXT = lang === "jp" ? JP_TEXT : VN_TEXT;

    const handleLogin = () => navigate("/login");

    return (
        <AuthLayout title={TEXT.title} hideUserInfo={true}>
            <div className="space-y-6">

                {/* INTRO TEXT */}
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                    {TEXT.desc}
                </p>

                {/* ONLY LOGIN BUTTON */}
                <div className="flex mt-6">
                    <button
                        onClick={handleLogin}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-md"
                    >
                        {TEXT.login}
                    </button>
                </div>

                {/* LOGO OR IMAGE AREA */}
                <div className="border-2 border-gray-300 rounded-xl flex items-center justify-center h-64 mt-10">
                    <img src={Logo} alt="EduConnect" className="h-28 opacity-60" />
                </div>
            </div>
        </AuthLayout>
    );
}
