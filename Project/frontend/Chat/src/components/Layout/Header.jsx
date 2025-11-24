import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';

export default function Header() {
    const [language, setLanguage] = useState('jp'); // 'jp' or 'vi'
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const navigate = useNavigate();

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'jp' ? 'vi' : 'jp');
    };

    const handleLogout = () => {
        // TODO: Clear authentication tokens/session
        // For now, just navigate to login page
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={logo} alt="EduConnect" className="h-5" />
            </div>

            <div className="flex items-center gap-4">
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    title={language === 'jp' ? '日本語' : 'Tiếng Việt'}
                >
                    {language === 'jp' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#fff"></rect><path d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z" opacity=".15"></path><circle cx="16" cy="16" r="6" fill="#ae232f"></circle><path d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z" fill="#fff" opacity=".2"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#c93728"></rect><path d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z" opacity=".15"></path><path d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z" fill="#fff" opacity=".2"></path><path fill="#ff5" d="M18.008 16.366L21.257 14.006 17.241 14.006 16 10.186 14.759 14.006 10.743 14.006 13.992 16.366 12.751 20.186 16 17.825 19.249 20.186 18.008 16.366z"></path></svg>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                        {language === 'jp' ? '日本語' : 'Tiếng Việt'}
                    </span>
                </button>

                {/* Notification Button */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {/* Red dot for notification */}
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                {/* Account Button with Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            U
                        </div>
                        <span className="text-sm font-medium text-gray-700">ユーザー</span>
                        <svg 
                            className={`w-4 h-4 text-gray-600 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showAccountMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                プロフィール確認（情報を見る）
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                パスワード変更
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors"
                            >
                                ログアウト
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
