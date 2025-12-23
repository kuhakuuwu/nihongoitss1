import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { User, Camera, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';
import TeacherLayout from '../components/Layout/TeacherLayout';
import StudentLayout from '../components/Layout/StudentLayout';
import AdminLayout from '../components/Layout/AdminLayout';

export default function ProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        kana_first_name: '',
        kana_last_name: '',
        phone: '',
        address: '',
        gender: '',
        date_of_birth: '',
        avatar_url: ''
    });

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            if (!currentUser?.id) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (!error && data) {
                setUser(data);
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    kana_first_name: data.kana_first_name || '',
                    kana_last_name: data.kana_last_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    gender: data.gender || '',
                    date_of_birth: (data.date_of_birth || '').split('T')[0],
                    avatar_url: data.avatar_url || ''
                });

                // Cập nhật localStorage
                const updatedUser = {
                    ...currentUser,
                    avatar_url: data.avatar_url,
                    first_name: data.first_name,
                    last_name: data.last_name
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
            }

            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    // Handle avatar upload
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            alert(t('profile.invalid_image_type'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(t('profile.image_too_large'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('message-attachments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            const updatedUser = { ...user, avatar_url: urlData.publicUrl };
            setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));

            alert(t('profile.avatar_updated'));
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('profile.avatar_upload_failed'));
        } finally {
            setUploading(false);
            setAvatarPreview(null);
        }
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    kana_first_name: formData.kana_first_name,
                    kana_last_name: formData.kana_last_name,
                    phone: formData.phone,
                    address: formData.address,
                    gender: formData.gender,
                    date_of_birth: formData.date_of_birth
                })
                .eq('id', user.id);

            if (error) throw error;

            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert(t('profile.update_success'));
            setIsEditing(false);
        } catch (error) {
            console.error('Update error:', error);
            alert(t('profile.update_failed'));
        }
    };

    // Get avatar initial
    const getInitial = () => {
        if (user?.first_name && user?.last_name) {
            return user.last_name.charAt(0).toUpperCase();
        }
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return 'U';
    };

    // Determine layout component
    let LayoutComponent = ({ children }) => <div className="p-8 bg-gray-50 min-h-screen">{children}</div>;
    if (user?.role === 'teacher') {
        LayoutComponent = TeacherLayout;
    } else if (user?.role === 'student') {
        LayoutComponent = StudentLayout;
    } else if (user?.role === 'admin') {
        LayoutComponent = AdminLayout;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-medium">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500 font-medium">{t('profile.user_not_found')}</div>
            </div>
        );
    }

    return (
        <LayoutComponent title={t('profile.title')}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* 1. TOP SECTION: AVATAR & BASIC IDENTIFIER */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-gray-100 pb-8">
                    {/* Avatar Column */}
                    <div className="relative group">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Preview"
                                className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-sm"
                            />
                        ) : user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="Avatar"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                <span className="text-green-600 text-4xl font-bold">{getInitial()}</span>
                            </div>
                        )}

                        {/* Upload Overlay */}
                        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 cursor-pointer">
                            <label htmlFor="avatar-upload" className="cursor-pointer text-white flex flex-col items-center">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">{t('profile.change')}</span>
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handleAvatarChange}
                                className="hidden"
                                disabled={uploading}
                            />
                        </div>

                        {uploading && (
                            <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h2 className="text-3xl font-bold text-gray-900">
                                {user.last_name} {user.first_name}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${user.role === 'teacher'
                                    ? 'bg-blue-100 text-blue-700'
                                    : user.role === 'student'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-purple-100 text-purple-700'
                                }`}>
                                {user.role === 'teacher' ? t('profile.role_teacher') :
                                    user.role === 'student' ? t('profile.role_student') :
                                        user.role === 'admin' ? t('profile.role_admin') : user.role}
                            </span>
                        </div>

                        <p className="text-gray-500 font-medium">{user.email}</p>

                        {/* Edit Toggle Button if not editing */}
                        {!isEditing && (
                            <div className="pt-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm text-green-600 font-semibold hover:text-green-700 transition-colors flex items-center gap-1 mx-auto md:mx-0"
                                >
                                    <User className="w-4 h-4" />
                                    {t('profile.edit_profile')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. FORM SECTION */}
                <div className="">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            {t('profile.personal_information')}
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Read Only Fields Group (Visual Distinction) */}
                            {user.role === 'student' && (
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4 bg-gray-50 rounded-xl mb-2">
                                    {/* Username/Student ID */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                            {t('profile.student_id')}
                                        </label>
                                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            {user.username}
                                        </div>
                                    </div>
                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                            {t('profile.email')}
                                        </label>
                                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Editable Fields */}

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.last_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                    required
                                />
                            </div>

                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.first_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                    required
                                />
                            </div>

                            {/* KANA - Student only */}
                            {user.role === 'student' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('profile.kana_last_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.kana_last_name}
                                            onChange={(e) => setFormData({ ...formData, kana_last_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('profile.kana_first_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.kana_first_name}
                                            onChange={(e) => setFormData({ ...formData, kana_first_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.gender')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all appearance-none"
                                    >
                                        <option value="">{t('profile.select_gender')}</option>
                                        <option value="male">{t('profile.male')}</option>
                                        <option value="female">{t('profile.female')}</option>
                                        <option value="other">{t('profile.other')}</option>
                                    </select>
                                    {!isEditing && formData.gender && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0">
                                            {/* Hide arrow when disabled */}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.date_of_birth')}
                                </label>
                                <div className="flex items-center gap-2">
                                    {isEditing && <Calendar className="w-4 h-4 text-gray-400" />}
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        disabled={!isEditing}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.phone')}
                                </label>
                                <div className="flex items-center gap-2">
                                    {isEditing && <Phone className="w-4 h-4 text-gray-400" />}
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('profile.address')}
                                </label>
                                <div className="flex items-start gap-2">
                                    {isEditing && <MapPin className="w-4 h-4 text-gray-400 mt-2.5" />}
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        disabled={!isEditing}
                                        rows={2}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-medium disabled:text-gray-900 transition-all resize-none"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form
                                        setFormData({
                                            first_name: user.first_name || '',
                                            last_name: user.last_name || '',
                                            kana_first_name: user.kana_first_name || '',
                                            kana_last_name: user.kana_last_name || '',
                                            phone: user.phone || '',
                                            address: user.address || '',
                                            gender: user.gender || '',
                                            date_of_birth: user.date_of_birth || '',
                                            avatar_url: user.avatar_url || ''
                                        });
                                    }}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </LayoutComponent>
    );
}
