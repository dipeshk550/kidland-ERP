import { useEffect, useState } from 'react'
import api from '../../services/api'
import { AdminPage } from '../../components/ui/AdminTable'
export default function AuditLog() {
  const [items,setItems]=useState([]); const [error,setError]=useState('')
  useEffect(()=>{api.get('/rbac/audit').then(r=>setItems(r.data||[])).catch(e=>setError(e.message))},[])
  return <AdminPage title="Audit Log" subtitle="Trace role and permission changes">
    <div className="card overflow-x-auto">{error?<p className="p-8 text-red-500">{error}</p>:<table className="w-full text-sm"><thead><tr className="border-b">{['When','Actor','Action','Entity','Details'].map(x=><th className="p-3 text-left" key={x}>{x}</th>)}</tr></thead><tbody>{items.map(x=><tr className="border-b" key={x._id}><td className="p-3 text-gray-500">{new Date(x.createdAt).toLocaleString()}</td><td className="p-3">{x.actor?.name||'—'}</td><td className="p-3">{x.action}</td><td className="p-3">{x.entity}</td><td className="p-3 max-w-sm truncate">{JSON.stringify(x.details||{})}</td></tr>)}{!items.length&&<tr><td colSpan="5" className="p-10 text-center text-gray-400">No audit entries.</td></tr>}</tbody></table>}</div>
  </AdminPage>
}
