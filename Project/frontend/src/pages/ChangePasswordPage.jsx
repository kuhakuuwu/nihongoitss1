import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/Layout/AdminLayout';
import TeacherLayout from '../components/Layout/TeacherLayout';
import StudentLayout from '../components/Layout/StudentLayout';
import { supabase } from '../supabaseClient';
import { hashPassword, verifyPassword, isPasswordHashed } from '../utils/passwordHash';

export default function ChangePasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Get current user from localStorage
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validation
        if (!currentPassword) {
            setError(t('changePassword.error_current_password_required'));
            setLoading(false);
            return;
        }

        if (!newPassword) {
            setError(t('changePassword.error_new_password_required'));
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError(t('changePassword.error_password_min_length'));
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('changePassword.error_password_mismatch'));
            setLoading(false);
            return;
        }

        try {
            // Verify current password
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('password')
                .eq('id', user.id)
                .single();

            if (fetchError || !userData) {
                setError(t('common.send_failed'));
                setLoading(false);
                return;
            }

            // Check current password (support both hashed and plain text)
            let passwordMatch = false;
            if (isPasswordHashed(userData.password)) {
                passwordMatch = await verifyPassword(currentPassword, userData.password);
            } else {
                passwordMatch = (userData.password === currentPassword);
            }

            if (!passwordMatch) {
                setError(t('changePassword.error_current_password_incorrect'));
                setLoading(false);
                return;
            }

            // Hash and update password
            const hashedPassword = await hashPassword(newPassword);

            const { error: updateError } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', user.id);

            if (updateError) {
                console.error('Update password error:', updateError);
                setError(t('common.send_failed'));
                setLoading(false);
                return;
            }

            setSuccess(t('changePassword.success'));
            
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Redirect back after 2 seconds
            setTimeout(() => {
                navigate(-1);
            }, 2000);
        } catch (err) {
            console.error('Error changing password:', err);
            setError(t('common.send_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Select appropriate layout based on user role
    const LayoutComponent = 
        user?.role === 'admin' ? AdminLayout :
        user?.role === 'teacher' ? TeacherLayout :
        StudentLayout;

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <p className="text-red-600 mb-4">{t('common.login_required')}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                    >
                        {t('login.login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <LayoutComponent title={t('changePassword.title')}>
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {t('changePassword.title')}
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        {t('changePassword.description')}
                    </p>

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

                    <form onSubmit={handleChangePassword} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('changePassword.current_password')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder={t('changePassword.current_password_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('changePassword.new_password')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('changePassword.new_password_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                minLength={6}
                                required
                            />
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('changePassword.confirm_password')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('changePassword.confirm_password_placeholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                minLength={6}
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.processing') : t('changePassword.change_password')}
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
        </LayoutComponent>
    );
}
