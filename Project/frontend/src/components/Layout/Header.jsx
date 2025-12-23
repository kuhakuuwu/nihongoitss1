import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import logo from '../../assets/logo.svg';
import { changeLanguage } from '../../i18n';
import { supabase } from '../../supabaseClient';

export default function Header({ hideUserInfo = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // ⭐ Lấy user từ localStorage
  const [user] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // 🔔 Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  const notificationContainerRef = useRef(null);

  // ⭐ Chuyển ngôn ngữ
  const toggleLanguage = () => {
    const newLang = i18n.language === 'jp' ? 'vn' : 'jp';
    changeLanguage(newLang);
  };

  // ⭐ Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ⭐ Avatar chữ cái đầu
  const getInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // ⭐ Tên hiển thị
  const getDisplayName = () => {
    if (user?.username) return user.username;
    return t('header.user');
  };

  // -----------------------------
  // 🔔 Notification helpers
  // -----------------------------
  const unreadCount = notifications.filter((n) => n.status === '未読').length;

  const loadNotifications = async () => {
    try {
      // Thông báo dùng cho cả học sinh và giáo viên
      if (!user || !['student', 'teacher'].includes(user.role)) return;

      const recipientId = user.username;

      // Query tin nhắn nhận được, loại trừ các reaction
      const { data, error } = await supabase
        .from('messages')
        .select('id, title, status, sender_id, created_at')
        .eq('recipient_id', recipientId)
        .neq('title', '[REACTION]') // Loại trừ reaction
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Load notifications error:', error);
        return;
      }

      const mapped =
        data?.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          sender: m.sender_id,
          createdAt: m.created_at,
        })) ?? [];

      setNotifications(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Nếu là chưa đọc → cập nhật thành 既読
      if (notification.status === '未読') {
        const { error } = await supabase
          .from('messages')
          .update({ status: '既読' })
          .eq('id', notification.id);

        if (error) {
          console.error('Update status error:', error);
        } else {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, status: '既読' } : n,
            ),
          );
        }
      }

      // Điều hướng sang màn chi tiết
      if (user?.role === 'student') {
        navigate(`/student/message/${notification.id}`);
      } else if (user?.role === 'teacher') {
        navigate(`/teacher/message/${notification.id}`);
      } else {
        // fallback: ưu tiên đường dẫn student
        navigate(`/student/message/${notification.id}`);
      }

      setShowNotifications(false);
      setShowToast(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || !['student', 'teacher'].includes(user.role)) return;
    const unreadIds = notifications.filter((n) => n.status === '未読').map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: '既読' })
        .in('id', unreadIds);

      if (error) {
        console.error('Mark all read error:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.status === '未読' ? { ...n, status: '既読' } : n,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // useEffect: load + realtime
  // -----------------------------
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username, user?.role]);

  useEffect(() => {
    // Realtime notifications cho cả student và teacher
    if (!user || !['student', 'teacher'].includes(user.role)) return;

    const recipientId = user.username;

    const channel = supabase
      .channel('messages-notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${recipientId}`,
        },
        (payload) => {
          const m = payload.new;
          
          // Bỏ qua reaction notifications
          if (m.title === '[REACTION]') return;
          
          const newNotification = {
            id: m.id,
            title: m.title,
            status: m.status,
            sender: m.sender_id,
            createdAt: m.created_at,
          };

          // Thêm thông báo mới vào đầu danh sách
          setNotifications((prev) => [newNotification, ...prev]);

          // Hiện popup
          setLatestNotification(newNotification);
          setShowToast(true);

          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
          }, 5000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user?.username, user?.role]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <>
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="EduConnect" className="h-5" />
        </div>

        <div className="flex items-center gap-4">
          {/* (1) Chuyển ngôn ngữ */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            {i18n.language === 'jp' ? (
              <span>🇯🇵 日本語</span>
            ) : (
              <span>🇻🇳 Tiếng Việt</span>
            )}
          </button>

          {/* Ẩn phần userInfo nếu cần */}
          {!hideUserInfo && (
            <>
              {/* (2) Notification Icon + dropdown */}
              <div className="relative" ref={notificationContainerRef}>
                <button
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  aria-label={t('header.notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">
                        {t('header.notifications')}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          {t('header.mark_all_read')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {t('header.no_notifications')}
                        </div>
                      )}

                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 flex flex-col gap-1 hover:bg-gray-50 ${
                            item.status === '未読'
                              ? 'bg-green-50'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-800 line-clamp-1">
                              {item.title}
                            </span>
                            <span
                              className={`text-[10px] rounded-full px-2 py-0.5 ${
                                item.status === '未読'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {item.status === '未読'
                                ? t('teacher.unread')
                                : t('teacher.read')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{item.sender}</span>
                            <span>
                              {item.createdAt
                                ? new Date(
                                    item.createdAt,
                                  ).toLocaleString('ja-JP')
                                : ''}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* (3) User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                  className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                    {getInitial()}
                  </div>

                  <div className="hidden sm:flex flex-col items-start">
                    {/* Username */}
                    <span className="text-sm font-medium text-gray-700">
                      {getDisplayName()}
                    </span>

                    {/* Role hiển thị */}
                    {user?.role && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === 'teacher'
                            ? 'bg-green-100 text-green-700'
                            : user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role === 'teacher'
                          ? 'Teacher'
                          : user.role === 'admin'
                          ? 'Admin'
                          : 'Student'}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown menu */}
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Email */}
                    {user?.email && (
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                        {user.email}
                      </div>
                    )}

                    {/* View profile */}
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      {t('header.view_profile')}
                    </button>

                    {/* Change password */}
                    <button 
                      onClick={() => {
                        setShowAccountMenu(false);
                        navigate('/change-password');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('header.change_password')}
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Popup thông báo mới */}
      {showToast && latestNotification && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-gray-200 shadow-lg rounded-lg z-[60]">
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="text-xl">🔔</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {t('header.new_message_toast')}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {latestNotification.title}
              </p>
              <button
                onClick={() => handleNotificationClick(latestNotification)}
                className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                {t('message.open_message')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
