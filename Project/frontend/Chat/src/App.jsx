import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import AddUserPage from './pages/AddUserPage'
import TeacherMainPage from './pages/TeacherMainPage'
import StudentMainPage from './pages/StudentMainPage'
import CreateMessagePage from './pages/CreateMessagePage'
import MessageDetailPage from './pages/MessageDetailPage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherMainPage />} />
        <Route path="/teacher/add-user" element={<AddUserPage />} />
        <Route path="/teacher/create-message" element={<CreateMessagePage />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<StudentMainPage />} />
        <Route path="/student/message/:id" element={<MessageDetailPage />} />
        
        {/* Admin/Standalone Routes */}
        <Route path="/add-user" element={<AddUserPage />} />
      </Routes>
    </Router>
  )
}

export default App