import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthLayout from "../components/Layout/AuthLayout";
import { changeLanguage, getCurrentLanguage } from "../i18n";

import Logo from "../assets/logo.svg";

export default function HomePage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
    };

    const handleLogin = () => navigate("/login");

    return (
        <AuthLayout title={t('home.title')} hideUserInfo={true}>
            <div className="space-y-6">

                {/* LANGUAGE SELECTOR */}
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={() => handleLanguageChange('jp')}
                        className={`px-4 py-2 rounded-md border-2 transition-all ${
                            i18n.language === 'jp' 
                                ? 'border-green-600 bg-green-50 text-green-700' 
                                : 'border-gray-300 hover:border-green-400'
                        }`}
                    >
                        🇯🇵 日本語
                    </button>
                    <button
                        onClick={() => handleLanguageChange('vn')}
                        className={`px-4 py-2 rounded-md border-2 transition-all ${
                            i18n.language === 'vn' 
                                ? 'border-green-600 bg-green-50 text-green-700' 
                                : 'border-gray-300 hover:border-green-400'
                        }`}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                </div>

                {/* INTRO TEXT */}
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line text-center">
                    {t('home.desc')}
                </p>

                {/* ONLY LOGIN BUTTON */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleLogin}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md text-lg"
                    >
                        {t('home.login')}
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
