import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { AdminPage } from '../../components/ui/AdminTable'

const ACTIONS = ['view','create','edit','delete','approve','export']
export default function ManageRoles() {
  const [catalog,setCatalog] = useState([]); const [roles,setRoles] = useState([])
  const [selected,setSelected] = useState(null); const [loading,setLoading] = useState(true)
  const load = () => Promise.all([api.get('/rbac/catalog'), api.get('/rbac/roles')])
    .then(([c,r]) => { setCatalog(c.data || []); setRoles(r.data || []); setSelected((r.data || [])[0] || null) })
    .catch(e => toast.error(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const toggle = (module, action) => setSelected(s => ({ ...s, permissions: catalog.map(c => {
    const old = (s.permissions || []).find(p => p.module === c.module)
    const next = new Set(old?.actions || [])
    if (c.module === module) next.has(action) ? next.delete(action) : next.add(action)
    return { module:c.module, actions:[...next] }
  }).filter(p => p.actions.length) }))
  const save = async () => { try { const r=await api.put(`/rbac/roles/${selected._id}`, selected); setRoles(x=>x.map(a=>a._id===selected._id?r.data:a)); toast.success('Permissions saved') } catch(e){toast.error(e.message)} }
  const create = async () => { const name=window.prompt('Role name (lowercase)'); if(!name) return; try { const r=await api.post('/rbac/roles',{name,label:name}); setRoles(x=>[...x,r.data]); setSelected(r.data); toast.success('Role created') } catch(e){toast.error(e.message)} }
  return <AdminPage title="Roles & Permissions" subtitle="Define module access and action permissions" onAdd={create} addLabel="Create Role">
    {loading ? <div className="card p-8 text-center text-gray-500">Loading roles…</div> : <div className="grid lg:grid-cols-[220px_1fr] gap-5">
      <div className="card p-2 space-y-1">{roles.map(r=><button key={r._id} onClick={()=>setSelected(r)} className={`w-full text-left px-3 py-3 rounded-lg text-sm ${selected?._id===r._id?'bg-primary-50 text-primary-700':'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{r.label}<span className="block text-xs text-gray-400">{r.isActive?'Active':'Inactive'}</span></button>)}</div>
      {selected ? <div className="card overflow-x-auto"><div className="p-4 flex justify-between items-center"><div><h3 className="font-bold">{selected.label}</h3><p className="text-xs text-gray-500">Select allowed actions</p></div><button className="btn-primary" onClick={save}>Save permissions</button></div>
        <table className="w-full text-sm"><thead><tr className="border-y">{['Module',...ACTIONS].map(x=><th className="p-3 text-left capitalize" key={x}>{x}</th>)}</tr></thead><tbody>{catalog.map(c=><tr className="border-b" key={c.module}><td className="p-3 font-medium capitalize">{c.module}</td>{ACTIONS.map(a=><td className="p-3" key={a}><input type="checkbox" checked={(selected.permissions||[]).find(p=>p.module===c.module)?.actions?.includes(a)||false} onChange={()=>toggle(c.module,a)} /></td>)}</tr>)}</tbody></table>
      </div> : <div className="card p-8 text-center text-gray-500">Create a role to configure permissions.</div>}
    </div>}
  </AdminPage>
}
