import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';


export default function StudentLayout({ children, title }) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Sidebar items configuration
    const sidebarItems = [
        { 
            name: t('student.unanswered_messages'), 
            path: '/student?tab=unanswered',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            name: t('student.answered_messages'), 
            path: '/student?tab=answered',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    const handleNavigate = (path) => {
        navigate(path);
    };

    const isActive = (item) => {
        const searchParams = new URLSearchParams(location.search);
        const currentTab = searchParams.get('tab') || 'unanswered';
        const itemTab = new URLSearchParams(item.path.split('?')[1]).get('tab');
        return location.pathname === '/student' && currentTab === itemTab;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                    <div className="py-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-6">{t('sidebar.dashboard')}</h2>
                        <nav className="space-y-1">
                            {sidebarItems.map((item, index) => {
                                const active = isActive(item);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleNavigate(item.path)}
                                        className={`w-full flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
                                            active
                                                ? 'bg-green-50 border-green-600 text-green-900 font-semibold'
                                                : 'border-transparent text-gray-600 hover:bg-green-50 hover:text-green-700'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="text-sm">{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[calc(100vh-8rem)]">
                        {/* Page Title */}
                        {title && (
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800 text-center">{title}</h2>
                            </div>
                        )}
                        
                        {/* Content Body */}
                        <div className="p-6">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
