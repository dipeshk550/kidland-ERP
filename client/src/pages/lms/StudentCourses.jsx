import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import NotificationBell from '../../components/lms/NotificationBell'
export default function StudentCourses() {
  const [courses,setCourses]=useState([]),[progress,setProgress]=useState([])
  useEffect(()=>{Promise.all([api.get('/lms/student/courses'),api.get('/lms/progress/me')]).then(([c,p])=>{setCourses(c?.data||[]);setProgress(p?.data||[])}).catch(()=>{})},[])
  return <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 md:p-8"><div className="max-w-5xl mx-auto space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">My Learning</h1><div className="flex gap-2 items-center"><NotificationBell/><Link className="btn-outline !px-3 !py-2 !text-xs" to="/lms/assignments">Assignments</Link><Link className="btn-outline !px-3 !py-2 !text-xs" to="/lms/quizzes">Quizzes</Link></div></div><div className="grid md:grid-cols-2 gap-4">{courses.map(c=>{const p=progress.find(x=>x.course._id===c._id);return <div className="card p-5" key={c._id}><h2 className="font-bold">{c.title}</h2><p className="text-sm text-gray-500">{c.subject} · {c.instructor?.name||'Teacher'}</p><div className="mt-4 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-primary-400 rounded-full" style={{width:`${p?.percent||0}%`}}/></div><p className="text-xs text-gray-500 mt-2">{p?.percent||0}% complete · {p?.completedLessons || 0}/{p?.lessons || 0} lessons</p><Link className="btn-primary mt-4" to={`/lms/courses/${c._id}`}>Open course</Link></div>})}</div>{!courses.length&&<div className="card p-10 text-center text-gray-400">No published courses are available.</div>}</div></div>
}
