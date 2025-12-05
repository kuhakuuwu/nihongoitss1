import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { getLanguage, setLanguage } from '../../utils/language';

export default function Header({ hideUserInfo = false }) {
    const [language, setLanguageState] = useState(getLanguage());
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const navigate = useNavigate();

    const toggleLanguage = () => {
        const newLang = language === "jp" ? "vn" : "jp";
        setLanguage(newLang);
        setLanguageState(newLang);
        window.location.reload(); // ⭐ Refresh để đồng bộ UI
    };

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">

            <div className="flex items-center gap-3">
                <img src={logo} alt="EduConnect" className="h-5" />
            </div>

            <div className="flex items-center gap-4">
                {/* Switching Language */}
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                    {language === 'jp' ? (
                        <span>🇯🇵 日本語</span>
                    ) : (
                        <span>🇻🇳 Tiếng Việt</span>
                    )}
                </button>

                {!hideUserInfo && (
                    <>
                        {/* Notification */}
                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            🔔
                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>

                        {/* User menu */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowAccountMenu(!showAccountMenu)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                    U
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {language === "jp" ? "ユーザー" : "Người dùng"}
                                </span>
                            </button>

                            {showAccountMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                        {language === "jp" ? "プロフィール確認" : "Xem hồ sơ"}
                                    </button>

                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                        {language === "jp" ? "パスワード変更" : "Đổi mật khẩu"}
                                    </button>

                                    <div className="border-t border-gray-200 my-1"></div>

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        {language === "jp" ? "ログアウト" : "Đăng xuất"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
