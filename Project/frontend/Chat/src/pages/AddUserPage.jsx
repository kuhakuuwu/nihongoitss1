// ユーザー追加 (学生・教師)
import { useState } from 'react';
import TeacherLayout from '../components/Layout/TeacherLayout';

export default function AddUserPage() {
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [classValue, setClassValue] = useState('');
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [sendNotification, setSendNotification] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log({ role, firstName, lastName, classValue, email, tempPassword, sendNotification });
    };

    return (
        <TeacherLayout title="ユーザー追加（学生・教師）">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">新しいユーザーを追加</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                役割 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={role === 'student'}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">学生</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        checked={role === 'teacher'}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">教師</span>
                                </label>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    氏名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="例: 山田太郎"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="例: 161"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Class Field - Only show for students */}
                        {role === 'student' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    クラス <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={classValue}
                                    onChange={(e) => setClassValue(e.target.value)}
                                    placeholder="例: 1年A組"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                メールアドレス <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="例: user@example.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Temporary Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                仮パスワード <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                placeholder="8文字以上"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                minLength={8}
                                required
                            />
                        </div>

                        {/* Notification Checkbox */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="notification"
                                    checked={sendNotification}
                                    onChange={(e) => setSendNotification(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="notification" className="text-sm font-medium text-gray-700">
                                    ユーザーに確認メールを送信する
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
                            >
                                追加する
                            </button>
                            <button
                                type="button"
                                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TeacherLayout>
    );
}