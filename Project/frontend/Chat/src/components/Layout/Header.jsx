import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.svg';
import { changeLanguage } from '../../i18n';

export default function Header({ hideUserInfo = false }) {
    const { t, i18n } = useTranslation();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Lấy thông tin user từ localStorage
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = i18n.language === "jp" ? "vn" : "jp";
        changeLanguage(newLang);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate('/login');
    };

    // Lấy chữ cái đầu của username để hiển thị avatar
    const getInitial = () => {
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return "U";
    };

    // Lấy tên hiển thị
    const getDisplayName = () => {
        if (user?.username) {
            return user.username;
        }
        return t('header.user');
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
                    {i18n.language === 'jp' ? (
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
                                    {getInitial()}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {getDisplayName()}
                                </span>
                                {user?.role && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        user.role === 'teacher' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {user.role === 'teacher' ? t('common.teacher') : t('common.student')}
                                    </span>
                                )}
                            </button>

                            {showAccountMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {/* Hiển thị email */}
                                    {user?.email && (
                                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                            {user.email}
                                        </div>
                                    )}
                                    
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                        {t('header.view_profile')}
                                    </button>

                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                        {t('header.change_password')}
                                    </button>

                                    <div className="border-t border-gray-200 my-1"></div>

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        {t('header.logout')}
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
