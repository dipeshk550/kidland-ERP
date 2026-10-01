import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa'
import { PageHero, SectionHeader, ScrollTop } from '../../components/ui/index'
import { useSettings } from '../../context/SettingsContext'
import HERO_STUDENTS from '../../assets/hero-students.jpg'

export default function AboutPage() {
  const { settings } = useSettings()
  const s = settings || {}
  const schoolName = s.name || 'Kidland School'
  const est = s.est || '2005'
  const text = s.text || 'Discover Our Legacy of Excellence'
  const describe = s.describe || 'Kidland School is a leading NEB Affiliated institution at Kusunti, Lalitpur, providing quality Montessori and academic education since 2005.'
  const affiliated = s.affiliated || 'National Education Board (NEB)'
  const pname = s.pname || 'Ms. Shanti Khadka'
  const ptitle = s.ptitle || 'Founder and Director'
  const pphoto = s.pphoto
  const pmsg1 = s.pmsg1 || 'Since our establishment in 2005, we have been deeply committed to nurturing the minds of future leaders, innovators and changemakers.'
  const pmsg2 = s.pmsg2 || 'At Kidland, education extends beyond academic achievement — it is about shaping character, cultivating creativity and empowering students to navigate an ever-evolving world.'
  const pinitials = pname.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()

  return (
    <>
      <PageHero tag="About Us" title={`About ${schoolName}`} sub={` ${text}  `} breadcrumbs={[{label:'About'}]}/>
      <section className="py-16 md:py-24 bg-white">
        <div className="wrap px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
          <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
            <p className="section-tag mb-2">Our Story</p>
            <h2 className="section-title mb-4">Two Decades of <span className="text-gradient">Educational Excellence</span></h2>
            <div className="section-div"/>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed mb-6">
              <p>{describe}</p>
              <p>We apply the Montessori Method up to Primary level under {affiliated} guidance, blended with the national CDC curriculum for higher grades.</p>
              <p>Our school prioritises equal opportunity for all students with modern scientific materials, a conducive environment, quality teaching and moderate class sizes.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-7">
              {[{t:'Mission',d:'To provide quality education that shapes young minds through inclusive, inspiring learning.'},{t:'Vision',d:'To be a centre of academic excellence fostering discipline and holistic development.'}].map(({t,d})=>(
                <div key={t} className="p-4 rounded-xl border-l-4 border-primary-400 bg-primary-50">
                  <div className="font-bold text-gray-900 mb-1">{t}</div>
                  <p className="text-gray-600 text-xs">{d}</p>
                </div>
              ))}
            </div>
            <Link to="/apply" className="btn-primary">Apply for Admission <FaArrowRight size={12}/></Link>
          </motion.div>
          <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              <img src={HERO_STUDENTS} alt="Students learning at school" className="w-full h-full object-cover" onError={e=>{e.target.parentElement.style.background='linear-gradient(135deg,#54B435,#41a020)';e.target.style.display='none'}}/>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="wrap px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="relative max-w-sm mx-auto lg:mx-0 w-full">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] bg-gradient-to-br from-primary-600 to-navy flex items-end">
              {pphoto ? (
                <img src={pphoto} alt={pname} className="w-full h-full object-cover object-top absolute inset-0"/>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30 text-7xl font-bold">{pinitials}</div>
              )}
              <div className="relative z-10 p-5 bg-gradient-to-t from-black/70 to-transparent w-full">
                <div className="text-white font-bold">{pname}</div>
                <div className="text-primary-300 text-sm">{ptitle}</div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
            <p className="section-tag mb-2">Founder's Message</p>
            <h2 className="section-title mb-4">Welcome to <span className="text-gradient">{schoolName.replace(' School','')}</span></h2>
            <div className="section-div"/>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed italic mb-6">
              <p>{pmsg1}</p>
              <p>{pmsg2}</p>
              <p className="not-italic font-semibold text-gray-800">Together, we can inspire the leaders of tomorrow.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold overflow-hidden">
                {pphoto ? <img src={pphoto} alt={pname} className="w-full h-full object-cover"/> : pinitials}
              </div>
              <div><div className="font-bold text-gray-900">{pname}</div><div className="text-xs text-gray-500">{ptitle}, {schoolName}</div></div>
            </div>
          </motion.div>
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
