// ユーザー追加 (学生・教師)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/Layout/TeacherLayout';
import { supabase } from '../supabaseClient';


export default function AddUserPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [name, setName] = useState('');
    const [userCode, setUserCode] = useState('');
    const [classValue, setClassValue] = useState('');
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [sendNotification, setSendNotification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Kiểm tra email đã tồn tại chưa
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                setError(t('addUser.email_exists'));
                setLoading(false);
                return;
            }

            // Thêm user mới vào database
            const { data, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username: name.trim(),
                        email: email,
                        password: tempPassword,
                        role: role,
                        user_code: userCode.trim(),
                        class: role === 'student' ? classValue : null
                    }
                ])
                .select();

            if (insertError) {
                console.error('Insert error:', insertError);
                setError(t('addUser.add_failed'));
                setLoading(false);
                return;
            }

            console.log('User created:', data);
            setSuccess(t('addUser.add_success'));
            
            // Reset form
            setName('');
            setUserCode('');
            setClassValue('');
            setEmail('');
            setTempPassword('');
            setSendNotification(false);
            
            // Có thể thêm logic gửi email thông báo ở đây nếu sendNotification = true

        } catch (err) {
            console.error('Error:', err);
            setError(t('addUser.add_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <TeacherLayout title={t('addUser.title')}>
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{t('addUser.add_new_user')}</h2>
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('addUser.role')} <span className="text-red-500">*</span>
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
                                    <span className="text-sm font-medium text-gray-700">{t('common.student')}</span>
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
                                    <span className="text-sm font-medium text-gray-700">{t('common.teacher')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('addUser.name_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.user_code')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={userCode}
                                    onChange={(e) => setUserCode(e.target.value)}
                                    placeholder={t('addUser.user_code_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Class Field - Only show for students */}
                        {role === 'student' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('addUser.class')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={classValue}
                                    onChange={(e) => setClassValue(e.target.value)}
                                    placeholder={t('addUser.class_placeholder')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('addUser.email')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('addUser.email_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Temporary Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('addUser.temp_password')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                placeholder={t('addUser.temp_password_placeholder')}
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
                                    {t('addUser.send_notification')}
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.processing') : t('common.add')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TeacherLayout>
    );
}