import { useState,useEffect,useCallback } from 'react'
import api from '../services/api'
function useFetch(url,params={},deps=[]){
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(null)
  const fetch=useCallback(async()=>{
    setLoading(true);setError(null)
    try{ const r=await api.get(url,{params}); setData(r) }
    catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  },[url,JSON.stringify(params),...deps])
  useEffect(()=>{ fetch() },[fetch])
  return {data,loading,error,refetch:fetch}
}
export const useNews     =(p={})=>useFetch('/news',    {status:'published',...p})
export const useEvents   =(p={})=>useFetch('/events',  {status:'active',...p})
export const useNotices  =(p={})=>useFetch('/notices', {status:'published',...p})
export const useTeachers =(p={})=>useFetch('/teachers',{status:'active',...p})
export const useAlumni   =(p={})=>useFetch('/alumni',  {status:'active',...p})
export const useGallery  =(p={})=>useFetch('/gallery', p)
export const useAdmissions=(p={})=>useFetch('/admissions', p, [JSON.stringify(p)])
export const useWaMessages=(p={})=>useFetch('/whatsapp/messages',p,[JSON.stringify(p)])
export function useMutation(){
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState(null)
  const mutate=useCallback(async(method,url,data)=>{ setLoading(true);setError(null); try{ return await api[method](url,data) }catch(e){ setError(e.message);throw e }finally{ setLoading(false) } },[])
  return { loading,error, post:(u,d)=>mutate('post',u,d), put:(u,d)=>mutate('put',u,d), del:(u)=>mutate('delete',u) }
}
export default useFetch