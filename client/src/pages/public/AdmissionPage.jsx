import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaCheckCircle, FaArrowRight, FaPhoneAlt, FaEnvelope } from 'react-icons/fa'
import { PageHero, ScrollTop } from '../../components/ui/index'

const steps=[{n:'01',title:'Fill Application Form',desc:'Complete the online admission form with accurate student and parent details.'},{n:'02',title:'Submit Documents',desc:'Upload Birth Certificate, Mark Sheet, Transfer Certificate and passport photos.'},{n:'03',title:'Entrance Assessment',desc:'Attend the on-site entrance test scheduled by the admissions office.'},{n:'04',title:'Confirmation',desc:'Receive confirmation by phone or email within 2 business days.'}]
const docs=['Birth Certificate (original and photocopy)','Previous Year Final Mark Sheet (original and photocopy)','Transfer Certificate (original and photocopy)','2 recent passport-size photographs','Character Certificate (if applicable)']

export default function AdmissionPage(){
  return (
    <>
      <PageHero tag="Admissions" title="Admission Information" sub="Applications for 2083 B.S. are now open. Limited seats — apply early." breadcrumbs={[{label:'Admission'}]}/>
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 md:gap-14">
          <div>
            <p className="section-tag mb-2">Process</p>
            <h2 className="section-title mb-4">Admission <span className="text-gradient">Procedure</span></h2>
            <div className="section-div"/>
            <div className="space-y-5 md:space-y-6 mt-6">
              {steps.map((s,i)=>(
                <motion.div key={s.n} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex gap-4 md:gap-5">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary-400 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md shadow-primary-400/30">{s.n}</div>
                  <div className="pt-1"><h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm md:text-base">{s.title}</h3><p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{s.desc}</p></div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/apply" className="btn-primary">Apply Online <FaArrowRight size={12}/></Link>
            </div>
          </div>
          <div>
            <p className="section-tag mb-2">Documents Required</p>
            <h2 className="section-title mb-4">Required <span className="text-gradient">Documents</span></h2>
            <div className="section-div"/>
            <ul className="space-y-3 mt-6 mb-8">
              {docs.map(d=><li key={d} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><FaCheckCircle className="text-primary-400 mt-0.5 shrink-0" size={14}/>{d}</li>)}
            </ul>
            <div className="p-5 md:p-6 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Contact Admissions</h3>
              <div className="space-y-3">
                <a href="tel:9841404920" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"><FaPhoneAlt className="text-primary-400" size={13}/>9841404920 / 01-5430237</a>
                <a href="mailto:kidlandmontessori@gmail.com" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"><FaEnvelope className="text-primary-400" size={13}/>kidlandmontessori@gmail.com</a>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-100 dark:border-primary-800">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Office Hours</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Sunday – Friday: 10:00 AM – 4:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
