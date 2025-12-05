import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AddUserPage from './pages/AddUserPage'
import TeacherMainPage from './pages/TeacherMainPage'
import StudentMainPage from './pages/StudentMainPage'
import CreateMessagePage from './pages/CreateMessagePage'
import MessageDetailPage from './pages/MessageDetailPage'
import HomePage from './pages/HomePage'   // 🟢 THÊM HOMEPAGE
import './index.css'

function App() {
  return (
    <Router>
      <Routes>

        {/* 🟢 HomePage là trang đầu tiên */}
        <Route path="/" element={<HomePage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />


        {/* Teacher */}
        <Route path="/teacher" element={<TeacherMainPage />} />
        <Route path="/teacher/add-user" element={<AddUserPage />} />
        <Route path="/teacher/create-message" element={<CreateMessagePage />} />

        {/* Student */}
        <Route path="/student" element={<StudentMainPage />} />
        <Route path="/teacher/history/:id" element={<MessageDetailPage />} />

        {/* Admin / Standalone */}
        <Route path="/add-user" element={<AddUserPage />} />

      </Routes>
    </Router>
  )
}

export default App
