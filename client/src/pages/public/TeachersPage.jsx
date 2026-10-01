import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { FaEnvelope, FaLinkedin, FaGraduationCap, FaChalkboardTeacher, FaUsers, FaUserTie, FaSchool, FaBookReader } from 'react-icons/fa'
import { PageHero, SectionHeader, ScrollTop, Spinner } from '../../components/ui/index'
import { useTeachers } from '../../hooks/useApi'

const FALLBACK=[
  {_id:'1',name:'Ms. Shanti Khadka',position:'Founder and Director',dept:'Management',qual:'M.Ed, Leadership',exp:'20+',photo:'',order:1,status:'active'},
  {_id:'2',name:'Mr. Ram P. Adhikari',position:'Principal',dept:'Administration',qual:'M.Ed',exp:'15+',photo:'',order:2,status:'active'},
  {_id:'3',name:'Ms. Sunita Gurung',position:'Montessori Coordinator',dept:'Pre-Primary',qual:'NMTC Certified',exp:'12+',photo:'',order:3,status:'active'},
  {_id:'4',name:'Mr. Bikash Shrestha',position:'Head of Science',dept:'Science',qual:'M.Sc Physics',exp:'10+',photo:'',order:4,status:'active'},
  {_id:'5',name:'Ms. Puja Maharjan',position:'English HOD',dept:'English',qual:'M.A English',exp:'8+',photo:'',order:5,status:'active'},
  {_id:'6',name:'Mr. Deepak Tamang',position:'Mathematics Teacher',dept:'Mathematics',qual:'B.Sc Mathematics',exp:'7+',photo:'',order:6,status:'active'},
  {_id:'7',name:'Ms. Anita Rai',position:'ECA Coordinator',dept:'Arts & Culture',qual:'BFA',exp:'6+',photo:'',order:7,status:'active'},
  {_id:'8',name:'Mr. Sagar Karki',position:'Computer Teacher',dept:'IT',qual:'B.Tech IT',exp:'5+',photo:'',order:8,status:'active'},
]

const GROUPS = [
  { key: 'leadership', title: 'Leadership', icon: FaUserTie, match: teacher => /principal|vice principal|founder|director|head/i.test(teacher.position || teacher.role || '') },
  { key: 'coordination', title: 'Administration & Coordination', icon: FaSchool, match: teacher => /coordinator|administrator|hod|head|in-charge/i.test(teacher.position || teacher.role || '') },
  { key: 'subjects', title: 'Subject Teachers', icon: FaBookReader, match: teacher => /teacher|mentor|instructor/i.test(teacher.position || teacher.role || '') },
  { key: 'support', title: 'Support Staff', icon: FaUsers, match: () => true },
]

const POSITION_THEMES = [
  { match: /principal|vice principal|director|founder/i, title: 'School Leadership', pill: 'bg-emerald-600', gradient: 'from-emerald-500 via-green-500 to-lime-500', accent: 'text-emerald-600', ring: 'ring-emerald-200', stripe: 'bg-emerald-500' },
  { match: /coordinator|administrator|hod|head/i, title: 'Administration', pill: 'bg-lime-600', gradient: 'from-lime-500 via-green-500 to-emerald-500', accent: 'text-lime-600', ring: 'ring-lime-200', stripe: 'bg-lime-500' },
  { match: /science|math|computer|english|social|teacher|subject/i, title: 'Subject Faculty', pill: 'bg-green-700', gradient: 'from-green-600 via-emerald-500 to-teal-500', accent: 'text-green-600', ring: 'ring-green-200', stripe: 'bg-green-600' },
  { match: /pre-primary|primary|montessori|eca|arts|music|sports/i, title: 'Activity Faculty', pill: 'bg-teal-600', gradient: 'from-teal-500 via-emerald-500 to-green-500', accent: 'text-teal-600', ring: 'ring-teal-200', stripe: 'bg-teal-500' },
]

const FALLBACK_THEME = { title: 'Faculty', pill: 'bg-green-600', gradient: 'from-green-600 via-emerald-500 to-lime-500', accent: 'text-green-600', ring: 'ring-green-200', stripe: 'bg-green-500' }

function getTeacherTheme(teacher, index = 0) {
  const text = `${teacher.position || teacher.role || ''} ${teacher.department || teacher.dept || ''}`
  const matched = POSITION_THEMES.find(theme => theme.match.test(text)) || FALLBACK_THEME
  const fallbackStripes = ['bg-emerald-500', 'bg-lime-500', 'bg-green-600', 'bg-teal-500']
  return {
    ...matched,
    stripe: matched.stripe || fallbackStripes[index % fallbackStripes.length],
  }
}

function normalizeTeacher(teacher = {}, index = 0) {
  const name = teacher.name || 'Teacher'
  const position = teacher.position || teacher.role || 'Teacher'
  const department = teacher.department || teacher.dept || 'General'
  const theme = teacher.color || getTeacherTheme(teacher, index)
  const initials = (name || 'T')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

  return {
    ...teacher,
    name,
    position,
    role: teacher.role || position,
    department,
    dept: teacher.dept || department,
    qual: teacher.qual || 'Qualified',
    exp: teacher.exp || '5+',
    photo: teacher.photo || '',
    order: Number(teacher.order ?? index + 1),
    color: theme,
    init: initials,
  }
}

function groupTeachers(teachers) {
  const sorted = [...teachers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
  const buckets = GROUPS.map(group => ({ ...group, teachers: [] }))

  sorted.forEach(teacher => {
    const groupIndex = GROUPS.findIndex(group => group.match(teacher))
    const targetIndex = groupIndex === -1 ? GROUPS.length - 1 : groupIndex
    buckets[targetIndex].teachers.push(teacher)
  })

  return buckets.filter(group => group.teachers.length > 0)
}

function getCardMeta(teacher, index) {
  const key = `${teacher.position || teacher.role || ''} ${teacher.department || teacher.dept || ''}`.toLowerCase()
  const theme = POSITION_THEMES.find(item => item.match.test(key)) || FALLBACK_THEME
  return { badge: theme.title, accent: theme.accent, ring: theme.ring, pill: theme.pill, gradient: theme.gradient, stripe: theme.stripe }
}

export default function TeachersPage(){
  const {data,loading}=useTeachers({ limit: 100, sort: 'order name' })
  const teachers = useMemo(() => {
    const list = data?.data?.length ? data.data : FALLBACK
    return list.map(normalizeTeacher)
  }, [data])
  const groups = useMemo(() => groupTeachers(teachers), [teachers])
  return (
    <>
      <PageHero tag="Our Team" title="Faculty and Staff" sub="Qualified, experienced educators committed to every student's growth and success." breadcrumbs={[{label:'Teachers'}]}/>
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Faculty" title="Meet Our Teachers" sub="Kidland is guided by a visionary team with qualified and creative teaching staff."/>
          {loading?<div className="flex justify-center py-16"><Spinner size="lg"/></div>:(
            <div className="space-y-12">
              {groups.map((group, groupIndex) => (
                <div key={group.key}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500"><group.icon size={16}/></div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{group.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{group.teachers.length} {group.teachers.length === 1 ? 'member' : 'members'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                    {group.teachers.map((t,i)=>{
                      const meta = getCardMeta(t, i)
                      return (
                        <motion.div key={t._id||`${group.key}-${i}`} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:(groupIndex*0.06)+(i*0.05)}}
                          className="card overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-gray-100 dark:border-gray-800">
                          <div className={`relative overflow-hidden min-h-[272px] ${t.photo ? '' : `bg-gradient-to-br ${meta.gradient}`}`}>
                            {t.photo ? (
                              <img src={t.photo} alt={t.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute inset-0 bg-dots opacity-10"/>
                            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
                              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] bg-white/18 text-white backdrop-blur-sm shadow-sm">
                                {meta.badge}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white ${meta.stripe} shadow-lg`}>
                                {String(t.order || i + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
                              <h3 className="font-black text-[1.35rem] md:text-[1.6rem] leading-[1.05] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">{t.name}</h3>
                              <p className="text-white/95 text-sm font-bold uppercase tracking-[0.14em] mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">{t.position || t.role}</p>
                              <p className="text-white/78 text-xs mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">{t.department || t.dept}</p>
                            </div>
                          </div>
                          <div className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em] text-white ${meta.stripe}`}>{t.position || t.role}</span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em] bg-gray-100 dark:bg-gray-800 ${meta.accent}`}>{t.department || t.dept}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-left">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><FaGraduationCap className={meta.accent + ' shrink-0'} size={11}/>{t.qual||'Qualified'}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><FaChalkboardTeacher className={meta.accent + ' shrink-0'} size={11}/>{t.exp||'5+'} yrs experience</div>
                            </div>
                            <div className="flex justify-center gap-2 mt-3">
                              <button className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary-400 hover:text-white transition-all"><FaEnvelope size={12}/></button>
                              <button className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary-400 hover:text-white transition-all"><FaLinkedin size={12}/></button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
