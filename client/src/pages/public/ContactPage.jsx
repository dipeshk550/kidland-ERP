import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebook, FaInstagram, FaWhatsapp, FaPaperPlane } from 'react-icons/fa'
import { PageHero, ScrollTop } from '../../components/ui/index'
import { useSettings } from '../../context/SettingsContext'
import api from '../../services/api'
import LOGO from '../../assets/logo.js'

export default function ContactPage(){
  const [loading,setLoading]=useState(false)
  const {register,handleSubmit,reset,formState:{errors}}=useForm()
  const { settings } = useSettings()
  const s = settings || {}
  const schoolName = s.name || 'Kidland School'
  const address = s.address || 'Kusunti, Lalitpur-13 (Opp. Yatayat Office), Nepal'
  const phone1 = s.phone1 || '9841404920'
  const phone2 = s.phone2 || '01-5430237'
  const email1 = s.email1 || 'kidlandmontessori@gmail.com'
  const hours = s.hours || 'Sunday – Friday: 10:00 AM – 4:00 PM'
  const fb = s.fb || 'https://facebook.com/kidlandmontessori'
  const ig = s.ig || 'https://instagram.com/kidlandeducation'
  const waNum = (s.wa || '9779841404920').replace(/\D/g, '')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/contact', data)
      toast.success('Message sent! We will get back to you soon.')
      reset()
    } catch (err) {
      toast.error(err?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <PageHero tag="Contact" title="Get In Touch" sub={`We would love to hear from you. Visit us at ${address.split(',')[0]} or call us anytime.`} breadcrumbs={[{label:'Contact'}]}/>
      <section className="py-16 md:py-20 bg-white">
        <div className="wrap px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-8 md:gap-10">
          <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="lg:col-span-2 space-y-5">
            <div className="card p-5 md:p-6" style={{background:'#0f1f35'}}>
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img src={LOGO} alt={`${schoolName} logo`} className="w-full h-full object-contain p-1" />
                </div>
                <div><div className="font-bold text-white">{schoolName}</div><div className="text-primary-300 text-xs">{s.tagline || 'Duty · Honor · Country'}</div></div>
              </div>
              {[[FaMapMarkerAlt,'Address',address],[FaPhoneAlt,'Phone',`${phone1}${phone2?' / '+phone2:''}`],[FaEnvelope,'Email',email1],[FaClock,'Office Hours',hours]].map(([Icon,l,v])=>(
                <div key={l} className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{background:'rgba(84,180,53,0.2)'}}><Icon className="text-primary-400" size={13}/></div>
                  <div><div className="text-xs text-gray-400 font-semibold mb-0.5">{l}</div><div className="text-sm text-white">{v}</div></div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-3">Follow Us</div>
                <div className="flex gap-2">
                  {[[fb,FaFacebook,'hover:bg-blue-600'],[ig,FaInstagram,'hover:bg-pink-600'],[`https://api.whatsapp.com/send?phone=${waNum}`,FaWhatsapp,'hover:bg-green-600']].map(([href,Icon,hov],i)=>(
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-lg bg-white/10 ${hov} flex items-center justify-center text-white transition-colors`}><Icon size={16}/></a>
                  ))}
                </div>
              </div>
            </div>
            <div className="card overflow-hidden h-48 md:h-52">
              <iframe title="Kidland Location" src="https://maps.google.com/maps?q=Kidland+Montessori+School+Kusunti+Lalitpur&t=m&z=15&output=embed" width="100%" height="100%" style={{border:0}} loading="lazy"/>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="lg:col-span-3">
            <div className="card p-6 md:p-8">
              <h3 className="font-bold text-xl text-gray-900 mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Your Name *</label><input {...register('name',{required:'Required'})} placeholder="Full name" className={`field ${errors.name?'field-error':''}`}/>{errors.name&&<p className="error-msg">{errors.name.message}</p>}</div>
                  <div><label className="label">Email *</label><input type="email" {...register('email',{required:'Required',pattern:{value:/\S+@\S+\.\S+/,message:'Invalid email'}})} placeholder="you@email.com" className={`field ${errors.email?'field-error':''}`}/>{errors.email&&<p className="error-msg">{errors.email.message}</p>}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Phone</label><input {...register('phone')} placeholder="98XXXXXXXX" className="field"/></div>
                  <div><label className="label">Subject *</label>
                    <select {...register('subject',{required:'Required'})} className={`field ${errors.subject?'field-error':''}`}>
                      <option value="">Select subject</option>
                      {['Admission Inquiry','Fee Structure','Scholarship','Transportation','ECA Activities','General Query'].map(s=><option key={s}>{s}</option>)}
                    </select>{errors.subject&&<p className="error-msg">{errors.subject.message}</p>}
                  </div>
                </div>
                <div><label className="label">Message *</label><textarea {...register('message',{required:'Required',minLength:{value:10,message:'Min 10 characters'}})} rows={5} placeholder="Write your message here..." className={`field resize-none ${errors.message?'field-error':''}`}/>{errors.message&&<p className="error-msg">{errors.message.message}</p>}</div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                  {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending…</>:<><FaPaperPlane size={13}/>Send Message</>}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
