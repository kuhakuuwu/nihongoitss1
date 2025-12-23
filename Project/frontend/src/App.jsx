import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import MigratePasswordsPage from './pages/MigratePasswordsPage'
import AddUserPage from './pages/AddUserPage'
import TeacherMainPage from './pages/TeacherMainPage'
import StudentMainPage from './pages/StudentMainPage'
import CreateMessagePage from './pages/CreateMessagePage'
import CreateReplyPage from './pages/CreateReplyPage'
import MessageDetailPage from './pages/MessageDetailPage'
import ReminderSettingsPage from './pages/ReminderSettingsPage'
import SendCompletePage from './pages/SendCompletePage'
import HistoryListPage from './pages/HistoryListPage'
import StudentHistoryPage from './pages/StudentHistoryPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import AdminMainPage from './pages/AdminMainPage'
import HomePage from './pages/HomePage'
import ClassListPage from './pages/ClassListPage'
import ClassDetailPage from './pages/ClassDetailPage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Login & Password */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Teacher */}
        <Route path="/teacher" element={<TeacherMainPage />} />
        <Route path="/teacher/add-user" element={<AddUserPage />} />
        <Route path="/teacher/classes" element={<ClassListPage />} />
        <Route path="/teacher/class/:id" element={<ClassDetailPage />} />
        <Route path="/teacher/create-message" element={<CreateMessagePage />} />
        <Route path="/teacher/message/:id" element={<MessageDetailPage />} />
        {/* SỬA Ở ĐÂY */}
        <Route path="/teacher/reminder/:id" element={<ReminderSettingsPage />} />
        {/* (optional) nếu muốn cho phép mở không có id */}
        <Route path="/teacher/reminder" element={<ReminderSettingsPage />} />
        <Route path="/teacher/send-complete" element={<SendCompletePage />} />
        <Route path="/teacher/history" element={<HistoryListPage />} />

        {/* Student */}
        <Route path="/student" element={<StudentMainPage />} />
        <Route path="/student/reply/:id" element={<CreateReplyPage />} />
        <Route path="/student/history" element={<StudentHistoryPage />} />
        <Route path="/student/message/:id" element={<MessageDetailPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminMainPage />} />
        <Route path="/add-user" element={<AddUserPage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />
        <Route path="/admin/migrate-passwords" element={<MigratePasswordsPage />} />
      </Routes>
    </Router>
  );
}

export default App;