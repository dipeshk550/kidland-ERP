import { motion } from 'framer-motion'
import { FaCheckCircle, FaFlask, FaLaptop, FaBook, FaBus, FaFutbol, FaHospital, FaSeedling, FaMedal } from 'react-icons/fa'
import { PageHero, SectionHeader, ScrollTop } from '../../components/ui/index'

const programs=[
  {Icon:FaSeedling,level:'Pre-Primary Level',age:'Age 2–5',method:'Montessori Method',color:'from-rose-500 to-pink-400',features:['NMTC Certified','Sensorial Activities','Language Development','Activity Based','Child Psychology'],desc:'Our Pre-Primary follows the Montessori Method under NMTC guidance. Children develop independence and love for learning through hands-on materials.'},
  {Icon:FaBook,level:'Primary Level',age:'Grade 1–5',method:'Montessori + CDC',color:'from-primary-500 to-green-400',features:['English Medium','CDC Curriculum','Smart Classes','Co-curricular','Regular Assessment'],desc:'Building on Montessori foundations, blending CDC curriculum with child-centred approaches in English, Maths, Science and Social Studies.'},
  {Icon:FaFlask,level:'Lower Secondary',age:'Grade 6–8',method:'National Curriculum',color:'from-blue-600 to-indigo-400',features:['Subject Specialists','Science Lab','Computer Classes','Project Work','Career Guidance'],desc:'Dedicated subject teachers with labs, projects and exam-focused preparation to build strong conceptual understanding.'},
  {Icon:FaMedal,level:'Secondary Level',age:'Grade 9–10',method:'SEE Board',color:'from-amber-500 to-orange-400',features:['SEE Preparation','Mock Exams','Personal Counselling','Optional Maths','Regular PTM'],desc:'Comprehensive SEE preparation with focused teaching, regular mock tests, individual counselling and extra classes.'},
]
const facilities=[
  {Icon:FaFlask,title:'Science Lab',desc:'Fully equipped Physics, Chemistry and Biology labs for hands-on experiments.'},
  {Icon:FaLaptop,title:'Computer Lab',desc:'Modern IT lab with 40 workstations, high-speed internet and latest software.'},
  {Icon:FaBook,title:'Library',desc:'Rich collection of books, journals and digital resources for independent research.'},
  {Icon:FaBus,title:'Transportation',desc:'GPS-tracked school buses covering the entire Kathmandu Valley safely.'},
  {Icon:FaFutbol,title:'Sports Facilities',desc:'Cricket, football, basketball and badminton courts for physical development.'},
  {Icon:FaHospital,title:'Infirmary',desc:'Trained medical staff available throughout school hours for student health.'},
]

export default function AcademicsPage(){
  return (
    <>
      <PageHero tag="Academics" title="Academic Programmes" sub="Comprehensive education from Pre-Primary Montessori through Secondary." breadcrumbs={[{label:'Academics'}]}/>
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Our Curriculum" title="Programmes We Offer" sub="Each level designed with care, combining international standards with Nepal's national curriculum."/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {programs.map((p,i)=>(
              <motion.div key={p.level} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="card overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className={`bg-gradient-to-r ${p.color} p-5 md:p-6 flex items-center gap-4`}>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><p.Icon className="text-white text-2xl md:text-3xl"/></div>
                  <div><div className="text-white font-bold text-lg md:text-xl">{p.level}</div><div className="text-white/75 text-sm">{p.age} · {p.method}</div></div>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.features.map(f=><span key={f} className="inline-flex items-center gap-1.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full font-medium"><FaCheckCircle size={10}/>{f}</span>)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 md:py-20 bg-slate-50 dark:bg-gray-900">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Infrastructure" title="School Facilities" sub="Everything students need to learn, grow and thrive — all under one roof."/>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {facilities.map((f,i)=>(
              <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
                className="card p-5 md:p-6 flex gap-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0"><f.Icon className="text-primary-500 text-lg md:text-xl"/></div>
                <div><h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm md:text-base">{f.title}</h3><p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed">{f.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
