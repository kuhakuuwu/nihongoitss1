// メッセージ作成
import TeacherLayout from "../components/Layout/TeacherLayout";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";        
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

export default function CreateMessagePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy recipientId từ state nếu được truyền từ TeacherMainPage
    const preSelectedRecipientId = location.state?.recipientId || "";
    
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedClass, setSelectedClass] = useState("");
    const [classList, setClassList] = useState([]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [attachment, setAttachment] = useState(null);

    const [isComplexMessage, setIsComplexMessage] = useState(false);
    const [requireConfirmation, setRequireConfirmation] = useState(false);
    
    // Deadline settings
    const [deadline, setDeadline] = useState("");
    const [deadlineTime, setDeadlineTime] = useState("");
    const [lockReplyAfterDeadline, setLockReplyAfterDeadline] = useState(false);

    // Reminder settings
    const [enableReminder, setEnableReminder] = useState(false);
    const [reminderOption, setReminderOption] = useState("1hour");
    const [customReminderDate, setCustomReminderDate] = useState("");
    const [customReminderTime, setCustomReminderTime] = useState("");
    const [reminderMemo, setReminderMemo] = useState("");

    // Recent messages
    const [recentMessages, setRecentMessages] = useState([]);
    const [sending, setSending] = useState(false);

    // ============================================================
    // 1. Load danh sách học sinh và lớp học
    // ============================================================
    useEffect(() => {
        const fetchStudents = async () => {
            // Lấy user hiện tại
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            let query = supabase
                .from("users")
                .select("id, username, first_name, last_name, class")
                .eq("role", "student")
                .order("username", { ascending: true });
            
            // Nếu có class của giáo viên, chỉ lấy học sinh cùng lớp
            if (currentUser?.id) {
                const { data: teacherData } = await supabase
                    .from('users')
                    .select('class')
                    .eq('id', currentUser.id)
                    .single();
                
                if (teacherData?.class) {
                    query = query.eq('class', teacherData.class);
                }
            }

            const { data, error } = await query;
            if (!error && data) {
                setStudents(data);

                // Nếu có preSelectedRecipientId, tìm username tương ứng và thêm vào selectedRecipients
                if (preSelectedRecipientId) {
                    const preSelectedStudent = data.find(s => s.id === preSelectedRecipientId);
                    if (preSelectedStudent) {
                        setSelectedRecipients([preSelectedStudent.username]);
                    }
                }

                // Thử lấy danh sách lớp từ bảng `classes` nếu có (hiển thị đầy đủ tất cả các lớp)
                try {
                    const { data: classesData, error: classesError } = await supabase
                        .from('classes')
                        .select('name')
                        .order('name', { ascending: true });

                    if (!classesError && classesData && classesData.length > 0) {
                        const names = classesData.map(c => c.name).filter(Boolean);
                        setClassList(names);
                    } else {
                        // Fallback: lấy từ danh sách học sinh nếu bảng classes không tồn tại hoặc rỗng
                        const classes = [...new Set(data.map(s => s.class).filter(Boolean))];
                        setClassList(classes);
                    }
                } catch (err) {
                    const classes = [...new Set(data.map(s => s.class).filter(Boolean))];
                    setClassList(classes);
                }
            }
        };

        fetchStudents();
    }, []);

    // ============================================================
    // 2. Gửi tin nhắn
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedRecipients.length === 0) {
            alert(t('message.select_recipient_required'));
            return;
        }
        
        setSending(true);

        const teacher = JSON.parse(localStorage.getItem("user"));
        if (!teacher) {
            alert(t('common.login_required'));
            setSending(false);
            return;
        }

        try {
            // Upload file nếu có
            let uploadedFileUrl = null;
            if (attachment) {
                // Lấy extension đúng từ tên file
                const fileExt = attachment.name.split('.').pop() || 'file';
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `attachments/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('message-attachments')
                    .upload(filePath, attachment, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert(t('message.upload_failed'));
                    setSending(false);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('message-attachments')
                    .getPublicUrl(filePath);
                
                uploadedFileUrl = urlData.publicUrl;
            }

            // Tạo tin nhắn chính
            const payload = {
                sender_id: teacher.username,
                recipient_id: selectedRecipients.join(','), // Lưu danh sách để backward compatible
                title,
                content,
                status: "未読",
                is_complex: isComplexMessage,
                require_confirmation: requireConfirmation,
                attachment_url: uploadedFileUrl,
                deadline: deadline && deadlineTime ? new Date(`${deadline}T${deadlineTime}`).toISOString() : null,
                reply_deadline_locked: lockReplyAfterDeadline,
            };

            const { data: messageData, error: messageError } = await supabase
                .from("messages")
                .insert(payload)
                .select("*")
                .single();

            if (messageError) {
                console.error(messageError);
                alert(t('common.send_failed'));
                setSending(false);
                return;
            }

            // Lấy user IDs của các recipients
            const { data: recipientUsers, error: userError } = await supabase
                .from('users')
                .select('id, username')
                .in('username', selectedRecipients);

            if (!userError && recipientUsers) {
                // Tạo records trong message_recipients
                const recipientRecords = recipientUsers.map(user => ({
                    message_id: messageData.id,
                    recipient_id: user.id,
                    status: '未読',
                }));

                await supabase
                    .from('message_recipients')
                    .insert(recipientRecords);
            }

            // Lưu attachment vào bảng attachments nếu có
            if (uploadedFileUrl && attachment) {
                await supabase
                    .from('attachments')
                    .insert({
                        message_id: messageData.id,
                        file_name: attachment.name,
                        file_url: uploadedFileUrl,
                        file_type: attachment.type,
                        file_size: attachment.size,
                    });
            }

            // Tạo reminder nếu được bật
            if (enableReminder && recipientUsers && recipientUsers.length > 0) {
                const reminderDateTime = calculateReminderDateTime();
                
                if (reminderDateTime) {
                    const reminderRecords = recipientUsers.map(user => ({
                        message_id: messageData.id,
                        student_id: user.username,
                        teacher_id: teacher.username,
                        reminder_datetime: reminderDateTime.toISOString(),
                        remind_on_no_reply: true,
                        memo: reminderMemo,
                        is_sent: false,
                    }));

                    await supabase
                        .from('reminders')
                        .insert(reminderRecords);
                }
            }

            // Thêm tin mới vào recentMessages
            setRecentMessages((prev) => [messageData, ...prev]);

            // Reset form
            setSelectedRecipients([]);
            setSearchQuery("");
            setTitle("");
            setContent("");
            setAttachment(null);
            setIsComplexMessage(false);
            setRequireConfirmation(false);
            setDeadline("");
            setDeadlineTime("");
            setLockReplyAfterDeadline(false);
            setEnableReminder(false);
            setReminderOption("1hour");
            setCustomReminderDate("");
            setCustomReminderTime("");
            setReminderMemo("");
            setSending(false);

            // Navigate to send complete page
            navigate('/teacher/send-complete');
        } catch (error) {
            console.error('Error sending message:', error);
            alert(t('common.send_failed'));
            setSending(false);
        }
    };

    // Calculate reminder datetime based on option
    const calculateReminderDateTime = () => {
        const now = new Date();

        switch (reminderOption) {
            case "1hour": {
                const dt = new Date(now);
                dt.setHours(dt.getHours() + 1);
                return dt;
            }
            case "tomorrow_morning": {
                const dt = new Date(now);
                dt.setDate(dt.getDate() + 1);
                dt.setHours(9, 0, 0, 0);
                return dt;
            }
            case "3days": {
                const dt = new Date(now);
                dt.setDate(dt.getDate() + 3);
                return dt;
            }
            case "custom": {
                if (!customReminderDate || !customReminderTime) return null;
                return new Date(`${customReminderDate}T${customReminderTime}`);
            }
            default:
                return null;
        }
    };

    // Xử lý hủy
    const handleCancel = () => {
        navigate(-1);
    };

    // Lấy tên hiển thị của học sinh
    const getStudentDisplayName = (student) => {
        if (student.first_name && student.last_name) {
            return `${student.last_name} ${student.first_name}`;
        }
        return student.username;
    };

    // Toggle recipient selection
    const toggleRecipient = (username) => {
        setSelectedRecipients(prev => {
            if (prev.includes(username)) {
                return prev.filter(u => u !== username);
            } else {
                return [...prev, username];
            }
        });
    };

    // Remove recipient
    const removeRecipient = (username) => {
        setSelectedRecipients(prev => prev.filter(u => u !== username));
    };

    // Filter students based on search
    const filteredStudents = students.filter(student => {
        const displayName = getStudentDisplayName(student).toLowerCase();
        const username = student.username.toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchQuery = displayName.includes(query) || username.includes(query);
        const matchClass = !selectedClass || selectedClass === 'all' || student.class === selectedClass;
        return matchQuery && matchClass;
    });
    
    // Select all/deselect all functions
    const handleSelectAll = () => {
        const allUsernames = filteredStudents.map(s => s.username);
        setSelectedRecipients(prev => {
            const newSet = new Set([...prev, ...allUsernames]);
            return Array.from(newSet);
        });
    };
    
    const handleDeselectAll = () => {
        const filteredUsernames = filteredStudents.map(s => s.username);
        setSelectedRecipients(prev => prev.filter(u => !filteredUsernames.includes(u)));
    };
    
    // Select by class
    const handleSelectByClass = (className) => {
        const classStudents = students.filter(s => s.class === className).map(s => s.username);
        setSelectedRecipients(prev => {
            const newSet = new Set([...prev, ...classStudents]);
            return Array.from(newSet);
        });
    };

    // ============================================================
    // 3. UI
    // ============================================================
    return (
        <TeacherLayout title={t('message.create_title')}>
            <div className="flex gap-6">

                {/* LEFT SIDE - Form */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* RECIPIENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.recipient')} <span className="text-red-500">*</span>
                            </label>
                            
                            {/* Class Filter và Select All */}
                            <div className="flex gap-2 mb-3">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">{t('message.all_classes')}</option>
                                    {classList.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    {t('message.select_all')}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-sm font-medium"
                                >
                                    {t('message.deselect_all')}
                                </button>
                                
                                <div className="flex-1 text-right text-sm text-gray-600 py-2">
                                    <span className="font-semibold text-green-600">{selectedRecipients.length}</span> {t('message.students_selected')}
                                </div>
                            </div>
                            
                            {/* Selected Recipients Display */}
                            {selectedRecipients.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedRecipients.map(username => {
                                        const student = students.find(s => s.username === username);
                                        return (
                                            <div 
                                                key={username}
                                                className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                                            >
                                                <span>{student ? getStudentDisplayName(student) : username}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipient(username)}
                                                    className="hover:text-green-900"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder={t('message.search_recipient_placeholder')}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                
                                {/* Dropdown List */}
                                {showDropdown && searchQuery && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => {
                                                        toggleRecipient(student.username);
                                                        setSearchQuery("");
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`px-4 py-2.5 cursor-pointer hover:bg-green-50 flex items-center justify-between ${
                                                        selectedRecipients.includes(student.username) ? 'bg-green-100' : ''
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {getStudentDisplayName(student)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.username} {student.class ? `(${student.class})` : ''}
                                                        </div>
                                                    </div>
                                                    {selectedRecipients.includes(student.username) && (
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2.5 text-gray-500 text-center">
                                                {t('message.no_students_found')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Click outside to close dropdown */}
                            {showDropdown && (
                                <div 
                                    className="fixed inset-0 z-0"
                                    onClick={() => setShowDropdown(false)}
                                />
                            )}
                        </div>

                        {/* TITLE */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.subject')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('message.subject_placeholder')}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.content')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                placeholder={t('message.content_placeholder')}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                required
                            />
                        </div>

                        {/* ATTACHMENT */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('message.attachment')}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => setAttachment(e.target.files[0])}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    {t('message.select_file')}
                                </label>

                                {attachment && (
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 bg-gray-50">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-700">{attachment.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachment(null)}
                                            className="text-red-500 hover:text-red-700 ml-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OPTIONS */}
                        <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{t('message.options')}</p>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isComplexMessage}
                                    onChange={(e) => setIsComplexMessage(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{t('message.complex_message')}</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={requireConfirmation}
                                    onChange={(e) => setRequireConfirmation(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{t('message.require_reply')}</span>
                            </label>
                        </div>
                        
                        {/* DEADLINE SETTINGS */}
                        <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg space-y-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{t('message.deadline')}</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        {t('history.from_date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        {t('reminder.time_label')}
                                    </label>
                                    <input
                                        type="time"
                                        value={deadlineTime}
                                        onChange={(e) => setDeadlineTime(e.target.value)}
                                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={lockReplyAfterDeadline}
                                    onChange={(e) => setLockReplyAfterDeadline(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700">{t('message.lock_reply_after_deadline')}</span>
                            </label>
                        </div>

                        {/* REMINDER SETTINGS */}
                        <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableReminder}
                                    onChange={(e) => setEnableReminder(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">{t('reminder.enable_reminder')}</span>
                            </label>

                            {enableReminder && (
                                <div className="mt-3 space-y-3 pl-7">
                                    {/* Reminder Options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('reminder.datetime_label')}
                                        </label>
                                        <select
                                            value={reminderOption}
                                            onChange={(e) => setReminderOption(e.target.value)}
                                            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="1hour">{t('reminder.option_1hour')}</option>
                                            <option value="tomorrow_morning">{t('reminder.option_tomorrow')}</option>
                                            <option value="3days">{t('reminder.option_3days')}</option>
                                            <option value="custom">{t('reminder.option_custom')}</option>
                                        </select>
                                    </div>

                                    {/* Custom DateTime */}
                                    {reminderOption === 'custom' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="date"
                                                value={customReminderDate}
                                                onChange={(e) => setCustomReminderDate(e.target.value)}
                                                className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="time"
                                                value={customReminderTime}
                                                onChange={(e) => setCustomReminderTime(e.target.value)}
                                                className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    {/* Memo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('reminder.memo_label')}
                                        </label>
                                        <textarea
                                            value={reminderMemo}
                                            onChange={(e) => setReminderMemo(e.target.value)}
                                            rows={2}
                                            placeholder={t('reminder.memo_placeholder')}
                                            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="submit" 
                                disabled={sending}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? t('common.processing') : t('common.send')}
                            </button>

                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>

                    </form>
                </div>

                {/* RIGHT SIDE — Recent Messages */}
                <div className="w-80">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col">

                        <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('message.recent_messages')}
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {/* Khi chưa có tin nhắn */}
                            {recentMessages.length === 0 && (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-400 text-sm">
                                        {t('message.no_recent_messages')}
                                    </p>
                                </div>
                            )}

                            {/* Khi có tin nhắn */}
                            {recentMessages.map((m) => (
                                <div
                                    key={m.id}
                                    className="bg-white border border-gray-200 shadow-sm rounded-lg p-3 hover:shadow-md hover:border-green-200 transition cursor-pointer"
                                    onClick={() => navigate(`/teacher/history/${m.id}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex justify-center items-center text-green-700 font-semibold shrink-0">
                                            {m.title.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{m.title}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {t('message.to')}: {m.recipient_id}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {m.created_at
                                                    ? new Date(m.created_at).toLocaleString("ja-JP")
                                                    : ""}
                                            </p>
                                        </div>

                                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}

                        </div>

                    </div>
                </div>

            </div>
        </TeacherLayout>
    );
}
