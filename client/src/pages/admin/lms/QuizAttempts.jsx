import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../../services/api'

export default function QuizAttempts() {
  const { id } = useParams()
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { api.get(`/lms/quizzes/${id}/attempts`).then(r => setItems(r?.data || [])).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [id])
  return <div className="space-y-5"><Link to="/admin/lms/quizzes" className="text-sm text-primary-500">← Quizzes</Link><h1 className="text-2xl font-bold">Quiz Attempts</h1>{error && <div className="card p-4 text-red-500">{error}</div>}<div className="card overflow-x-auto"><table className="w-full"><thead><tr><th className="table-head">Student</th><th className="table-head">Score</th><th className="table-head">Percentage</th><th className="table-head">Submitted</th></tr></thead><tbody>{loading ? <tr><td className="table-cell" colSpan="4">Loading attempts…</td></tr> : items.length ? items.map(item => <tr className="table-row" key={item._id}><td className="table-cell">{item.student?.name}<div className="text-xs text-gray-400">{item.student?.email}</div></td><td className="table-cell">{item.score}/{item.totalMarks}</td><td className="table-cell">{item.totalMarks ? Math.round(item.score / item.totalMarks * 100) : 0}%</td><td className="table-cell">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'}</td></tr>) : <tr><td className="table-cell text-center py-10" colSpan="4">No attempts yet.</td></tr>}</tbody></table></div></div>
}
