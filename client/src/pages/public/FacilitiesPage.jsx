import { motion } from 'framer-motion'
import { FaFlask, FaLaptop, FaBook, FaBus, FaFutbol, FaHospital, FaMusic, FaWifi, FaShieldAlt, FaUtensils } from 'react-icons/fa'
import { PageHero, SectionHeader, ScrollTop } from '../../components/ui/index'

const F=[
  {Icon:FaFlask,title:'Science Laboratories',desc:'Separate fully equipped Physics, Chemistry and Biology labs for hands-on practical experience.'},
  {Icon:FaLaptop,title:'Computer Lab',desc:'Modern IT lab with 40 workstations, high-speed internet and latest educational software.'},
  {Icon:FaBook,title:'Digital Library',desc:'Rich collection of books, journals and digital resources that cultivate independent learning.'},
  {Icon:FaBus,title:'Transportation',desc:'GPS-tracked school buses covering the entire Kathmandu Valley with trained drivers.'},
  {Icon:FaFutbol,title:'Sports Facilities',desc:'Cricket, football, basketball and badminton facilities for physical development.'},
  {Icon:FaHospital,title:'School Infirmary',desc:'Trained medical staff available throughout school hours for student health and safety.'},
  {Icon:FaMusic,title:'Arts and Music Room',desc:'Dedicated studio for music, dance, painting and creative arts expression.'},
  {Icon:FaWifi,title:'Smart Classrooms',desc:'Interactive smart boards, projectors and high-speed Wi-Fi in every classroom.'},
  {Icon:FaShieldAlt,title:'24/7 Security',desc:'CCTV surveillance and trained security personnel ensuring a fully safe campus.'},
  {Icon:FaUtensils,title:'School Cafeteria',desc:'Hygienic canteen offering balanced, freshly prepared nutritious meals daily.'},
]

export default function FacilitiesPage(){
  return (
    <>
      <PageHero tag="Infrastructure" title="School Facilities" sub="World-class facilities designed to support learning, creativity and physical development." breadcrumbs={[{label:'Facilities'}]}/>
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Our Infrastructure" title="Everything Under One Roof" sub="We provide the best services making us one of the most promising schools in Lalitpur."/>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {F.map((f,i)=>(
              <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.06}}
                className="card p-5 group hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 group-hover:bg-primary-400 group-hover:scale-110 transition-all duration-300">
                  <f.Icon className="text-primary-500 group-hover:text-white text-xl transition-colors"/>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm md:text-base">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
