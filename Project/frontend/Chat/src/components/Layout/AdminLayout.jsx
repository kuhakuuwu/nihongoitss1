import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';

export default function AdminLayout({ children, title }) {
    const { t } = useTranslation();
    const location = useLocation();
    
    // Sidebar items configuration for Admin
    const sidebarItems = [
        { name: t('sidebar.dashboard'), path: '/admin' },
        { name: t('sidebar.user_management'), path: '/admin/users' },
        { name: t('sidebar.system_settings'), path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                    <div className="py-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-6">{t('sidebar.admin_panel')}</h2>
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center px-6 py-3 transition-colors border-l-4 ${
                                            isActive
                                                ? 'bg-green-50 border-green-600 text-green-900 font-semibold'
                                                : 'border-transparent text-gray-600 hover:bg-green-50 hover:text-green-700'
                                        }`}
                                    >
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
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
