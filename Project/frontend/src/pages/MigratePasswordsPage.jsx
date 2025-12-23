import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/Layout/AdminLayout';
import { supabase } from '../supabaseClient';
import { hashPassword, isPasswordHashed } from '../utils/passwordHash';

export default function MigratePasswordsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [migrating, setMigrating] = useState(false);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const handleMigrate = async () => {
        setMigrating(true);
        setLogs([]);
        setSummary(null);

        addLog('🔐 Bắt đầu migration mật khẩu...', 'info');

        try {
            // Fetch all users
            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('id, email, username, password');

            if (fetchError) {
                addLog(`❌ Lỗi khi lấy danh sách users: ${fetchError.message}`, 'error');
                setMigrating(false);
                return;
            }

            addLog(`📊 Tìm thấy ${users.length} users cần xử lý`, 'info');

            let updatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            // Process each user
            for (const user of users) {
                // Skip if password is already hashed
                if (isPasswordHashed(user.password)) {
                    addLog(`⏭️  Bỏ qua ${user.username} (${user.email}) - đã hash`, 'skip');
                    skippedCount++;
                    continue;
                }

                try {
                    // Hash the password
                    const hashedPassword = await hashPassword(user.password);

                    // Update in database
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ password: hashedPassword })
                        .eq('id', user.id);

                    if (updateError) {
                        addLog(`❌ Lỗi khi cập nhật ${user.username} (${user.email}): ${updateError.message}`, 'error');
                        errorCount++;
                    } else {
                        addLog(`✅ Đã cập nhật ${user.username} (${user.email})`, 'success');
                        updatedCount++;
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (err) {
                    addLog(`❌ Lỗi xử lý ${user.username} (${user.email}): ${err.message}`, 'error');
                    errorCount++;
                }
            }

            const summaryData = {
                total: users.length,
                updated: updatedCount,
                skipped: skippedCount,
                errors: errorCount
            };

            setSummary(summaryData);
            addLog('\n📊 Tóm tắt Migration:', 'info');
            addLog(`   ✅ Đã cập nhật: ${updatedCount}`, 'success');
            addLog(`   ⏭️  Đã bỏ qua: ${skippedCount}`, 'skip');
            addLog(`   ❌ Lỗi: ${errorCount}`, 'error');
            addLog(`   📦 Tổng: ${users.length}`, 'info');
            addLog('\n🎉 Migration hoàn tất!', 'info');

        } catch (error) {
            addLog(`❌ Lỗi nghiêm trọng: ${error.message}`, 'error');
        } finally {
            setMigrating(false);
        }
    };

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <p className="text-red-600 mb-4">⚠️ Chỉ Admin mới có quyền truy cập trang này</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout title="Migration Mật khẩu">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            🔐 Migration Mật khẩu
                        </h2>
                        <p className="text-sm text-gray-600">
                            Tool này sẽ hash tất cả các mật khẩu plain text trong database sang SHA-256.
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-yellow-800 mb-1">Cảnh báo quan trọng:</h3>
                                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                    <li>Backup database trước khi chạy migration</li>
                                    <li>Chỉ chạy một lần duy nhất</li>
                                    <li>Mật khẩu đã hash sẽ được tự động bỏ qua</li>
                                    <li>Quá trình không thể hoàn tác</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    {summary && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-900 mb-3">📊 Kết quả Migration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded border border-blue-100">
                                    <div className="text-2xl font-bold text-green-600">{summary.updated}</div>
                                    <div className="text-xs text-gray-600">Đã cập nhật</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-100">
                                    <div className="text-2xl font-bold text-gray-600">{summary.skipped}</div>
                                    <div className="text-xs text-gray-600">Đã bỏ qua</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-100">
                                    <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
                                    <div className="text-xs text-gray-600">Lỗi</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-100">
                                    <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                                    <div className="text-xs text-gray-600">Tổng cộng</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleMigrate}
                            disabled={migrating}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {migrating ? '⏳ Đang xử lý...' : '🚀 Bắt đầu Migration'}
                        </button>
                    </div>

                    {/* Logs */}
                    {logs.length > 0 && (
                        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-1 font-mono text-sm">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`
                                            ${log.type === 'error' ? 'text-red-400' : ''}
                                            ${log.type === 'success' ? 'text-green-400' : ''}
                                            ${log.type === 'skip' ? 'text-yellow-400' : ''}
                                            ${log.type === 'info' ? 'text-blue-300' : ''}
                                        `}
                                    >
                                        <span className="text-gray-500">[{log.time}]</span> {log.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            ← Quay lại Admin
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
