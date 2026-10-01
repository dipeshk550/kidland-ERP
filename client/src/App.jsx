import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import SplashScreen      from './components/ui/SplashScreen'
import PublicLayout    from './components/layout/PublicLayout'
import HomePage        from './pages/public/HomePage'
import AboutPage       from './pages/public/AboutPage'
import AcademicsPage   from './pages/public/AcademicsPage'
import AdmissionPage   from './pages/public/AdmissionPage'
import ApplicationPage from './pages/public/ApplicationPage'
import EventsPage      from './pages/public/EventsPage'
import NewsPage        from './pages/public/NewsPage'
import NewsArticlePage from './pages/public/NewsArticlePage'
import GalleryPage     from './pages/public/GalleryPage'
import TeachersPage    from './pages/public/TeachersPage'
import AlumniPage      from './pages/public/AlumniPage'
import ResultsPage     from './pages/public/ResultsPage'
import FacilitiesPage  from './pages/public/FacilitiesPage'
import NoticePage      from './pages/public/NoticePage'
import ContactPage     from './pages/public/ContactPage'
import NotFoundPage    from './pages/public/NotFoundPage'
import AdminLogin      from './pages/admin/AdminLogin'
import AdminLayout     from './components/layout/AdminLayout'
import Dashboard       from './pages/admin/Dashboard'
import ManageNews      from './pages/admin/ManageNews'
import ManageEvents    from './pages/admin/ManageEvents'
import ManageGallery   from './pages/admin/ManageGallery'
import ManageNotices   from './pages/admin/ManageNotices'
import ManageTeachers  from './pages/admin/ManageTeachers'
import ManageAlumni    from './pages/admin/ManageAlumni'
import ManageResults   from './pages/admin/ManageResults'
import ManageAdmissions from './pages/admin/ManageAdmissions'
import ManageUsers     from './pages/admin/ManageUsers'
import ManageSettings  from './pages/admin/ManageSettings'
import ManageWhatsApp  from './pages/admin/ManageWhatsApp'
import ManageContacts  from './pages/admin/ManageContacts'
import ManageRoles      from './pages/admin/ManageRoles'
import AuditLog         from './pages/admin/AuditLog'
import AttendanceManagement from './pages/admin/attendance/AttendanceManagement'
import TimetablePage from './pages/admin/TimetablePage'
// Fees Management
import FeeGroups       from './pages/admin/fees/FeeGroups'
import FeeTypes        from './pages/admin/fees/FeeTypes'
import FeeMaster       from './pages/admin/fees/FeeMaster'
import CollectFees     from './pages/admin/fees/CollectFees'
import SearchPayments  from './pages/admin/fees/SearchPayments'
import FeesStatement   from './pages/admin/fees/FeesStatement'
import FeesDue         from './pages/admin/fees/FeesDue'
import Discounts       from './pages/admin/fees/Discounts'
import FeesReports     from './pages/admin/fees/FeesReports'
// Library Management
import BookCategories  from './pages/admin/library/BookCategories'
import Authors         from './pages/admin/library/Authors'
import Publishers      from './pages/admin/library/Publishers'
import Books           from './pages/admin/library/Books'
import IssueBook       from './pages/admin/library/IssueBook'
import ReturnBook      from './pages/admin/library/ReturnBook'
import Renewals        from './pages/admin/library/Renewals'
import FineCollection  from './pages/admin/library/FineCollection'
import LibraryReports  from './pages/admin/library/LibraryReports'
// Transportation Management
import TransportDashboard  from './pages/admin/transport/TransportDashboard'
import TransportRoutesPage from './pages/admin/transport/Routes'
import RouteStops          from './pages/admin/transport/RouteStops'
import Vehicles            from './pages/admin/transport/Vehicles'
import Drivers             from './pages/admin/transport/Drivers'
import VehicleStaff        from './pages/admin/transport/VehicleStaff'
import StudentTransport    from './pages/admin/transport/StudentTransport'
import TransportFees       from './pages/admin/transport/TransportFees'
import PickupDropoff       from './pages/admin/transport/PickupDropoff'
import VehicleMaintenance  from './pages/admin/transport/VehicleMaintenance'
import FuelManagement      from './pages/admin/transport/FuelManagement'
import TransportReports    from './pages/admin/transport/TransportReports'
import LMSDashboard        from './pages/admin/lms/LMSDashboard'
import CourseManagement    from './pages/admin/lms/CourseManagement'
import AssignmentManagement from './pages/admin/lms/AssignmentManagement'
import SubmissionReview from './pages/admin/lms/SubmissionReview'
import QuizManagement from './pages/admin/lms/QuizManagement'
import QuizAttempts from './pages/admin/lms/QuizAttempts'
import CoursePreview from './pages/admin/lms/CoursePreview'
import LMSReports from './pages/admin/lms/LMSReports'
import MaterialUpload from './pages/admin/lms/MaterialUpload'
import StudentCourses from './pages/lms/StudentCourses'
import StudentCourseDetail from './pages/lms/StudentCourseDetail'
import StudentQuiz from './pages/lms/StudentQuiz'
import StudentQuizzes from './pages/lms/StudentQuizzes'
import StudentAssignments from './pages/lms/StudentAssignments'
import ParentProgress from './pages/lms/ParentProgress'
import AcademicSetup from './pages/admin/lms/AcademicSetup'
import TeacherLogin from './pages/portal/TeacherLogin'
import ParentLogin from './pages/portal/ParentLogin'
import TeacherPortal from './pages/portal/TeacherPortal'
import TeacherAttendance from './pages/portal/TeacherAttendance'
import ParentPortal from './pages/portal/ParentPortal'
import PortalAccount from './pages/portal/PortalAccount'
import PortalAttendance from './pages/portal/PortalAttendance'
import PasswordReset from './pages/portal/PasswordReset'

function Guard({ children, superOnly=false, adminOnly=false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin"/></div>
  if (!user) return <Navigate to="/admin/login" replace/>
  if (user.role === 'student') return <Navigate to="/lms/courses" replace/>
  if (user.role === 'teacher') return <Navigate to="/teacher" replace/>
  if (user.role === 'parent') return <Navigate to="/parent" replace/>
  if (superOnly && user.role !== 'superadmin') return <Navigate to="/admin" replace/>
  if (adminOnly && !['superadmin','admin'].includes(user.role)) return <Navigate to="/admin" replace/>
  return children
}
function StudentGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin"/></div>
  if (!user || user.role !== 'student') return <Navigate to="/admin/login" replace/>
  return children
}
function ParentGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin"/></div>
  if (!user || user.role !== 'parent') return <Navigate to="/admin/login" replace/>
  return children
}
function TeacherGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin"/></div>
  if (!user || user.role !== 'teacher') return <Navigate to="/teacher/login" replace/>
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <SplashScreen/>
          <Routes>
            <Route element={<PublicLayout/>}>
              <Route path="/"           element={<HomePage/>}/>
              <Route path="/about"      element={<AboutPage/>}/>
              <Route path="/academics"  element={<AcademicsPage/>}/>
              <Route path="/admission"  element={<AdmissionPage/>}/>
              <Route path="/apply"      element={<ApplicationPage/>}/>
              <Route path="/events"     element={<EventsPage/>}/>
              <Route path="/news"       element={<NewsPage/>}/>
              <Route path="/news/:id"   element={<NewsArticlePage/>}/>
              <Route path="/gallery"    element={<GalleryPage/>}/>
              <Route path="/teachers"   element={<TeachersPage/>}/>
              <Route path="/alumni"     element={<AlumniPage/>}/>
              <Route path="/results"    element={<ResultsPage/>}/>
              <Route path="/facilities" element={<FacilitiesPage/>}/>
              <Route path="/notices"    element={<NoticePage/>}/>
              <Route path="/contact"    element={<ContactPage/>}/>
              <Route path="*"           element={<NotFoundPage/>}/>
            </Route>
            <Route path="/admin/login" element={<AdminLogin/>}/>
            <Route path="/teacher/login" element={<TeacherLogin/>}/>
            <Route path="/parent/login" element={<ParentLogin/>}/>
            <Route path="/forgot-password" element={<PasswordReset/>}/>
            <Route path="/reset-password" element={<PasswordReset/>}/>
            <Route path="/lms/assignments" element={<StudentGuard><StudentAssignments/></StudentGuard>}/>
            <Route path="/lms/courses" element={<StudentGuard><StudentCourses/></StudentGuard>}/>
            <Route path="/lms/courses/:id" element={<StudentGuard><StudentCourseDetail/></StudentGuard>}/>
            <Route path="/lms/quizzes/:id" element={<StudentGuard><StudentQuiz/></StudentGuard>}/>
            <Route path="/lms/quizzes" element={<StudentGuard><StudentQuizzes/></StudentGuard>}/>
            <Route path="/lms/parent-progress" element={<ParentGuard><ParentProgress/></ParentGuard>}/>
            <Route path="/teacher" element={<TeacherGuard><TeacherPortal/></TeacherGuard>}/>
            <Route path="/teacher/attendance" element={<TeacherGuard><TeacherAttendance/></TeacherGuard>}/>
            <Route path="/teacher/account" element={<TeacherGuard><PortalAccount/></TeacherGuard>}/>
            <Route path="/teacher/assignments/:id/submissions" element={<TeacherGuard><SubmissionReview/></TeacherGuard>}/>
            <Route path="/parent" element={<ParentGuard><ParentPortal/></ParentGuard>}/>
            <Route path="/parent/account" element={<ParentGuard><PortalAccount/></ParentGuard>}/>
            <Route path="/parent/attendance" element={<ParentGuard><PortalAttendance/></ParentGuard>}/>
            <Route path="/student/attendance" element={<StudentGuard><PortalAttendance/></StudentGuard>}/>
            <Route path="/admin" element={<Guard><AdminLayout/></Guard>}>
              <Route index             element={<Dashboard/>}/>
              <Route path="news"       element={<ManageNews/>}/>
              <Route path="events"     element={<ManageEvents/>}/>
              <Route path="gallery"    element={<ManageGallery/>}/>
              <Route path="notices"    element={<ManageNotices/>}/>
              <Route path="teachers"   element={<ManageTeachers/>}/>
              <Route path="alumni"     element={<ManageAlumni/>}/>
              <Route path="results"    element={<ManageResults/>}/>
              <Route path="admissions" element={<ManageAdmissions/>}/>
              <Route path="whatsapp"   element={<ManageWhatsApp/>}/>
              <Route path="contacts"   element={<ManageContacts/>}/>
              <Route path="users"      element={<Guard adminOnly><ManageUsers/></Guard>}/>
              <Route path="roles"      element={<Guard adminOnly><ManageRoles/></Guard>}/>
              <Route path="audit"      element={<Guard adminOnly><AuditLog/></Guard>}/>
              <Route path="attendance" element={<AttendanceManagement/>}/>
              <Route path="attendance/take" element={<AttendanceManagement/>}/>
              <Route path="attendance/timetable" element={<AttendanceManagement/>}/>
              <Route path="timetable" element={<TimetablePage/>}/>
              <Route path="attendance/reports" element={<AttendanceManagement/>}/>
              <Route path="settings"   element={<ManageSettings/>}/>
              {/* Fees Management */}
              <Route path="fees/groups"    element={<FeeGroups/>}/>
              <Route path="fees/types"     element={<FeeTypes/>}/>
              <Route path="fees/master"    element={<FeeMaster/>}/>
              <Route path="fees/collect"   element={<CollectFees/>}/>
              <Route path="fees/payments"  element={<SearchPayments/>}/>
              <Route path="fees/statement" element={<FeesStatement/>}/>
              <Route path="fees/due"       element={<FeesDue/>}/>
              <Route path="fees/discounts" element={<Discounts/>}/>
              <Route path="fees/reports"   element={<FeesReports/>}/>
              {/* Library Management */}
              <Route path="library/categories" element={<BookCategories/>}/>
              <Route path="library/authors"    element={<Authors/>}/>
              <Route path="library/publishers" element={<Publishers/>}/>
              <Route path="library/books"      element={<Books/>}/>
              <Route path="library/issue"      element={<IssueBook/>}/>
              <Route path="library/return"     element={<ReturnBook/>}/>
              <Route path="library/renewals"   element={<Renewals/>}/>
              <Route path="library/fines"      element={<FineCollection/>}/>
              <Route path="library/reports"    element={<LibraryReports/>}/>
              {/* Transportation Management */}
              <Route path="transport"                element={<TransportDashboard/>}/>
              <Route path="transport/routes"         element={<TransportRoutesPage/>}/>
              <Route path="transport/stops"          element={<RouteStops/>}/>
              <Route path="transport/vehicles"       element={<Vehicles/>}/>
              <Route path="transport/drivers"        element={<Drivers/>}/>
              <Route path="transport/staff"          element={<VehicleStaff/>}/>
              <Route path="transport/students"       element={<StudentTransport/>}/>
              <Route path="transport/fees"           element={<TransportFees/>}/>
              <Route path="transport/attendance"     element={<PickupDropoff/>}/>
              <Route path="transport/maintenance"    element={<VehicleMaintenance/>}/>
              <Route path="transport/fuel"           element={<FuelManagement/>}/>
              <Route path="transport/reports"        element={<TransportReports/>}/>
              {/* Learning Management */}
              <Route path="lms"                   element={<LMSDashboard/>}/>
              <Route path="lms/courses"           element={<CourseManagement/>}/>
              <Route path="lms/courses/:id/preview" element={<CoursePreview/>}/>
              <Route path="lms/assignments"       element={<AssignmentManagement/>}/>
              <Route path="lms/assignments/:id/submissions" element={<SubmissionReview/>}/>
              <Route path="lms/quizzes" element={<QuizManagement/>}/>
              <Route path="lms/quizzes/:id/attempts" element={<QuizAttempts/>}/>
              <Route path="lms/materials" element={<MaterialUpload/>}/>
              <Route path="lms/reports" element={<LMSReports/>}/>
              <Route path="lms/academic" element={<Guard superOnly><AcademicSetup/></Guard>}/>
            </Route>
          </Routes>
          <Toaster position="top-right" toastOptions={{ style:{ background:'#1e293b',color:'#f1f5f9',borderRadius:'12px',fontSize:'13px' }, success:{ iconTheme:{ primary:'#54B435',secondary:'#fff' } }, error:{ iconTheme:{ primary:'#ef4444',secondary:'#fff' } } }}/>
        </BrowserRouter>
      </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}