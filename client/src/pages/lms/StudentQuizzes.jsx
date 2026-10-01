import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaQuestionCircle } from 'react-icons/fa'
import api from '../../services/api'
import NotificationBell from '../../components/lms/NotificationBell'

export default function StudentQuizzes() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { api.get('/lms/quizzes').then(r => setItems(r?.data || [])).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  return <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 md:p-8"><div className="max-w-4xl mx-auto space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">My Quizzes</h1><NotificationBell/></div>{error && <div className="card p-4 text-sm text-red-500">{error}</div>}{loading ? <div className="card p-5">Loading quizzes…</div> : items.length ? items.map(item => <div className="card p-5 flex items-center justify-between gap-4" key={item._id}><div><h2 className="font-bold">{item.title}</h2><p className="text-sm text-gray-500">{item.course?.title} · {item.questions?.length || 0} questions</p></div>{item.attempt ? <span className="badge-green">Score: {item.attempt.score}/{item.attempt.totalMarks}</span> : <Link className="btn-primary" to={`/lms/quizzes/${item._id}`}>Take quiz</Link>}</div>) : <div className="card p-12 text-center text-gray-400"><FaQuestionCircle className="mx-auto mb-2" size={26} />No published quizzes available.</div>}</div></div>
}
