import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FaArrowRight, FaArrowLeft, FaStar, FaChevronRight,
  FaUsers, FaTrophy, FaGraduationCap, FaChalkboardTeacher,
  FaBell, FaCalendarAlt, FaMapMarkerAlt, FaClock,
  FaPhoneAlt, FaEnvelope, FaGlobe, FaShieldAlt,
  FaLightbulb, FaHeart, FaFileAlt, FaQuoteRight,
  FaLeaf, FaAtom, FaBookReader, FaMedal,
  FaThumbsUp, FaComment, FaShareAlt, FaTimes,
} from 'react-icons/fa'
import { useNotices, useEvents, useNews } from '../../hooks/useApi'
import { useSettings } from '../../context/SettingsContext'
import LOGO from '../../assets/logo.js'
import HERO_STUDENTS from '../../assets/hero-students.jpg'
import HERO_STUDENTS_READING from '../../assets/hero-students-reading.jpg'
import HERO_STUDENT_LIBRARY from '../../assets/hero-student-library.jpg'
import HERO_STUDENTS_MATHEMATICS from '../../assets/hero-students-mathematics.jpg'
import DSC01144 from '../../assets/dsc01144.jpg'
import DSC01044 from '../../assets/dsc01044.jpg'
import DSC01135 from '../../assets/dsc01135.jpg'
import DSC01114 from '../../assets/dsc01114.jpg'
import DSC01172 from '../../assets/dsc01172.jpg'
import DSC01207 from '../../assets/dsc01207.jpg'
import DSC01229 from '../../assets/dsc01229.jpg'
import DSC01237 from '../../assets/dsc01237.jpg'
import DSC01240 from '../../assets/dsc01240.jpg'
import DSC01251 from '../../assets/dsc01251.jpg'
/* ── images ── */
const I = {
  h1:HERO_STUDENTS,
  h2:HERO_STUDENTS_READING,
  h4:HERO_STUDENT_LIBRARY,
  h5:HERO_STUDENTS_MATHEMATICS,
  h6:DSC01144,
  h7:DSC01044,
  h8:DSC01135,
  h9:DSC01114,
  ab:DSC01172,
  ac:DSC01207,
  ad:DSC01229,
  ae:DSC01237,
  af:DSC01240,
  ag:DSC01251,
}

/* ── data ── */
const SLIDES = [
  { bg:I.h1, h:'Building Confident Future Leaders',
    sub:'We aim at inspiring our students to dream more, learn more, do more and become more in their respective journey',
    btn:'Apply Now' },
  { bg:I.h2, h:'Learning Together, Growing Together',
    sub:'Our students learn with curiosity, confidence, and the support of a caring school community.',
    btn:'Learn More' },
  { bg:I.h4, h:'A Love of Learning for Every Student',
    sub:'We encourage every learner to explore, read, and build the skills needed for a bright future.',
    btn:'About Us' },
  // { bg:I.h5, h:'Learning Through Collaboration',
  //   sub:'Students learn from one another, ask questions, and build confidence through meaningful teamwork.',
  //   btn:'Learn More' },
]
const STATS=[
  {n:'1,200+',label:'Students Enrolled'},
  {n:'60+',  label:'Expert Faculty'},
  {n:'20+',  label:'Years of Excellence'},
  {n:'95%',  label:'Success Rate'},
]
const WHY_CARDS=[
  {Icon:FaGraduationCap, title:'Academic Excellence',   desc:'Empowering students with quality education, innovative learning, and outstanding academic achievements. We foster critical thinking, creativity, and lifelong success.'},
  {Icon:FaUsers,         title:'Expert Faculty',        desc:'Our dedicated faculty brings expertise, passion, and real-world experience into every classroom. They inspire students to achieve their full academic and personal potential.'},
  {Icon:FaGlobe,         title:'Global Vision',         desc:'We empower students with global knowledge, cross-cultural understanding, and future-ready skills. Our vision is to create confident graduates who make a positive impact worldwide.'},
  {Icon:FaShieldAlt,     title:'Safe Environment',      desc:'We provide a secure, inclusive, and supportive School where every student feels valued and respected. A safe learning environment helps students grow with confidence and peace of mind.'},
  {Icon:FaLightbulb,     title:'Modern Facilities',     desc:'Modern infrastructure and innovative learning spaces empower students to reach their full potential. Our campus combines comfort, technology, and excellence for a world-class education.'},
  {Icon:FaHeart,         title:'Holistic Development',  desc:'Education at our institution goes beyond the classroom, fostering innovation, resilience, and leadership. We help students grow into capable, compassionate, and future-ready individuals.'},
]
const PROGS=[
  {img:I.h9, label:'Pre-Primary Level', sub:'(Age 18 Months - 5.5 Years)',
    desc:'Where little learners take their first steps toward a lifetime of discovery and success. We combine play, care, and quality education to help every child flourish.'},
  {img:I.h7, label:'Primary Level', sub:'Grade 1 – 5',
    desc:'Our primary program builds strong foundations in literacy, numeracy, and critical thinking through engaging, student-centered learning. We inspire curiosity, creativity, and confidence in every child.'},
  {img:I.h4, label:'Lower Secondary', sub:'Grade 6 – 8',
    desc:'Our Lower Secondary program strengthens academic knowledge while fostering critical thinking, creativity, and problem-solving skills. Students are prepared for higher learning through a balanced and engaging curriculum.'},
  {img:I.h5, label:'Secondary', sub:'Grade 9 – 10',
    desc:'Our Secondary program prepares students for academic excellence and the SEE examination through quality education and expert guidance. We develop critical thinking, leadership, and confidence for future success.'},
]
const ACHIEVERS=[
  {init:'AK',name:'Anish Karki',  img:I.p1,  award:'Top SEE Graduate — GPA 3.95'},
  {init:'ST',name:'Sarina Tamang',   img:I.p2,   award:'Scholarship — Medical Studies'},
  {init:'PM',name:'Priya Maharjan',  img:I.p3,  award:'Engineering — Pulchowk Campus'},
  {init:'RB',name:'Rohan Basnet',    img:I.p4,    award:'National Debate Champion 2025'},
  {init:'NK',name:'Nisha Khadka',    img:I.p1,    award:'Youth & Senior Sports Team'},
  {init:'BG',name:'Bijay Gurung',    img:I.p2,    award:'International Programme — USA'},
]
const TESTI=[
  {
    init:'SS', name:'Mrs. Sita Sharma', role:'Parent', subtitle:'Parent · Grade 5 Student',
    stars:5, avatarColor:'linear-gradient(135deg,#54B435,#41a020)',
    text:'My son\'s confidence has completely transformed since joining Kidland. The teachers genuinely care about every single child\'s growth and future.',
    fullText:'My son\'s confidence has completely transformed since joining Kidland. The teachers genuinely care about every single child\'s growth and future. I\'ve watched him go from a shy, hesitant learner to a confident, enthusiastic student who loves going to school every morning. The school\'s holistic approach to education — combining academics with character building — is truly exceptional. I am deeply grateful to the entire Kidland team for nurturing my son so beautifully.',
  },
  {
    init:'AT', name:'Aarav Thapa', role:'Alumni', subtitle:'Alumni · SEE Graduate 2024',
    stars:5, avatarColor:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    text:'I passed SEE with a 3.9 GPA thanks to Kidland\'s dedicated teachers and the excellent preparation system they have in place.',
    fullText:'I passed SEE with a 3.9 GPA thanks to Kidland\'s dedicated teachers and the excellent preparation system they have in place. Every teacher went above and beyond to make sure we truly understood the concepts, not just memorised them. The mock exams, revision sessions, and personal guidance made all the difference. Kidland gave me the foundation I needed to succeed and I will always be proud to call myself a Kidland alumnus.',
  },
  {
    init:'RG', name:'Mr. Rajesh Gurung', role:'Parent', subtitle:'Parent · Two Children',
    stars:5, avatarColor:'linear-gradient(135deg,#f59e0b,#d97706)',
    text:'Both my children study at Kidland. The perfect balance of academics and extracurriculars truly sets this school apart from all others.',
    fullText:'Both my children study at Kidland. The perfect balance of academics and extracurriculars truly sets this school apart from all others. The school doesn\'t just focus on grades — it nurtures creativity, sport, and personal growth. My daughter won the inter-school science competition and my son leads the school\'s debate team. This would never have been possible without Kidland\'s wonderful teachers and the rich environment they have created. Highly recommended to every parent.',
  },
]

const FE=[
  {_id:'1',title:'Annual Sports Day',date:'June 5',venue:'School Ground',cat:'Sports',icon:FaTrophy},
  {_id:'2',title:'Science Fair 2025',date:'June 20',venue:'Auditorium',cat:'Academic',icon:FaBookReader},
  {_id:'3',title:'Cultural Programme',date:'July 15',venue:'School Ground',cat:'Cultural',icon:FaCalendarAlt},
]

/* ── count-up ── */
function CUp({val}){
  const ref=useRef(null),[d,setD]=useState(val.replace(/[0-9,]/g,'0'))
  useEffect(()=>{
    const io=new IntersectionObserver(([e])=>{
      if(!e.isIntersecting)return;io.disconnect()
      const n=parseInt(val.replace(/[^0-9]/g,'')),sf=val.replace(/[0-9,]/g,'')
      let s=0;const st=Math.max(1,Math.ceil(n/80))
      const t=setInterval(()=>{s=Math.min(s+st,n);setD(s.toLocaleString()+sf);if(s>=n)clearInterval(t)},18)
    },{threshold:0.4})
    if(ref.current)io.observe(ref.current)
    return()=>io.disconnect()
  },[val])
  return <span ref={ref}>{d}</span>
}

/* ══════════════════════════════════
   1. HERO — full-viewport slider
   Bottom-left text, clean gradient
   Green notice ticker moved to TopBar
══════════════════════════════════ */
function Hero(){
  const[cur,setCur]=useState(0),tmr=useRef(null)
  const go=d=>{setCur(c=>(c+d+SLIDES.length)%SLIDES.length);clearInterval(tmr.current);tmr.current=setInterval(()=>setCur(c=>(c+1)%SLIDES.length),6500)}
  useEffect(()=>{tmr.current=setInterval(()=>setCur(c=>(c+1)%SLIDES.length),6500);return()=>clearInterval(tmr.current)},[])
  const s=SLIDES[cur]
  const [showResultBtn, setShowResultBtn] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setShowResultBtn(window.scrollY > 150);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  return(
    <section className="relative overflow-hidden select-none w-full" style={{height:'clamp(560px,82vh,860px)',background:'#0a1628'}}>
      {/* Background image with smooth crossfade */}
      <AnimatePresence initial={false}>
        <motion.div key={cur} className="absolute inset-0"
          initial={{opacity:0,scale:1.04}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
          transition={{duration:1.1,ease:'easeOut'}}>
          <img src={s.bg} alt="" className="w-full h-full object-cover"
            style={{objectPosition:cur === 0 ? 'center 28%' : 'center center'}}
            onError={e=>e.target.style.display='none'}/>
          {/* Gradient tuned to keep the image visible while supporting the text */}
          <div className="absolute inset-0" style={{
            background:'linear-gradient(90deg,rgba(10,22,40,0.90) 0%,rgba(10,22,40,0.76) 35%,rgba(10,22,40,0.42) 62%,rgba(10,22,40,0.14) 100%)'
          }}/>
          <div className="absolute bottom-0 left-0 right-0" style={{height:'50%',background:'linear-gradient(to top,rgba(10,22,40,0.78) 0%,transparent 100%)'}}/>
        </motion.div>
      </AnimatePresence>

      {/* Green bottom accent */}
      <div className="absolute bottom-0 inset-x-0 h-1 z-20"
        style={{background:'linear-gradient(90deg,transparent,#54B435,#86ef67,#54B435,transparent)'}}/>

      {/* Text content — bottom left */}
      <div className="absolute inset-x-0 bottom-0 z-10 pb-14 md:pb-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div key={cur}
              initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
              transition={{duration:0.6,ease:'easeOut'}}>
              <h1 className="font-serif font-bold text-white leading-[0.98] mb-5"
                style={{fontSize:'clamp(3rem,5.4vw,5.4rem)',letterSpacing:'-0.03em',maxWidth:760,textShadow:'0 4px 18px rgba(0,0,0,0.72)'}}>
                {s.h}
              </h1>
              {/* Subtext */}
              <p className="text-white leading-relaxed mb-8 font-normal"
                style={{fontSize:'clamp(0.98rem,1.45vw,1.15rem)',maxWidth:620,textShadow:'0 3px 14px rgba(0,0,0,0.62)'}}>{s.sub}</p>
              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link to={s.btn === 'Apply Now' ? '/apply' : '/about'}
                  className="font-bold text-white rounded-full px-7 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-xl text-sm sm:text-base"
                  style={{background:'linear-gradient(135deg,#276514,#54B435)',boxShadow:'0 8px 24px rgba(84,180,53,0.42)'}}>
                  {s.btn}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Arrow controls */}
      <button onClick={()=>go(-1)}
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-white border border-white/25 backdrop-blur-sm transition-all"
        style={{background:'rgba(255,255,255,0.12)'}}>
        <FaArrowLeft size={15}/>
      </button>
      <button onClick={()=>go(1)}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-white border border-white/25 backdrop-blur-sm transition-all"
        style={{background:'rgba(255,255,255,0.12)'}}>
        <FaArrowRight size={15}/>
      </button>

      {/* Mobile dots — bottom center */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex md:hidden gap-2">
        {SLIDES.map((_,i)=>(
          <button key={i} onClick={()=>go(i-cur)} className="rounded-full transition-all"
            style={{width:i===cur?26:7,height:7,background:i===cur?'#54B435':'rgba(255,255,255,0.35)'}}/>
        ))}
      </div>

      {/* Result Published sticky side tab — now visible on mobile, tablet, and desktop */}
      <Link to="/results"
        className="absolute z-20 flex flex-col items-center justify-center gap-1.5 py-5 px-2.5 rounded-l-xl hover:px-4 transition-all duration-200"
        style={{top:'58%',right:0,transform:'translateY(-50%)',background:'#54B435  ',boxShadow:'-4px 0 16px rgba(165,30,39,0.42)'}}>
        <FaTrophy size={14} className="text-white"/>
        <span className="text-white font-black text-[10px] uppercase"
          style={{writingMode:'vertical-rl',textOrientation:'mixed',letterSpacing:'0.18em'}}>
          RESULT PUBLISHED
        </span>
      </Link>
    </section>
  )
}

/* ══════════════════════════════════
   2. ABOUT — image 2
   Left: tag + heading + text + mini-features + Read More
   Right: building image with "27 years" badge overlay
══════════════════════════════════ */
function AboutSection(){
  const{settings}=useSettings(),S=settings||{}
  const est=S.est||'2005'
  const desc=S.desc||'Kidland School has completed its glorious '+( new Date().getFullYear()-parseInt(est) )+' years and has established itself as a reputed academic institution. Founded with the vision of quality education, we have been nurturing young minds with world-class Montessori methodology and a caring environment.'
  const yrs=new Date().getFullYear()-parseInt(est)
  return(
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
        {/* Left text */}
        <motion.div initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.6}}>
          {/* "ABOUT US" pill — exact kidland style: dark red rounded pill */}
          <div className="inline-flex items-center mb-5">
            <span className="font-black text-white text-xs uppercase tracking-widest px-4 py-2 rounded-full"
              style={{background:'#54B435'}}>ABOUT US</span>
          </div>
          <h2 className="font-black text-gray-900 leading-tight mb-5" style={{fontSize:'clamp(2rem,3.5vw,3rem)'}}>
            A Legacy of{' '}
            <span style={{color:'#54B435'}}>Academic<br/>Excellence</span>
          </h2>
          <p className="text-gray-500 leading-relaxed mb-7 text-base">{desc}</p>
          {/* Mini features row — like kidland */}
          <div className="flex flex-wrap gap-6 mb-8">
            {[
              {Icon:FaBookReader,title:'Quality Education',sub:'NEB-affiliated programs'},
              {Icon:FaGlobe,     title:'Global Vision',   sub:'International standards'},
            ].map(f=>(
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'#f0fde8'}}>
                  <f.Icon size={16} style={{color:'#54B435'}}/>
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{f.title}</div>
                  <div className="text-xs text-gray-400">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Read More button — dark red, like kidland */}
          <Link to="/about"
            className="inline-flex items-center gap-2 font-bold text-white rounded-xl px-6 py-3.5 hover:-translate-y-0.5 transition-all"
            style={{background:'#54B435',fontSize:14}}>
            Read More <FaArrowRight size={12}/>
          </Link>
        </motion.div>

        {/* Right image with badge */}
        <motion.div initial={{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.6}}
          className="relative">
          <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img src={DSC01144} alt="Kidland School" className="w-full h-full object-cover"
              onError={e=>{e.target.parentElement.style.background='#54B435';e.target.style.display='none'}}/>
          </div>
          {/* Years badge — like kidland's "19 YEARS" circular badge */}
          <div className="absolute bottom-4 left-4 rounded-xl px-4 py-3 text-white shadow-2xl"
            style={{background:'#54B435'}}>
            <div className="text-4xl font-black leading-none">{yrs}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-0.5">YEARS OF</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">EXCELLENCE</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   3. STATS — image 3
   Dark red full-width background
   Large watermark number (yrs) behind
   4 stat counters
══════════════════════════════════ */
function StatsSection(){
  const{settings}=useSettings(),S=settings||{}
  const est=S.est||'2005'
  const yrs=new Date().getFullYear()-parseInt(est)
  return(
    <section className="relative py-16 overflow-hidden" style={{background:'#54B435'}}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
  <span
    className="font-black"
    style={{
      color: "rgba(255,255,255,0.08)",
      fontSize: 'clamp(200px,30vw,320px)',
      lineHeight: 1,
    }}
  >
    {yrs}
  </span>
</div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.25em] mb-3" style={{color:'#f59e0b'}}>OUR LEGACY</p>
        <h2 className="font-black text-white mb-12" style={{fontSize:'clamp(1.8rem,3.5vw,2.8rem)'}}>
          {yrs} Years of Excellence
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.1}}>
              <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none mb-2">
                <CUp val={s.n}/>
              </div>
              <div className="text-white/65 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   4. WHY CHOOSE US — image 4
   Center heading in dark red pill
   6-card grid (3x2)
══════════════════════════════════ */
function WhySection(){
  return(
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header — red pill + title like Nirvana */}
        <div className="text-center mb-4">
          <h2 className="inline-block font-black text-white px-8 py-3 rounded-xl mb-5"
            style={{background:'#54B435',fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>
            Why Choose Kidland?
          </h2>
          <p className="text-gray-600 text-base max-w-xl mx-auto">
            Discover what sets us apart as one of Lalitpur's most trusted educational institutions.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {WHY_CARDS.map((w,i)=>(
            <motion.div key={w.title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.07}}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              {/* Icon in light red circle — like Nirvana */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{background:'#f0fde8'}}>
                <w.Icon size={20} style={{color:'#54B435'}}/>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{w.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   5. ACADEMIC PROGRAMS — image 5
   Red pill heading
   4 cards: image top with label overlay, text below
══════════════════════════════════ */
function ProgramsSection(){
  return(
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="inline-block font-black text-white px-8 py-3 rounded-xl mb-5"
            style={{background:'#54B435',fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>
            Our Academic Programs
          </h2>
          <p className="text-gray-600 text-base">
           Comprehensive academic programs designed to build strong foundations for lifelong learning and future success.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {PROGS.map((p,i)=>(
            <motion.div key={p.label} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.1}}
              className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group bg-white">
              {/* Image with label overlay at bottom */}
              <div className="relative h-48 overflow-hidden">
                <img src={p.img} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={e=>{e.target.parentElement.style.background='#54B435';e.target.style.display='none'}}/>
                <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.0) 55%)'}}/>
                <div className="absolute bottom-3 left-4">
                  <div className="font-black text-white text-base">{p.label}</div>
                  <div className="text-white/70 text-xs">{p.sub}</div>
                </div>
              </div>
              {/* Body */}
              <div className="p-5">
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                <Link to="/academics" className="inline-flex items-center gap-1.5 font-bold text-sm" style={{color:'#54B435'}}>
                  Learn More <FaArrowRight size={11}/>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   6. CTA BANNER — image 6
   Full-width dark image with centered text + button
══════════════════════════════════ */
function CTABanner(){
  const{settings}=useSettings(),S=settings||{}
  return(
    <section className="relative overflow-hidden min-h-[320px] md:min-h-[500px]" >
      <img
    src={I.h1}
    alt="Hero"
    className="absolute inset-0 w-full h-full object-cover"
    style={{
      objectPosition: "center 38%",
    }}
  />
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.68)'}}/>
      <div className="relative z-10 flex items-center justify-center text-center py-20 px-6">
        <div style={{maxWidth:720}}>
          <h2 className="font-black text-white mb-4 leading-tight" style={{fontSize:'clamp(2rem,4.5vw,3.5rem)'}}>
            Join Kidland's Legacy of Excellence
          </h2>
          <p className="text-white/75 mb-8 text-base leading-relaxed">
            Shape your future with top programs in Montessori, Primary, Lower Secondary and SEE Level. Apply today — admission is now open!
          </p>
          <Link to="/apply"
            className="inline-flex items-center gap-2 font-bold rounded-full px-8 py-4 hover:-translate-y-0.5 transition-all"
            style={{background:'#f59e0b',color:'#111',fontSize:15,boxShadow:'0 6px 24px rgba(245,158,11,0.4)'}}>
            Inquiry Open <FaArrowRight size={13}/>
          </Link>
        </div>
      </div>
    </section>
  )
}

function CampusGallery(){
  const images=[
    {src:I.h1,alt:'Students learning at Kidland School'},
    {src:I.h2,alt:'Kidland School students together'},
    {src:I.ac,alt:'Students participating in a school activity'},
    {src:I.ab,alt:'Kidland School campus'},
    {src:I.ad,alt:'Primary students at Kidland School'},
    {src:I.ae,alt:'Students learning in class'},
    {src:I.h7,alt:'Kidland School student activity'},
    {src:I.h8,alt:'Students taking part in school life'},
    {src:I.af,alt:'Students learning together at Kidland School'},
    {src:I.ag,alt:'Students enjoying school activities'}
  ]

  return(
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="inline-block font-black text-white px-8 py-3 rounded-xl mb-5"
            style={{background:'#54B435',fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>
            Life at Kidland
          </h2>
          <p className="text-gray-600 text-base max-w-xl mx-auto">
            A glimpse of the learning, friendships, and experiences that make our school community special.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {images.map((image,index)=>(
            <div key={image.src} className={`relative overflow-hidden rounded-2xl bg-gray-200 ${index===0 || index===5 ? 'md:row-span-2 md:h-full' : 'h-44 sm:h-56'}`}>
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                onError={event=>{event.currentTarget.parentElement.style.background='#54B435';event.currentTarget.style.display='none'}}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   7. ACHIEVERS — image 7
   Trophy icons + red pill heading
   Horizontal scrollable row of circular photos
══════════════════════════════════ */
function AchieversSection(){
  const[cur,setCur]=useState(0)
  const[paused,setPaused]=useState(false)
  const[visible,setVisible]=useState(4)
  const[instant,setInstant]=useState(false) // true only during the last->first wrap jump

  useEffect(()=>{
    const updateVisible=()=>{
      const w=window.innerWidth
      if(w<640) setVisible(1)
      else if(w<1024) setVisible(2)
      else setVisible(4)
    }
    updateVisible()
    window.addEventListener("resize",updateVisible)
    return ()=>window.removeEventListener("resize",updateVisible)
  },[])

  const maxIndex=Math.max(0,ACHIEVERS.length-visible)

  useEffect(()=>{
    setCur(c=>Math.min(c,maxIndex))
  },[maxIndex])

  // reset the "instant" flag right after the snap so future slides animate normally again
  useEffect(()=>{
    if(instant){
      const t=setTimeout(()=>setInstant(false),50)
      return ()=>clearTimeout(t)
    }
  },[instant])

  const goTo=(newIndex,isWrap)=>{
    setInstant(isWrap)
    setCur(newIndex)
  }

  const prev=()=>goTo(Math.max(0,cur-1),false)
  const next=()=>{
    if(cur>=maxIndex) goTo(0,true)      // wrap → instant snap, no slide-through
    else goTo(cur+1,false)               // normal → animated slide
  }

  useEffect(()=>{
    if(paused) return
    const id=setInterval(()=>{
      if(cur>=maxIndex) goTo(0,true)
      else goTo(cur+1,false)
    },3000)
    return ()=>clearInterval(id)
  },[paused,maxIndex,cur])

  const gapPx = visible===1 ? 12 : visible===2 ? 16 : 24
  const cardWidth = visible===1 ? '100%' : `calc(${100/visible}% - ${(gapPx*(visible-1))/visible}px)`

  return(
    <section className="py-10 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          {/* Trophy + red pill + trophy — like Nirvana */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            {/* <FaTrophy size={18} className="sm:hidden" style={{color:'#54B435'}}/>
            <FaTrophy size={22} className="hidden sm:block" style={{color:'#54B435'}}/> */}
            <h2 className="inline-block font-black text-white px-5 sm:px-8 py-2 sm:py-3 rounded-xl"
              style={{background:'#54B435',fontSize:'clamp(1.1rem,4vw,2rem)'}}>
              Our Achievers
            </h2>
            {/* <FaTrophy size={18} className="sm:hidden" style={{color:'#54B435'}}/>
            <FaTrophy size={22} className="hidden sm:block" style={{color:'#54B435'}}/> */}
          </div>
          <p className="text-gray-500 text-xs sm:text-sm px-4">Celebrating the outstanding accomplishments of our students and alumni.</p>
        </div>

        <div className="relative" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
          {/* Prev arrow */}
          <button onClick={prev} disabled={cur===0}
            className="absolute left-0 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all disabled:opacity-30"
            style={{background:'#fff',borderColor:'#ddd'}}>
            <FaArrowLeft size={11} className="sm:hidden text-gray-600"/>
            <FaArrowLeft size={13} className="hidden sm:block text-gray-600"/>
          </button>

          <div className="overflow-hidden mx-9 sm:mx-10 lg:mx-12">
            <motion.div className="flex gap-3 sm:gap-4 lg:gap-6"
              animate={{x:`calc(-${cur * (100/visible)}% - ${cur * gapPx}px)`}}
              transition={{type:'tween', duration: instant ? 0 : 0.4}}>
              {ACHIEVERS.map((a,i)=>(
                <div key={i} className="flex-shrink-0 text-center" style={{width:cardWidth}}>
                  {/* Circular photo with red border — like Nirvana */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full mx-auto mb-3 sm:mb-4 border-4 overflow-hidden flex items-center justify-center font-black text-white text-lg sm:text-xl lg:text-2xl"
                    style={{borderColor:'#54B435',background:'linear-gradient(135deg,#54B435,#41a020)'}}>
                    {a.img
                      ? <img src={a.img} alt={a.name} className="w-full h-full object-cover"/>
                      : a.init}
                  </div>
                  <div className="font-bold text-gray-900 text-xs sm:text-sm mb-1 px-1">{a.name}</div>
                  <span className="inline-block text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full"
                    style={{background:'#f59e0b'}}>
                    {a.award}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Next arrow */}
          <button onClick={next}
            className="absolute right-0 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all"
            style={{background:'#fff',borderColor:'#ddd'}}>
            <FaArrowRight size={11} className="sm:hidden text-gray-600"/>
            <FaArrowRight size={13} className="hidden sm:block text-gray-600"/>
          </button>
        </div>
      </div>
    </section>
  )
}
/* ══════════════════════════════════
   8. LATEST NOTICES — image 8
   "STAY UPDATED" eyebrow in amber
   "Latest Notices" large heading
   "View All Notices" right button
   2-column card grid with "Featured" badge
══════════════════════════════════ */
function NoticesSection(){
  const{data:nd}=useNotices({limit:4})
  const{data:ed}=useEvents({limit:3})
  const notices=nd?.data || []
  const events=ed?.data?.length?ed.data:FE
  const topNotice=notices[0]
  const liveItems=notices.slice(0,4).map(n => n.title).filter(Boolean)
  const tickerGroups=[liveItems, liveItems]
  return(
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-10 items-start">
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'#f0fde8'}}>
                  <FaBell size={14} style={{color:'#54B435'}}/>
                </div>
                <h2 className="font-black text-gray-900" style={{fontSize:'clamp(1.8rem,3vw,2.45rem)'}}>Notice Board</h2>
              </div>
              <Link to="/notices" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{color:'#54B435'}}>
                View All <FaArrowRight size={12}/>
              </Link>
            </div>

            <div className="rounded-xl overflow-hidden mb-5 border border-gray-200 shadow-sm">
              <div className="flex items-stretch text-white overflow-hidden" style={{background:'#233f68'}}>
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]" style={{background:'#54B435'}}>
                  Live
                </span>
                <div className="relative flex-1 overflow-hidden">
                  <div className="ticker absolute inset-0 flex items-center min-w-max px-4 text-sm font-semibold gap-10">
                    {tickerGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="flex items-center gap-8 shrink-0 whitespace-nowrap">
                        {group.map((item, index) => (
                          <span key={`${groupIndex}-${index}-${item}`} className="whitespace-nowrap flex items-center gap-8">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/65"/>
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {notices.slice(0,4).map((n,i)=>{
                const d=new Date(n.createdAt)
                return (
                  <motion.div key={n._id||i} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}}
                    viewport={{once:true}} transition={{delay:i*0.06}}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex flex-col shrink-0 border border-gray-200 bg-white text-center">
                        <div className="text-[10px] font-bold text-white py-0.5" style={{background:'#54B435'}}>
                          {d.toLocaleString('en-US',{month:'short'})}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-lg font-black text-gray-900 leading-none">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white" style={{background:'#ef4444'}}>
                            New
                          </span>
                          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{background:'#dbeafe',color:'#1d4ed8'}}>
                            {n.cat || 'Notice'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{n.title}</h3>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'#f0fde8'}}>
                  <FaCalendarAlt size={14} style={{color:'#54B435'}}/>
                </div>
                <h2 className="font-black text-gray-900" style={{fontSize:'clamp(1.8rem,3vw,2.45rem)'}}>Upcoming Events</h2>
              </div>
              <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{color:'#54B435'}}>
                View All <FaArrowRight size={12}/>
              </Link>
            </div>

            <div className="space-y-4">
              {events.slice(0,3).map((e,i)=>{
                const EIcon=e.icon || e.Icon || FaCalendarAlt
                return (
                  <motion.div key={e._id||i} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}}
                    viewport={{once:true}} transition={{delay:i*0.08}}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{background:'#eefbe0'}}>
                        <EIcon size={18} style={{color:'#54B435'}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold mb-1" style={{background:'#d1fae5',color:'#059669'}}>
                          {e.cat || 'Event'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{e.title}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1.5"><FaCalendarAlt size={10}/>{e.date || 'TBA'}</span>
                          <span className="inline-flex items-center gap-1.5"><FaMapMarkerAlt size={10}/>{e.venue || 'School Ground'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════
   9. TESTIMONIALS — image 9
   "TESTIMONIALS" pill + "Our Stories"
   3-column cards with stars + quote + avatar
   Dots at bottom
══════════════════════════════════ */
function TestimonialsSection(){
  const [cur,    setCur]    = useState(0)
  const [active, setActive] = useState(null)   // currently open modal
  const [liked,  setLiked]  = useState({})     // track liked items

  useEffect(()=>{
    if(active) return                           // pause auto-scroll while modal open
    const t=setInterval(()=>setCur(c=>(c+1)%TESTI.length),5500)
    return ()=>clearInterval(t)
  },[active])

  const Stars = ({n}) => (
    <div className="flex gap-0.5">
      {Array.from({length:5}).map((_,j)=>(
        <FaStar key={j} size={16} style={{color: j<n ? '#f59e0b' : '#e5e7eb'}}/>
      ))}
    </div>
  )

  const Avatar = ({t, size='sm'}) => {
    const sz = size==='lg' ? 'w-16 h-16 text-xl' : 'w-11 h-11 text-sm'
    return t.img ? (
      <img src={t.img} alt={t.name}
        className={`${sz} rounded-full object-cover ring-2 ring-white shadow-md shrink-0`}/>
    ) : (
      <div className={`${sz} rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-md`}
        style={{background: t.avatarColor || 'linear-gradient(135deg,#54B435,#41a020)'}}>
        {t.init}
      </div>
    )
  }

  return(
    <>
      <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block border-2 rounded-full px-6 py-1.5 text-xs font-black uppercase tracking-widest mb-4"
            style={{borderColor:'#54B435',color:'#54B435'}}>
            TESTIMONIALS
          </div>
          <h2 className="font-black text-gray-900" style={{fontSize:'clamp(2rem,3.5vw,3rem)'}}>Our Stories</h2>
          <p className="text-gray-500 mt-2 text-sm">Hear what our community says about Kidland School</p>
        </div>

        {/* 3 Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTI.map((t,i)=>(
            <motion.div key={i}
              initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.1}}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Stars + quote icon */}
              <div className="flex items-start justify-between mb-4">
                <Stars n={t.stars}/>
                <FaQuoteRight size={24} style={{color:'#f0f4f0'}}/>
              </div>

              {/* Quote text (truncated) */}
              <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1 line-clamp-4">
                "{t.text}"
              </p>

              {/* Avatar row */}
              <div className="flex items-center gap-3 mb-5">
                <Avatar t={t}/>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.role}</div>
                </div>
              </div>

              {/* Read more */}
              <button
                onClick={()=>setActive(t)}
                className="text-sm font-semibold flex items-center gap-1 transition-colors"
                style={{color:'#54B435'}}
              >
                Read more <span className="text-base">→</span>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTI.map((_,i)=>(
            <button key={i} onClick={()=>setCur(i)} className="rounded-full transition-all"
              style={{width:i===cur?22:8,height:8,background:i===cur?'#54B435':'#ddd'}}/>
          ))}
        </div>
      </div>
    </section>

    {/* ── Modal — rendered via createPortal to escape stacking context ── */}
    {active && createPortal(
      <AnimatePresence>
        {active && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9998,backdropFilter:'blur(3px)'}}
              onClick={()=>setActive(null)}
            />

            {/* Modal panel */}
            <motion.div
              key="panel"
              initial={{opacity:0,scale:0.9,y:24}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.9,y:24}}
              transition={{type:'spring',stiffness:360,damping:30}}
              style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
              onClick={()=>setActive(null)}
            >
              <div
                style={{background:'#fff',borderRadius:'1rem',boxShadow:'0 25px 60px rgba(0,0,0,0.25)',width:'100%',maxWidth:'28rem',overflow:'hidden'}}
                onClick={e=>e.stopPropagation()}
              >
                {/* Header: avatar + name + close */}
                <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1.25rem',borderBottom:'1px solid #f3f4f6'}}>
                  <div style={{position:'relative',flexShrink:0}}>
                    {active.img ? (
                      <img src={active.img} alt={active.name}
                        style={{width:56,height:56,borderRadius:'50%',objectFit:'cover',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}/>
                    ) : (
                      <div style={{width:56,height:56,borderRadius:'50%',background:active.avatarColor||'linear-gradient(135deg,#54B435,#41a020)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:22,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
                        {active.init}
                      </div>
                    )}
                    <span style={{position:'absolute',bottom:0,right:0,width:14,height:14,background:'#22c55e',borderRadius:'50%',border:'2px solid #fff'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:900,color:'#111827',fontSize:16,lineHeight:1.2}}>{active.name}</div>
                    <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{active.subtitle || active.role}</div>
                  </div>
                  <button
                    onClick={()=>setActive(null)}
                    style={{width:32,height:32,borderRadius:'50%',background:'#f3f4f6',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280',flexShrink:0}}
                  >
                    <FaTimes size={13}/>
                  </button>
                </div>

                {/* Body */}
                <div style={{padding:'1.25rem'}}>
                  {/* Stars */}
                  <div style={{display:'flex',gap:4,marginBottom:16}}>
                    {Array.from({length:5}).map((_,j)=>(
                      <FaStar key={j} size={20} style={{color: j<active.stars ? '#f59e0b' : '#e5e7eb'}}/>
                    ))}
                  </div>
                  {/* Full quote */}
                  <p style={{color:'#374151',fontSize:14,lineHeight:1.75,margin:0}}>
                    "{active.fullText || active.text}"
                  </p>
                </div>

                {/* Footer: Like / Comment / Share */}
                <div style={{display:'flex',borderTop:'1px solid #f3f4f6'}}>
                  <button
                    onClick={()=>setLiked(l=>({...l,[active.name]:!l[active.name]}))}
                    style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 0',fontSize:14,fontWeight:600,border:'none',borderRight:'1px solid #f3f4f6',cursor:'pointer',background:liked[active.name]?'#f0fdf4':'#fff',color:liked[active.name]?'#16a34a':'#6b7280',transition:'all .2s'}}
                  >
                    <FaThumbsUp size={13}/> Like
                  </button>
                  <button
                    style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 0',fontSize:14,fontWeight:600,border:'none',borderRight:'1px solid #f3f4f6',cursor:'pointer',background:'#fff',color:'#6b7280'}}
                  >
                    <FaComment size={13}/> Comment
                  </button>
                  <button
                    onClick={()=>{
                      if(navigator.share){
                        navigator.share({title:'Kidland School Testimonial',text:active.fullText||active.text,url:window.location.href}).catch(()=>{})
                      } else {
                        navigator.clipboard?.writeText(window.location.href)
                      }
                    }}
                    style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 0',fontSize:14,fontWeight:600,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#e53935,#b71c1c)',color:'#fff',borderBottomRightRadius:16}}
                  >
                    <FaShareAlt size={13}/> Share
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}

/* ── Page ── */
export default function HomePage() {
  return (
    <>
      <Hero/>
      <AboutSection/>
      <StatsSection/>
      <WhySection/>
      <ProgramsSection/>
      <CTABanner/>
      <CampusGallery/>
      <AchieversSection/>
      <NoticesSection/>
      <TestimonialsSection/>
    </>
  )
}
