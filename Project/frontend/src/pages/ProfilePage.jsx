import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { User, Camera, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';

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
                    date_of_birth: data.date_of_birth || '',
                    avatar_url: data.avatar_url || ''
                });
                
                // Cập nhật localStorage với đầy đủ thông tin từ database (bao gồm avatar_url)
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
        
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            alert(t('profile.invalid_image_type'));
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(t('profile.image_too_large'));
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result);
        reader.readAsDataURL(file);
        
        // Upload to Supabase Storage
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            
            // Sử dụng bucket message-attachments có sẵn
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
            
            // Update user avatar in database
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', user.id);
            
            if (updateError) throw updateError;
            
            // Update state and localStorage
            const updatedUser = { ...user, avatar_url: urlData.publicUrl };
            setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Dispatch event to notify other components (like Header)
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
            
            // Update local user data
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
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">{t('common.loading')}</div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-500">{t('profile.user_not_found')}</div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('profile.subtitle')}</p>
                </div>
                
                {/* Avatar Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                                />
                            ) : user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt="Avatar"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-green-600 flex items-center justify-center border-4 border-gray-200">
                                    <span className="text-white text-4xl font-bold">{getInitial()}</span>
                                </div>
                            )}
                            
                            {uploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                    <div className="text-white text-sm font-medium">{t('profile.uploading')}</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {user.last_name} {user.first_name}
                            </h2>
                            <p className="text-gray-600 mt-1">{user.email}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    user.role === 'teacher' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : user.role === 'student'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {user.role === 'teacher' ? t('profile.role_teacher') : 
                                     user.role === 'student' ? t('profile.role_student') : 
                                     user.role === 'admin' ? t('profile.role_admin') : user.role}
                                </span>
                            </div>
                            
                            <label htmlFor="avatar-upload" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                                <Camera className="w-4 h-4" />
                                {t('profile.change_avatar')}
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
                    </div>
                </div>
                
                {/* Profile Form */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" />
                            {t('profile.basic_info')}
                        </h3>
                        
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('profile.edit')}
                            </button>
                        ) : null}
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.last_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                    required
                                />
                            </div>
                            
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.first_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                    required
                                />
                            </div>
                            
                            {/* Kana - Only for students */}
                            {user.role === 'student' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('profile.kana_last_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.kana_last_name}
                                            onChange={(e) => setFormData({...formData, kana_last_name: e.target.value})}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('profile.kana_first_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.kana_first_name}
                                            onChange={(e) => setFormData({...formData, kana_first_name: e.target.value})}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* Username/Student ID - Read only */}
                            {user.role === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.student_id')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={user.username}
                                            disabled
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Email - Read only */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.email')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                    />
                                </div>
                            </div>
                            
                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.gender')}
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                >
                                    <option value="">{t('profile.select_gender')}</option>
                                    <option value="male">{t('profile.male')}</option>
                                    <option value="female">{t('profile.female')}</option>
                                    <option value="other">{t('profile.other')}</option>
                                </select>
                            </div>
                            
                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.date_of_birth')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                        disabled={!isEditing}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.phone')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        disabled={!isEditing}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                            
                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('profile.address')}
                                </label>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-3" />
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        disabled={!isEditing}
                                        rows={3}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Buttons */}
                        {isEditing && (
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    {t('common.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
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
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
                
                {/* Back button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        ← {t('common.back')}
                    </button>
                </div>
            </div>
        </div>
    );
}
