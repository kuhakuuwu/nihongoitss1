import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

export default function TeacherLayout({ children, title }) {
    const location = useLocation();
    
    // Sidebar items configuration
    const sidebarItems = [
        { name: '学生一覧', path: '/teacher' },
        { name: '学生をクラスに追加', path: '/teacher/add-user' },
        { name: '履歴一覧', path: '/teacher/history' },
        { name: 'リマインド設定', path: '/teacher/reminder' },
        { name: 'メッセージ作成', path: '/teacher/create-message' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                    <div className="py-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-6">ダッシュボード</h2>
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
