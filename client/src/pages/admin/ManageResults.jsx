import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  FaPlus, FaEdit, FaTrash, FaUpload, FaDownload,
  FaSearch, FaEye, FaEyeSlash, FaTimes, FaGraduationCap,
  FaSpinner, FaFileExcel, FaCheckCircle, FaExclamationTriangle,
  FaChild, FaBookReader, FaAward, FaTable,
} from 'react-icons/fa'
import api from '../../services/api'

/* ─────────────────────────────────────────
   CONSTANTS  (module-level, never re-created)
───────────────────────────────────────── */
const CLASSES = [
  'Playgroup','Infant','Toddler','Pre-School',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10',
]
const EXAM_TYPES = ['1st Terminal','2nd Terminal','3rd Terminal','1st Term','2nd Term','Mid Term','Final Term','Annual','SEE Mock','Unit Test']
const DIVISIONS   = ['Distinction','First Division','Second Division','Third Division','Fail']
const GRADE_LETTERS = ['A+','A','B+','B','C+','C','D+','D','E','N']
const BLOOD_GROUPS  = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const GRADE_TO_GP   = { 'A+':4.0,'A':3.6,'B+':3.2,'B':2.8,'C+':2.4,'C':2.0,'D+':1.6,'D':1.2,'E':0.8,'N':0.0 }

function generateYears() {
  const bs = new Date().getFullYear() + 57
  const y  = []
  for (let i = bs + 2; i >= bs - 10; i--) y.push(String(i))
  return y
}
const YEARS = generateYears()

/* ─────────────────────────────────────────
   CLASS TYPE HELPERS
───────────────────────────────────────── */
const PRE_PRIMARY_NAMES = ['Playgroup','Infant','Toddler','Pre-School','Nursery','LKG','UKG']
const isPrePrimaryClass = cls => PRE_PRIMARY_NAMES.includes(cls)
const isPrimaryClass    = cls => { const n=parseInt(String(cls).replace(/[^0-9]/g,'')); return n>=1&&n<=5 }
const isSecondaryClass  = cls => { const n=parseInt(String(cls).replace(/[^0-9]/g,'')); return n>=6&&n<=10 }

function getMarksheetType(cls) {
  if (isPrePrimaryClass(cls)) return 'preprimary'
  if (isPrimaryClass(cls))    return 'primary'
  if (isSecondaryClass(cls))  return 'secondary'
  return 'standard'
}

/* ─────────────────────────────────────────
   GRADE / GPA HELPERS
───────────────────────────────────────── */
function calcGrade(pct) {
  if (pct>=90) return {grade:'A+',gpa:4.0}
  if (pct>=80) return {grade:'A', gpa:3.6}
  if (pct>=70) return {grade:'B+',gpa:3.2}
  if (pct>=60) return {grade:'B', gpa:2.8}
  if (pct>=50) return {grade:'C+',gpa:2.4}
  if (pct>=40) return {grade:'C', gpa:2.0}
  if (pct>=35) return {grade:'D+',gpa:1.6}
  if (pct>=28) return {grade:'D', gpa:1.2}
  return           {grade:'NG',gpa:0.0}
}
function gpToGrade(gp) {
  const g=Number(gp)||0
  if(g>=3.8)return'A+'; if(g>=3.4)return'A'; if(g>=3.0)return'B+'; if(g>=2.6)return'B'
  if(g>=2.2)return'C+'; if(g>=1.8)return'C'; if(g>=1.4)return'D+'; if(g>=1.0)return'D'
  if(g>0)return'E'; return'N'
}
function computeTotals(subjects) {
  const valid=subjects.filter(s=>s.name?.trim())
  const fm=valid.reduce((a,s)=>a+(Number(s.fm)||0),0)
  const obt=valid.reduce((a,s)=>a+(Number(s.total)||0),0)
  const pct=fm>0?Math.round((obt/fm)*10000)/100:0
  const {grade,gpa}=calcGrade(pct)
  const anyFail=valid.some(s=>(Number(s.total)||0)<(Number(s.pm)||40))
  let division=''
  if(!anyFail&&pct>=28){if(pct>=75)division='Distinction';else if(pct>=60)division='First Division';else if(pct>=45)division='Second Division';else division='Third Division'}
  else division='Fail'
  return {totalMarks:fm,obtainedMarks:obt,percentage:pct,grade,gpa,division,passed:!anyFail&&pct>=28}
}
function computeSecondaryStats(subs) {
  const valid=subs.filter(s=>s.name?.trim()&&s.gradePoint!=='')
  if(!valid.length) return {averageGP:0,averageGrade:'N'}
  const avgGP=Math.round(valid.reduce((a,s)=>a+(Number(s.gradePoint)||0),0)/valid.length*1000)/1000
  return {averageGP:avgGP,averageGrade:gpToGrade(avgGP)}
}

/* ─────────────────────────────────────────
   DEFAULT DATA PER CLASS
───────────────────────────────────────── */
const PREPRIMARY_SUBJECTS = {
  'Playgroup': [{name:'English',assessment:'',achievementLevel:''},{name:'Nepali',assessment:'',achievementLevel:''},{name:'Maths',assessment:'',achievementLevel:''},{name:'Drawing',assessment:'',achievementLevel:''}],
  'Infant':    [{name:'English',assessment:'',achievementLevel:''},{name:'Nepali',assessment:'',achievementLevel:''},{name:'Maths',assessment:'',achievementLevel:''},{name:'Drawing',assessment:'',achievementLevel:''},{name:'G.K.',assessment:'',achievementLevel:''}],
  'Toddler':   [{name:'English',assessment:'',achievementLevel:''},{name:'Nepali',assessment:'',achievementLevel:''},{name:'Maths',assessment:'',achievementLevel:''},{name:'G.K.',assessment:'',achievementLevel:''},{name:'Drawing',assessment:'',achievementLevel:''}],
  'Pre-School':[{name:'English',assessment:'',achievementLevel:''},{name:'Nepali',assessment:'',achievementLevel:''},{name:'Maths',assessment:'',achievementLevel:''},{name:'Science',assessment:'',achievementLevel:''},{name:'G.K.',assessment:'',achievementLevel:''},{name:'Drawing',assessment:'',achievementLevel:''}],
}
const PRIMARY_SUBJECTS_DEFAULT = [
  {name:'English', assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'Nepali',  assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'Maths',   assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'Science', assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'Samajik', assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'HP & CA', assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
  {name:'Computer',assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''},
]
const DEFAULT_ECA = {dance:'',danceDisc:'',music:'',musicDisc:'',karate:'',karateDisc:'',handwriting:'',handwritingDisc:'',creativity:'',creativityDisc:''}
const DEFAULT_SECONDARY_SUBJECTS = [
  {name:'English',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Nepali',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Math',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Science',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Social Stds.',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'HP & CA',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Computer',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
  {name:'Optional',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''},
]
const DEFAULT_STANDARD_SUBJECTS = [
  {name:'Nepali',fm:100,pm:40,th:'',pr:'',total:0},
  {name:'English',fm:100,pm:40,th:'',pr:'',total:0},
  {name:'Mathematics',fm:100,pm:40,th:'',pr:'',total:0},
  {name:'Science',fm:100,pm:40,th:'',pr:'',total:0},
  {name:'Social Studies',fm:100,pm:40,th:'',pr:'',total:0},
  {name:'Health & PE',fm:50,pm:20,th:'',pr:'',total:0},
  {name:'Computer',fm:50,pm:20,th:'',pr:'',total:0},
]

function getDefaultSubjects(cls) {
  const type=getMarksheetType(cls)
  if(type==='secondary')  return DEFAULT_SECONDARY_SUBJECTS.map(s=>({...s}))
  if(type==='primary')    return PRIMARY_SUBJECTS_DEFAULT.map(s=>({...s}))
  if(type==='preprimary') return (PREPRIMARY_SUBJECTS[cls]||PREPRIMARY_SUBJECTS['Infant']).map(s=>({...s}))
  return DEFAULT_STANDARD_SUBJECTS.map(s=>({...s}))
}

const makeBlankForm = (cls='Grade 7') => ({
  studentName:'', parentPhone:'', section:'A', rollNo:'', symbolNo:'',
  academicYear:'2083', class:cls, examType:'1st Terminal',
  rank:'', remarks:'', isPublished:true,
  subjects:getDefaultSubjects(cls),
  attendance:{schoolDays:'',presentDays:''},
  activities:[{topic:'Eng. Hand',grade:''},{topic:'Nep. Hand',grade:''},{topic:'ECA',grade:''},{topic:'Discipline',grade:''},{topic:'Neatness',grade:''},{topic:'Drawing',grade:''}],
  teacherComment:'', dateOfIssue:'',
  eca:{...DEFAULT_ECA},
  studentAge:'', studentBloodGroup:'', studentHeight:'', studentWeight:'',
  montessoriTotal:'', extraTotal:'',
})

/* ─────────────────────────────────────────
   MULTI-TEMPLATE CSV DOWNLOAD & PARSE HELPERS
───────────────────────────────────────── */
function downloadSpecificTemplate(type = 'standard') {
  const year = '2083'
  const esc = v => {
    const s = String(v ?? '')
    if (/^\d{7,}$/.test(s)) return `"'${s}"`
    if (s.includes(',')) return `"${s}"`
    return s
  }

  let H = []
  let sample = []
  let filename = ''

  if (type === 'preprimary') {
    filename = `kidland_preprimary_result_template_${year}.csv`
    H = [
      'studentName','parentPhone','class','examType','academicYear','section','rollNo','symbolNo',
      'studentAge','studentHeight','studentWeight','schoolDays','presentDays','montessoriTotal','extraTotal','remarks','isPublished',
      'sub1_name','sub1_assessment','sub1_achievementLevel',
      'sub2_name','sub2_assessment','sub2_achievementLevel',
      'sub3_name','sub3_assessment','sub3_achievementLevel',
      'sub4_name','sub4_assessment','sub4_achievementLevel',
      'sub5_name','sub5_assessment','sub5_achievementLevel'
    ]
    sample = [
      'Aaditya Shrestha','9812345678','Infant','1st Terminal',year,'A','1','S001',
      '4 yrs','98','14','60','55','22','21','Good progress','true',
      'English','42','4','Nepali','38','3','Mathematics','45','4','Oral','40','3','G.K.','35','3'
    ]
  } else if (type === 'primary') {
    filename = `kidland_primary_class_1_5_result_template_${year}.csv`
    H = [
      'studentName','parentPhone','class','examType','academicYear','section','rollNo','symbolNo',
      'studentAge','studentBloodGroup','studentHeight','studentWeight','schoolDays','presentDays',
      'dance','danceDisc','music','musicDisc','karate','karateDisc','handwriting','handwritingDisc','creativity','creativityDisc',
      'remarks','isPublished',
      'sub1_name','sub1_assessment','sub1_cwHw','sub1_subAttendance','sub1_projectWork','sub1_reading','sub1_learningAchievement',
      'sub2_name','sub2_assessment','sub2_cwHw','sub2_subAttendance','sub2_projectWork','sub2_reading','sub2_learningAchievement',
      'sub3_name','sub3_assessment','sub3_cwHw','sub3_subAttendance','sub3_projectWork','sub3_reading','sub3_learningAchievement',
      'sub4_name','sub4_assessment','sub4_cwHw','sub4_subAttendance','sub4_projectWork','sub4_reading','sub4_learningAchievement',
      'sub5_name','sub5_assessment','sub5_cwHw','sub5_subAttendance','sub5_projectWork','sub5_reading','sub5_learningAchievement'
    ]
    sample = [
      'Bishal Thapa','9823456789','Grade 3','1st Terminal',year,'A','2','S002',
      '8 yrs','O+','125','24','65','58',
      '3','2','3','2','2','2','3','2','3','2',
      'Excellent effort','true',
      'English','45','5','4','4','5','4',
      'Nepali','42','5','4','4','4','4',
      'Maths','48','6','4','5','5','5',
      'Science','40','5','4','4','4','4',
      'Samajik','43','5','4','4','4','4'
    ]
  } else if (type === 'secondary') {
    filename = `kidland_secondary_grade_6_10_progress_report_template_${year}.csv`
    H = [
      'studentName','parentPhone','class','examType','academicYear','section','rollNo','symbolNo',
      'schoolDays','presentDays','teacherComment','dateOfIssue','remarks','isPublished',
      'engHandGrade','nepHandGrade','ecaGrade','disciplineGrade','neatnessGrade','drawingGrade',
      'sub1_name','sub1_theoryGrade','sub1_examGrade',
      'sub2_name','sub2_theoryGrade','sub2_examGrade',
      'sub3_name','sub3_theoryGrade','sub3_examGrade',
      'sub4_name','sub4_theoryGrade','sub4_examGrade',
      'sub5_name','sub5_theoryGrade','sub5_examGrade',
      'sub6_name','sub6_theoryGrade','sub6_examGrade',
      'sub7_name','sub7_theoryGrade','sub7_examGrade',
      'sub8_name','sub8_theoryGrade','sub8_examGrade'
    ]
    sample = [
      'Rohan Shrestha','9841234567','Grade 7','1st Terminal',year,'A','5','S105',
      '65','60','Keep up the good work','2083/4/16','Satisfactory','true',
      'A','A+','A','A','A+','A',
      'English','A','A+','Nepali','B+','A','Math','A+','A+','Science','A','A','Social Stds.','B+','A','HP & CA','A','A+','Computer','A+','A+','Optional','A','A'
    ]
  } else {
    filename = `kidland_standard_marksheet_template_${year}.csv`
    H = [
      'studentName','parentPhone','class','examType','academicYear','section','rollNo','symbolNo','rank','remarks','isPublished',
      'sub1_name','sub1_fm','sub1_pm','sub1_th','sub1_pr',
      'sub2_name','sub2_fm','sub2_pm','sub2_th','sub2_pr',
      'sub3_name','sub3_fm','sub3_pm','sub3_th','sub3_pr',
      'sub4_name','sub4_fm','sub4_pm','sub4_th','sub4_pr',
      'sub5_name','sub5_fm','sub5_pm','sub5_th','sub5_pr',
      'sub6_name','sub6_fm','sub6_pm','sub6_th','sub6_pr',
      'sub7_name','sub7_fm','sub7_pm','sub7_th','sub7_pr'
    ]
    sample = [
      'Sita KC','9851234567','Grade 10','1st Terminal',year,'A','3','S201','1','Top in class','true',
      'Nepali','100','40','75','0','English','100','40','82','0','Mathematics','100','40','90','0','Science','100','40','85','0','Social Studies','100','40','78','0','Health & PE','50','20','40','0','Computer','50','20','45','0'
    ]
  }

  const rows = [H.join(','), sample.map(esc).join(',')]
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  toast.success(`✅ Downloaded ${type.toUpperCase()} template!`)
}

function parseCSVLine(line) {
  const r=[];let cur='',inQ=false
  for(const ch of line){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){r.push(cur.trim());cur=''}else cur+=ch}
  r.push(cur.trim());return r
}

function parseCSVImport(txt) {
  if(!txt)return[]
  const lines=txt.split(/\r?\n/).filter(l=>l.trim()&&!l.trim().startsWith('#'))
  if(lines.length<2)return[]

  const hdrs=parseCSVLine(lines[0]).map(h=>h.replace(/\*/g,'').trim())
  const rows=[]

  for(const line of lines.slice(1)){
    if(!line.trim())continue
    const vals=parseCSVLine(line)
    const row={}
    hdrs.forEach((h,i)=>{let v=(vals[i]||'').trim();if(v.startsWith("'"))v=v.slice(1);row[h]=v})
    if(!row.studentName||!row.parentPhone)continue

    const cls = row.class || 'Grade 10'
    const inferredType = getMarksheetType(cls)
    
    // Auto detect template tier by headers or class
    let marksheetType = inferredType
    if (hdrs.includes('sub1_achievementLevel') || hdrs.includes('montessoriTotal')) {
      marksheetType = 'preprimary'
    } else if (hdrs.includes('sub1_cwHw') || hdrs.includes('sub1_learningAchievement') || hdrs.includes('dance')) {
      marksheetType = 'primary'
    } else if (hdrs.includes('sub1_theoryGrade') || hdrs.includes('engHandGrade')) {
      marksheetType = 'secondary'
    } else if (hdrs.includes('sub1_th') || hdrs.includes('sub1_fm')) {
      marksheetType = 'standard'
    }

    const item = {
      studentName: row.studentName.trim(),
      parentPhone: row.parentPhone.trim(),
      class: cls,
      examType: row.examType || '1st Terminal',
      academicYear: row.academicYear || '2083',
      section: row.section || 'A',
      rollNo: row.rollNo || '',
      symbolNo: row.symbolNo || '',
      rank: Number(row.rank) || 0,
      remarks: row.remarks || '',
      isPublished: row.isPublished === 'true' || row.isPublished === '1',
      marksheetType,
      studentAge: row.studentAge || '',
      studentBloodGroup: row.studentBloodGroup || '',
      studentHeight: row.studentHeight || '',
      studentWeight: row.studentWeight || '',
      teacherComment: row.teacherComment || '',
      dateOfIssue: row.dateOfIssue || '',
      montessoriTotal: Number(row.montessoriTotal) || 0,
      extraTotal: Number(row.extraTotal) || 0,
      attendance: {
        schoolDays: Number(row.schoolDays) || 0,
        presentDays: Number(row.presentDays) || 0,
        absentDays: Math.max(0, (Number(row.schoolDays) || 0) - (Number(row.presentDays) || 0)),
      },
    }

    const subs = []

    if (marksheetType === 'preprimary') {
      for (let i = 1; i <= 10; i++) {
        const name = row[`sub${i}_name`]
        if (!name?.trim()) continue
        subs.push({
          name: name.trim(),
          assessment: Number(row[`sub${i}_assessment`]) || 0,
          achievementLevel: Number(row[`sub${i}_achievementLevel`]) || 0,
        })
      }
    } else if (marksheetType === 'primary') {
      for (let i = 1; i <= 10; i++) {
        const name = row[`sub${i}_name`]
        if (!name?.trim()) continue
        const assessment = Number(row[`sub${i}_assessment`]) || 0
        const cwHw = Number(row[`sub${i}_cwHw`]) || 0
        const subAttendance = Number(row[`sub${i}_subAttendance`]) || 0
        const projectWork = Number(row[`sub${i}_projectWork`]) || 0
        const reading = Number(row[`sub${i}_reading`]) || 0
        const learningAchievement = Number(row[`sub${i}_learningAchievement`]) || 0
        const assignmentTotal = cwHw + subAttendance + projectWork + reading + learningAchievement
        const subjectTotal = assessment + assignmentTotal
        subs.push({
          name: name.trim(),
          assessment, cwHw, subAttendance, projectWork, reading, learningAchievement,
          assignmentTotal, subjectTotal
        })
      }
      const dance = Number(row.dance) || 0
      const danceDisc = Number(row.danceDisc) || 0
      const music = Number(row.music) || 0
      const musicDisc = Number(row.musicDisc) || 0
      const karate = Number(row.karate) || 0
      const karateDisc = Number(row.karateDisc) || 0
      const handwriting = Number(row.handwriting) || 0
      const handwritingDisc = Number(row.handwritingDisc) || 0
      const creativity = Number(row.creativity) || 0
      const creativityDisc = Number(row.creativityDisc) || 0
      const ecaTotal = dance + danceDisc + music + musicDisc + karate + karateDisc + handwriting + handwritingDisc + creativity + creativityDisc
      item.eca = { dance, danceDisc, music, musicDisc, karate, karateDisc, handwriting, handwritingDisc, creativity, creativityDisc, ecaTotal }
    } else if (marksheetType === 'secondary') {
      for (let i = 1; i <= 10; i++) {
        const name = row[`sub${i}_name`]
        if (!name?.trim()) continue
        const thG = row[`sub${i}_theoryGrade`] || ''
        const exG = row[`sub${i}_examGrade`] || ''
        const thGP = GRADE_TO_GP[thG] ?? 0
        const exGP = GRADE_TO_GP[exG] ?? 0
        const avgGP = (thGP + exGP) / 2
        subs.push({
          name: name.trim(),
          theoryGrade: thG,
          examGrade: exG,
          finalGrade: gpToGrade(avgGP),
          gradePoint: Math.round(avgGP * 100) / 100
        })
      }
      item.activities = [
        { topic: 'Eng. Hand', grade: row.engHandGrade || '' },
        { topic: 'Nep. Hand', grade: row.nepHandGrade || '' },
        { topic: 'ECA', grade: row.ecaGrade || '' },
        { topic: 'Discipline', grade: row.disciplineGrade || '' },
        { topic: 'Neatness', grade: row.neatnessGrade || '' },
        { topic: 'Drawing', grade: row.drawingGrade || '' },
      ]
      const { averageGP, averageGrade } = computeSecondaryStats(subs)
      item.averageGP = averageGP
      item.averageGrade = averageGrade
    } else {
      // standard
      for (let i = 1; i <= 10; i++) {
        const name = row[`sub${i}_name`]
        if (!name?.trim()) continue
        const th = Number(row[`sub${i}_th`]) || 0
        const pr = Number(row[`sub${i}_pr`]) || 0
        subs.push({
          name: name.trim(),
          fm: Number(row[`sub${i}_fm`]) || 100,
          pm: Number(row[`sub${i}_pm`]) || 40,
          th, pr, total: th + pr
        })
      }
    }

    item.subjects = subs
    rows.push(item)
  }
  return rows
}

function toExportCSV(items) {
  const esc=v=>{const s=String(v??'');return s.includes(',')?`"${s}"`:s}
  const H=['studentName','class','section','rollNo','symbolNo','parentPhone','examType','academicYear','marksheetType','obtainedMarks','totalMarks','percentage','grade','gpa','division','rank','isPublished','remarks']
  const subH=[];for(let i=1;i<=10;i++)subH.push(`sub${i}_name`,`sub${i}_total`,`sub${i}_grade`,`sub${i}_gpa`)
  const allH=[...H,...subH]
  const rows=items.map(r=>{
    const base=H.map(h=>esc(r[h]))
    const subs=[]
    for(let i=0;i<10;i++){
      const totalVal = s?.total ?? s?.subjectTotal ?? (s?.assessment || '')
      const gradeVal = s?.grade ?? s?.finalGrade ?? (s?.achievementLevel || '')
      const gpaVal   = s?.gpa   ?? (s?.gradePoint || '')
      subs.push(esc(s?.name||''), esc(totalVal), esc(gradeVal), esc(gpaVal))
    }
    return[...base,...subs].join(',')
  })
  return[allH.join(','),...rows].join('\r\n')
}

/* ══════════════════════════════════════════════════════════════
   MODULE-LEVEL SUB-COMPONENTS & INPUTS
══════════════════════════════════════════════════════════════ */
const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] focus:ring-2 focus:ring-[#54B43520] placeholder-gray-400'
const selectCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435]'
const smallInputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-[#54B435] bg-white dark:bg-gray-800 text-gray-800 dark:text-white'

function AcademicYearInput({ value, onChange, placeholder = 'Type or select year e.g. 2083', className = inputCls, datalistId = 'academic-year-list' }) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        list={datalistId}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      <datalist id={datalistId}>
        {YEARS.map(y => (
          <option key={y} value={y} />
        ))}
      </datalist>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">{title}</h3>
      {subtitle&&<p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

/* ── Standard subject row ── */
function SubjectRow({ sub, idx, onChange, onRemove }) {
  const th=Number(sub.th)||0, pr=Number(sub.pr)||0, total=th+pr
  const fm=Number(sub.fm)||100, pm=Number(sub.pm)||40
  const pct=fm>0?(total/fm)*100:0
  const {grade,gpa}=calcGrade(pct)
  const passed=total>=pm
  const nc='w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] text-center'
  return (
    <tr className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 transition-colors">
      <td className="px-2 py-1.5">
        <input type="text" value={sub.name} onChange={e=>onChange(idx,'name',e.target.value)} placeholder="Subject name"
          className="w-full min-w-[120px] border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] placeholder-gray-400"/>
      </td>
      <td className="px-1.5 py-1.5"><input type="number" value={sub.fm} onChange={e=>onChange(idx,'fm',e.target.value)} min="0" className={nc}/></td>
      <td className="px-1.5 py-1.5"><input type="number" value={sub.pm} onChange={e=>onChange(idx,'pm',e.target.value)} min="0" className={nc}/></td>
      <td className="px-1.5 py-1.5"><input type="number" value={sub.th} onChange={e=>onChange(idx,'th',e.target.value)} min="0" placeholder="0" className={nc}/></td>
      <td className="px-1.5 py-1.5"><input type="number" value={sub.pr} onChange={e=>onChange(idx,'pr',e.target.value)} min="0" placeholder="0" className={nc}/></td>
      <td className="px-2 py-1.5 text-center"><span className={`font-bold text-sm ${passed?'text-green-600':'text-red-500'}`}>{total}</span></td>
      <td className="px-2 py-1.5 text-center"><span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">{sub.name.trim()?grade:'—'}</span></td>
      <td className="px-2 py-1.5 text-center text-xs text-gray-500 font-mono">{sub.name.trim()?gpa.toFixed(1):'—'}</td>
      <td className="px-2 py-1.5"><button type="button" onClick={()=>onRemove(idx)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100"><FaTimes size={9}/></button></td>
    </tr>
  )
}

function markToGrade(marks, fm = 100) {
  if (marks === '' || marks === null || marks === undefined) return ''
  const m = Number(marks)
  if (isNaN(m)) return ''
  const pct = fm > 0 ? (m / fm) * 100 : 0
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C+'
  if (pct >= 40) return 'C'
  if (pct >= 35) return 'D+'
  if (pct >= 28) return 'D'
  if (pct > 0)  return 'E'
  return 'N'
}

/* ── Secondary subject row (Grade 6-10) ── */
function SecondarySubjectRow({ sub, idx, onChange, onRemove }) {
  const sel='w-full border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435]'
  const numInput='w-full border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1.5 text-sm text-center text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] placeholder-gray-300'

  const updateGradesAndGP = (thG, exG, newThVal, newPrVal) => {
    const thGP = GRADE_TO_GP[thG] ?? 0
    const exGP = GRADE_TO_GP[exG] ?? 0
    const hasTh = Boolean(thG)
    const hasEx = Boolean(exG)
    const count = (hasTh ? 1 : 0) + (hasEx ? 1 : 0)
    const avgGP = count > 0 ? ((hasTh ? thGP : 0) + (hasEx ? exGP : 0)) / count : 0
    const finalG = count > 0 ? gpToGrade(avgGP) : ''
    const gpVal = count > 0 ? Math.round(avgGP * 100) / 100 : ''

    if (newThVal !== undefined) onChange(idx, 'th', newThVal)
    if (newPrVal !== undefined) onChange(idx, 'pr', newPrVal)
    onChange(idx, 'theoryGrade', thG)
    onChange(idx, 'examGrade', exG)
    onChange(idx, 'finalGrade', finalG)
    onChange(idx, 'gradePoint', gpVal)
  }

  const handleTheoryMarksChange = (val) => {
    const autoGrade = val !== '' ? markToGrade(val, 75) : sub.theoryGrade
    updateGradesAndGP(autoGrade, sub.examGrade || '', val, undefined)
  }

  const handleExamMarksChange = (val) => {
    const autoGrade = val !== '' ? markToGrade(val, 25) : sub.examGrade
    updateGradesAndGP(sub.theoryGrade || '', autoGrade, undefined, val)
  }

  const handleTheoryGradeChange = (val) => {
    updateGradesAndGP(val, sub.examGrade || '', undefined, undefined)
  }

  const handleExamGradeChange = (val) => {
    updateGradesAndGP(sub.theoryGrade || '', val, undefined, undefined)
  }

  return (
    <tr className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 transition-colors">
      <td className="px-2 py-1.5 text-xs text-gray-400 text-center">{idx+1}</td>
      <td className="px-2 py-1.5">
        <input type="text" value={sub.name} onChange={e=>onChange(idx,'name',e.target.value)} placeholder="Subject name"
          className="w-full min-w-[110px] border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] placeholder-gray-400"/>
      </td>
      <td className="px-1.5 py-1.5">
        <input type="number" value={sub.th ?? ''} onChange={e=>handleTheoryMarksChange(e.target.value)} placeholder="Theory" min="0" max="100" className={numInput}/>
      </td>
      <td className="px-1.5 py-1.5">
        <select value={sub.theoryGrade||''} onChange={e=>handleTheoryGradeChange(e.target.value)} className={sel}>
          <option value="">—</option>
          {GRADE_LETTERS.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </td>
      <td className="px-1.5 py-1.5">
        <input type="number" value={sub.pr ?? ''} onChange={e=>handleExamMarksChange(e.target.value)} placeholder="Practical" min="0" max="100" className={numInput}/>
      </td>
      <td className="px-1.5 py-1.5">
        <select value={sub.examGrade||''} onChange={e=>handleExamGradeChange(e.target.value)} className={sel}>
          <option value="">—</option>
          {GRADE_LETTERS.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5 text-center">
        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:sub.finalGrade?'#f0fde8':'#f3f4f6',color:sub.finalGrade?'#166534':'#9ca3af'}}>
          {sub.finalGrade||'—'}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-sm font-mono font-bold text-gray-700">
        {sub.gradePoint!==''&&sub.gradePoint!==undefined?Number(sub.gradePoint).toFixed(2):'—'}
      </td>
      <td className="px-2 py-1.5 text-center">
        <button type="button" onClick={()=>onRemove(idx)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100"><FaTimes size={9}/></button>
      </td>
    </tr>
  )
}

/* ── Import preview ── */
function ImportPreview({ rows }) {
  if(!rows.length) return <div className="text-center py-8 text-gray-400"><FaExclamationTriangle size={24} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No valid rows detected.</p></div>
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-56">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 sticky top-0"><tr>{['#','Name','Class','Type','Exam','Year','Phone','Subjects'].map(h=><th key={h} className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-50">{rows.map((r,i)=>(
          <tr key={i} className="hover:bg-gray-50/60">
            <td className="px-3 py-2 text-gray-400">{i+1}</td>
            <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{r.studentName}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.class}</td>
            <td className="px-3 py-2 text-gray-500 font-bold uppercase text-[10px]">{r.marksheetType||'standard'}</td>
            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.examType}</td>
            <td className="px-3 py-2 text-gray-500">{r.academicYear}</td>
            <td className="px-3 py-2 font-mono text-gray-500">{r.parentPhone}</td>
            <td className="px-3 py-2 text-gray-500">{r.subjects?.length||0} subjects</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STUDENT INFO GRID — receives props (not closure)
══════════════════════════════════════════════════════════════ */
function StudentInfoGrid({ form, onFieldChange, onClassChange, showBloodGroup }) {
  return (
    <div>
      <SectionHeader title="Student Information"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Student Name *</label>
          <input type="text" value={form.studentName} onChange={e=>onFieldChange('studentName',e.target.value)} placeholder="Full student name" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Parent Phone *</label>
          <input type="tel" value={form.parentPhone} onChange={e=>onFieldChange('parentPhone',e.target.value)} placeholder="98XXXXXXXX" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Section</label>
          <input type="text" value={form.section} onChange={e=>onFieldChange('section',e.target.value)} placeholder="A" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Roll No</label>
          <input type="text" value={form.rollNo} onChange={e=>onFieldChange('rollNo',e.target.value)} placeholder="e.g. 12" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Symbol No</label>
          <input type="text" value={form.symbolNo} onChange={e=>onFieldChange('symbolNo',e.target.value)} placeholder="e.g. S001" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Age</label>
          <input type="text" value={form.studentAge} onChange={e=>onFieldChange('studentAge',e.target.value)} placeholder="e.g. 7 years" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Height (cm)</label>
          <input type="text" value={form.studentHeight} onChange={e=>onFieldChange('studentHeight',e.target.value)} placeholder="e.g. 120" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Weight (kg)</label>
          <input type="text" value={form.studentWeight} onChange={e=>onFieldChange('studentWeight',e.target.value)} placeholder="e.g. 22" autoComplete="off" className={inputCls}/>
        </div>
        {showBloodGroup&&(
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Blood Group</label>
            <select value={form.studentBloodGroup} onChange={e=>onFieldChange('studentBloodGroup',e.target.value)} className={selectCls}>
              <option value="">— Select —</option>
              {BLOOD_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Class</label>
          <select value={form.class} onChange={e=>onClassChange(e.target.value)} className={selectCls}>
            {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Exam Type</label>
          <select value={form.examType} onChange={e=>onFieldChange('examType',e.target.value)} className={selectCls}>
            {EXAM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Academic Year (Type or Select)</label>
          <AcademicYearInput value={form.academicYear} onChange={v=>onFieldChange('academicYear',v)} datalistId="form-academic-years"/>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ATTENDANCE SECTION
══════════════════════════════════════════════════════════════ */
function AttendanceSection({ form, onAttendanceChange }) {
  const absentDays = Math.max(0,(Number(form.attendance?.schoolDays)||0)-(Number(form.attendance?.presentDays)||0))
  return (
    <div>
      <SectionHeader title="Attendance"/>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total School Days</label>
          <input type="number" min="0" value={form.attendance?.schoolDays||''} onChange={e=>onAttendanceChange('schoolDays',e.target.value)} placeholder="e.g. 61" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Present Days</label>
          <input type="number" min="0" value={form.attendance?.presentDays||''} onChange={e=>onAttendanceChange('presentDays',e.target.value)} placeholder="e.g. 53" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Absent Days (Auto)</label>
          <div className="w-full border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-700 bg-gray-50">{absentDays}</div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PRE-PRIMARY FORM
══════════════════════════════════════════════════════════════ */
function PrePrimaryForm({ form, onFieldChange, onClassChange, onAttendanceChange, onPrePrimarySubjectChange, onAddSubject, onRemoveSubject }) {
  return (
    <>
      <StudentInfoGrid form={form} onFieldChange={onFieldChange} onClassChange={onClassChange} showBloodGroup={false}/>
      <AttendanceSection form={form} onAttendanceChange={onAttendanceChange}/>

      {form.subjects.length>0&&(
        <div>
          <SectionHeader title="Subject Scores"/>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full">
              <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
                {['S.N.','Subject','Assessment (50)','Achievement Level (0–4)',''].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white dark:bg-gray-900">
                {form.subjects.map((s,idx)=>(
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-xs text-gray-400 text-center">{idx+1}</td>
                    <td className="px-3 py-2 font-semibold text-gray-700">{s.name}</td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" max="50" value={s.assessment} onChange={e=>onPrePrimarySubjectChange(idx,'assessment',e.target.value)} placeholder="0–50"
                        className="w-full max-w-[80px] border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-[#54B435]"/>
                    </td>
                    <td className="px-3 py-2">
                      <select value={s.achievementLevel} onChange={e=>onPrePrimarySubjectChange(idx,'achievementLevel',e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#54B435] bg-white">
                        <option value="">—</option>
                        <option value="4">4 — Outstanding</option>
                        <option value="3">3 — Good</option>
                        <option value="2">2 — Needs Improvement</option>
                        <option value="1">1 — Requires Support</option>
                        <option value="0">0 — Not Achieved</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={()=>onRemoveSubject(idx)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100"><FaTimes size={9}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={onAddSubject} className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{background:'#54B435'}}>
            <FaPlus size={10}/> Add Subject
          </button>
        </div>
      )}

      <div>
        <SectionHeader title="Montessori & Extra Evaluation"/>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Montessori Evaluation (out of 25)</label>
            <input type="number" min="0" max="25" value={form.montessoriTotal||''} onChange={e=>onFieldChange('montessoriTotal',e.target.value)} placeholder="0–25" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Extra Evaluation (out of 25)</label>
            <input type="number" min="0" max="25" value={form.extraTotal||''} onChange={e=>onFieldChange('extraTotal',e.target.value)} placeholder="0–25" className={inputCls}/>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teacher&#39;s Remark</label>
        <input type="text" value={form.remarks||''} onChange={e=>onFieldChange('remarks',e.target.value)} placeholder="Optional remark" autoComplete="off" className={inputCls}/>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   PRIMARY FORM — Grade 1–5
══════════════════════════════════════════════════════════════ */
function PrimaryForm({ form, onFieldChange, onClassChange, onAttendanceChange, onPrimarySubjectChange, onAddSubject, onRemoveSubject, onEcaChange, ecaTotal }) {
  const e = form.eca || {}
  return (
    <>
      <StudentInfoGrid form={form} onFieldChange={onFieldChange} onClassChange={onClassChange} showBloodGroup={true}/>
      <AttendanceSection form={form} onAttendanceChange={onAttendanceChange}/>

      {/* Assessment + Assignments matrix */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Assessment (50) + Assignments (25)</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">CW/HW(6) + Attendance(4) + Project Works(5) + Reading(5) + Learning Achievement(5) = 25</p>
          </div>
          <button onClick={onAddSubject} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{background:'#54B435'}}>
            <FaPlus size={10}/> Add Row
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full" style={{minWidth:740}}>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-2 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{minWidth:110}}>Subject</th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Assess<br/><span className="text-gray-300">/50</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">CW/HW<br/><span className="text-gray-300">/6</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Attend<br/><span className="text-gray-300">/4</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Project<br/><span className="text-gray-300">/5</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Reading<br/><span className="text-gray-300">/5</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">L.Ach.<br/><span className="text-gray-300">/5</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Assign<br/><span className="text-gray-300">/25</span></th>
                <th className="px-2 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Total<br/><span className="text-gray-300">/75</span></th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {form.subjects.map((s,idx)=>{
                const asgn=(Number(s.cwHw)||0)+(Number(s.subAttendance)||0)+(Number(s.projectWork)||0)+(Number(s.reading)||0)+(Number(s.learningAchievement)||0)
                const total=(Number(s.assessment)||0)+asgn
                return (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50">
                    <td className="px-2 py-1.5">
                      <input type="text" value={s.name} onChange={e=>onPrimarySubjectChange(idx,'name',e.target.value)} placeholder="Subject"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#54B435] bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400"/>
                    </td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="50" value={s.assessment} onChange={e=>onPrimarySubjectChange(idx,'assessment',e.target.value)} className={smallInputCls}/></td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="6"  value={s.cwHw}       onChange={e=>onPrimarySubjectChange(idx,'cwHw',e.target.value)}       className={smallInputCls}/></td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="4"  value={s.subAttendance} onChange={e=>onPrimarySubjectChange(idx,'subAttendance',e.target.value)} className={smallInputCls}/></td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="5"  value={s.projectWork}   onChange={e=>onPrimarySubjectChange(idx,'projectWork',e.target.value)}   className={smallInputCls}/></td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="5"  value={s.reading}       onChange={e=>onPrimarySubjectChange(idx,'reading',e.target.value)}       className={smallInputCls}/></td>
                    <td className="px-1 py-1.5"><input type="number" min="0" max="5"  value={s.learningAchievement} onChange={e=>onPrimarySubjectChange(idx,'learningAchievement',e.target.value)} className={smallInputCls}/></td>
                    <td className="px-1 py-1.5 text-center"><span className={`text-xs font-bold ${asgn>25?'text-red-500':'text-gray-700'}`}>{asgn}<span className="text-gray-400">/25</span></span></td>
                    <td className="px-1 py-1.5 text-center"><span className="text-xs font-black text-green-600">{total}<span className="text-gray-400 font-normal">/75</span></span></td>
                    <td className="px-1 py-1.5"><button onClick={()=>onRemoveSubject(idx)} className="w-6 h-6 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100"><FaTimes size={9}/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ECA */}
      <div>
        <SectionHeader title={`Extra Curricular Activities — ECA (Total: ${ecaTotal}/25)`}/>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            {label:'Dance',      actK:'dance',      discK:'danceDisc',      actMax:3},
            {label:'Music',      actK:'music',      discK:'musicDisc',      actMax:3},
            {label:'Karate',     actK:'karate',     discK:'karateDisc',     actMax:3},
            {label:'Handwriting',actK:'handwriting',discK:'handwritingDisc',actMax:3},
            {label:'Creativity', actK:'creativity', discK:'creativityDisc', actMax:3},
          ].map(({label,actK,discK,actMax})=>{
            const act=Number(e[actK])||0, disc=Number(e[discK])||0
            return (
              <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2">
                <div className="text-xs font-black text-gray-600 uppercase tracking-wide">{label}</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-400 mb-1">Activity /{actMax}</div>
                    <input type="number" min="0" max={actMax} value={e[actK]||''} onChange={ev=>onEcaChange(actK,ev.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-[#54B435] bg-white"/>
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-400 mb-1">Disc /2</div>
                    <input type="number" min="0" max="2" value={e[discK]||''} onChange={ev=>onEcaChange(discK,ev.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-[#54B435] bg-white"/>
                  </div>
                </div>
                <div className="text-center text-xs font-black text-green-600">{act+disc}<span className="text-gray-400 font-normal">/5</span></div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
          <span className="text-sm font-bold text-green-800">ECA Total</span>
          <span className="font-black text-lg" style={{color:ecaTotal>25?'#ef4444':'#16a34a'}}>{ecaTotal}<span className="text-gray-500 text-sm font-normal"> / 25</span></span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teacher&#39;s Remark</label>
        <input type="text" value={form.remarks||''} onChange={e=>onFieldChange('remarks',e.target.value)} placeholder="Optional remark" autoComplete="off" className={inputCls}/>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   SECONDARY FORM — Grade 6-10
══════════════════════════════════════════════════════════════ */
function SecondaryForm({ form, onFieldChange, onClassChange, onAttendanceChange, onSecondarySubjectChange, onAddSubject, onRemoveSubject, onActivityChange, liveStats }) {
  return (
    <>
      <StudentInfoGrid form={form} onFieldChange={onFieldChange} onClassChange={onClassChange} showBloodGroup={false}/>

      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Subjects &amp; Grades (Progress Report Card)</h3>
          <button onClick={onAddSubject} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{background:'#54B435'}}><FaPlus size={10}/> Add Subject</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
              {['S.N.','Subject','Theory Marks','Theory Grade','Practical Marks','Practical Grade','Final Grade','Grade Point',''].map(h=>(
                <th key={h} className="px-2 py-2.5 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="bg-white dark:bg-gray-900">
              {form.subjects.map((s,idx)=><SecondarySubjectRow key={idx} sub={s} idx={idx} onChange={onSecondarySubjectChange} onRemove={onRemoveSubject}/>)}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[['Average Grade Point',liveStats.averageGP?.toFixed?.(3)||'—','#54B435'],['Average Grade',liveStats.averageGrade||'—','#2563eb']].map(([l,v,col])=>(
            <div key={l} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
              <div className="text-xs text-gray-400 mb-0.5">{l}</div>
              <div className="font-black text-lg" style={{color:col}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <AttendanceSection form={form} onAttendanceChange={onAttendanceChange}/>

      <div>
        <SectionHeader title="Additional Activities"/>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(form.activities||[]).map((act,i)=>(
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-28 shrink-0">{act.topic}</span>
              <select value={act.grade||''} onChange={e=>onActivityChange(i,'grade',e.target.value)}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:border-[#54B435]">
                <option value="">—</option>{GRADE_LETTERS.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teacher&#39;s Comment</label>
          <textarea value={form.teacherComment||''} onChange={e=>onFieldChange('teacherComment',e.target.value)} rows={3} placeholder="e.g. Your result is below average…"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-[#54B435] resize-none"/>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date of Issue (BS)</label>
            <input type="text" value={form.dateOfIssue||''} onChange={e=>onFieldChange('dateOfIssue',e.target.value)} placeholder="e.g. 2083/4/16" autoComplete="off" className={inputCls}/>
            <p className="text-xs text-gray-400 mt-1">Use BS date format: YYYY/M/D</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Remarks</label>
            <input type="text" value={form.remarks||''} onChange={e=>onFieldChange('remarks',e.target.value)} placeholder="Optional remark" autoComplete="off" className={inputCls}/>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   STANDARD FORM (fallback)
══════════════════════════════════════════════════════════════ */
function StandardForm({ form, onFieldChange, onClassChange, onSubjectChange, onAddSubject, onRemoveSubject, liveTotals }) {
  return (
    <>
      <div>
        <SectionHeader title="Student Information"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Student Name *</label>
            <input type="text" value={form.studentName} onChange={e=>onFieldChange('studentName',e.target.value)} placeholder="Full student name" autoComplete="off" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Parent Phone *</label>
            <input type="tel" value={form.parentPhone} onChange={e=>onFieldChange('parentPhone',e.target.value)} placeholder="98XXXXXXXX" autoComplete="off" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Section</label>
            <input type="text" value={form.section} onChange={e=>onFieldChange('section',e.target.value)} placeholder="A" autoComplete="off" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Roll No</label>
            <input type="text" value={form.rollNo} onChange={e=>onFieldChange('rollNo',e.target.value)} placeholder="e.g. 12" autoComplete="off" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Symbol No</label>
            <input type="text" value={form.symbolNo} onChange={e=>onFieldChange('symbolNo',e.target.value)} placeholder="e.g. S001" autoComplete="off" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Academic Year (Type or Select)</label>
            <AcademicYearInput value={form.academicYear} onChange={v=>onFieldChange('academicYear',v)} datalistId="form-std-academic-years"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Class</label>
            <select value={form.class} onChange={e=>onClassChange(e.target.value)} className={selectCls}>
              {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Exam Type</label>
            <select value={form.examType} onChange={e=>onFieldChange('examType',e.target.value)} className={selectCls}>
              {EXAM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Subjects &amp; Marks</h3>
          <button onClick={onAddSubject} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{background:'#54B435'}}><FaPlus size={10}/> Add Row</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
              {['Subject','FM','PM','Theory','Practical','Total','Grade','GPA',''].map(h=>(
                <th key={h} className="px-2 py-2.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="bg-white dark:bg-gray-900">
              {form.subjects.map((s,idx)=><SubjectRow key={idx} sub={s} idx={idx} onChange={onSubjectChange} onRemove={onRemoveSubject}/>)}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Obtained / Total',`${liveTotals.obtainedMarks} / ${liveTotals.totalMarks}`,'#54B435'],['Percentage',`${liveTotals.percentage}%`,liveTotals.percentage>=40?'#16a34a':'#ef4444'],['Grade / GPA',`${liveTotals.grade} / ${liveTotals.gpa?.toFixed?.(1)}`,'#2563eb'],['Division',liveTotals.division||'—',liveTotals.passed?'#16a34a':'#ef4444']].map(([l,v,col])=>(
            <div key={l} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
              <div className="text-xs text-gray-400 mb-0.5">{l}</div>
              <div className="font-black text-base" style={{color:col}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Override Division</label>
          <select value={form.division||''} onChange={e=>onFieldChange('division',e.target.value)} className={selectCls}>
            <option value="">Auto (from marks)</option>
            {DIVISIONS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Class Rank</label>
          <input type="number" value={form.rank||''} onChange={e=>onFieldChange('rank',e.target.value)} placeholder="e.g. 1" autoComplete="off" className={inputCls}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Remarks</label>
          <input type="text" value={form.remarks||''} onChange={e=>onFieldChange('remarks',e.target.value)} placeholder="Optional remark" autoComplete="off" className={inputCls}/>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const BADGE_COLOR = {preprimary:'#9333ea',primary:'#2563eb',secondary:'#0a3d6b',standard:'#54B435'}
const BADGE_LABEL = {preprimary:'Pre-Primary Report',primary:'Class 1–5 Report',secondary:'Progress Report Card (6–10)',standard:'Standard Marksheet'}

export default function ManageResults() {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filters,    setFilters]    = useState({class:'',examType:'',academicYear:'',search:''})
  const [modal,      setModal]      = useState(null)   // 'form' | 'view' | 'import' | 'template' | null
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(makeBlankForm())
  const [saving,     setSaving]     = useState(false)
  const [delId,      setDelId]      = useState(null)
  const [csvText,    setCsvText]    = useState('')
  const [importing,  setImporting]  = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importRes,  setImportRes]  = useState(null)
  const fileRef = useRef(null)

  const mType       = getMarksheetType(form.class)
  const isPrePrim   = mType==='preprimary'
  const isPrimary   = mType==='primary'
  const isSecondary = mType==='secondary'
  const isStandard  = mType==='standard'

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp=await api.get('/results',{params:{class:filters.class,examType:filters.examType,academicYear:filters.academicYear}})
      setItems(Array.isArray(resp?.data)?resp.data:Array.isArray(resp)?resp:[])
    } catch(e){console.error(e);toast.error('Failed to load results');setItems([])}
    setLoading(false)
  },[filters.class,filters.examType,filters.academicYear])

  useEffect(()=>{load()},[load])

  const visible = filters.search
    ? items.filter(it=>it.studentName?.toLowerCase().includes(filters.search.toLowerCase())||it.parentPhone?.includes(filters.search)||it.symbolNo?.toLowerCase().includes(filters.search.toLowerCase())||it.rollNo?.includes(filters.search))
    : items

  /* ── Stable field setter ── */
  const handleFieldChange = useCallback((key,val) => {
    setForm(prev=>({...prev,[key]:val}))
  },[])

  const handleAttendanceChange = useCallback((key,val)=>{
    setForm(prev=>({...prev,attendance:{...prev.attendance,[key]:val}}))
  },[])

  /* ── Class change ── */
  const handleClassChange = useCallback(val => {
    const t=getMarksheetType(val)
    setForm(prev=>({
      ...prev, class:val, subjects:getDefaultSubjects(val),
      ...(t==='secondary'?{activities:[{topic:'Eng. Hand',grade:''},{topic:'Nep. Hand',grade:''},{topic:'ECA',grade:''},{topic:'Discipline',grade:''},{topic:'Neatness',grade:''},{topic:'Drawing',grade:''}]}:{}),
      ...(t==='primary'?{eca:{...DEFAULT_ECA}}:{}),
    }))
  },[])

  /* ── Subject updaters ── */
  const handleSubjectChange = useCallback((idx,field,val)=>{
    setForm(prev=>{
      const subs=prev.subjects.map((s,i)=>{
        if(i!==idx)return s
        const upd={...s,[field]:val}
        const th=field==='th'?(Number(val)||0):(Number(s.th)||0)
        const pr=field==='pr'?(Number(val)||0):(Number(s.pr)||0)
        upd.total=th+pr; return upd
      })
      return{...prev,subjects:subs}
    })
  },[])

  const handleSecondarySubjectChange = useCallback((idx,field,val)=>{
    setForm(prev=>({...prev,subjects:prev.subjects.map((s,i)=>i===idx?{...s,[field]:val}:s)}))
  },[])

  const handlePrimarySubjectChange = useCallback((idx,field,val)=>{
    setForm(prev=>{
      const subs=prev.subjects.map((s,i)=>{
        if(i!==idx)return s
        const u={...s,[field]:val}
        const at=(Number(field==='cwHw'?val:u.cwHw)||0)+(Number(field==='subAttendance'?val:u.subAttendance)||0)+(Number(field==='projectWork'?val:u.projectWork)||0)+(Number(field==='reading'?val:u.reading)||0)+(Number(field==='learningAchievement'?val:u.learningAchievement)||0)
        u.assignmentTotal=at
        u.subjectTotal=(Number(field==='assessment'?val:u.assessment)||0)+at
        return u
      })
      return{...prev,subjects:subs}
    })
  },[])

  const handlePrePrimarySubjectChange = useCallback((idx,field,val)=>{
    setForm(prev=>({...prev,subjects:prev.subjects.map((s,i)=>i===idx?{...s,[field]:val}:s)}))
  },[])

  const handleAddSubject = useCallback(()=>{
    setForm(prev=>{
      const t=getMarksheetType(prev.class)
      let blank
      if(t==='preprimary')  blank={name:'',assessment:'',achievementLevel:''}
      else if(t==='primary')blank={name:'',assessment:'',cwHw:'',subAttendance:'',projectWork:'',reading:'',learningAchievement:''}
      else if(t==='secondary')blank={name:'',theoryGrade:'',examGrade:'',finalGrade:'',gradePoint:''}
      else blank={name:'',fm:100,pm:40,th:'',pr:'',total:0}
      return{...prev,subjects:[...prev.subjects,blank]}
    })
  },[])

  const handleRemoveSubject = useCallback(idx=>{
    setForm(prev=>({...prev,subjects:prev.subjects.filter((_,i)=>i!==idx)}))
  },[])

  const handleEcaChange = useCallback((field,val)=>{
    setForm(prev=>({...prev,eca:{...prev.eca,[field]:val}}))
  },[])

  const handleActivityChange = useCallback((idx,field,val)=>{
    setForm(prev=>({...prev,activities:prev.activities.map((a,i)=>i===idx?{...a,[field]:val}:a)}))
  },[])

  /* ── Modals ── */
  const openAdd = () => { setEditing(null); setForm(makeBlankForm()); setModal('form') }
  const openEdit = item => {
    setEditing(item)
    const subs=item.subjects?.length?item.subjects.map(s=>({...s})):getDefaultSubjects(item.class)
    setForm({
      ...makeBlankForm(item.class), ...item, subjects:subs,
      attendance:item.attendance||{schoolDays:'',presentDays:''},
      activities:item.activities?.length?item.activities:[{topic:'Eng. Hand',grade:''},{topic:'Nep. Hand',grade:''},{topic:'ECA',grade:''},{topic:'Discipline',grade:''},{topic:'Neatness',grade:''},{topic:'Drawing',grade:''}],
      eca:item.eca||{...DEFAULT_ECA},
      teacherComment:item.teacherComment||'', dateOfIssue:item.dateOfIssue||'',
      montessoriTotal:item.montessoriTotal??'', extraTotal:item.extraTotal??'',
      studentAge:item.studentAge||'', studentBloodGroup:item.studentBloodGroup||'',
      studentHeight:item.studentHeight||'', studentWeight:item.studentWeight||'',
    })
    setModal('form')
  }
  const openView = item => { setEditing(item); setModal('view') }

  /* ── Save ── */
  const handleSave = async () => {
    if(!form.studentName?.trim()){toast.error('Student name is required');return}
    if(!form.parentPhone?.trim()){toast.error('Parent phone is required');return}
    setSaving(true)
    try {
      const t=getMarksheetType(form.class)
      const filledSubs=(form.subjects||[]).filter(s=>s.name?.trim())
      const base={
        studentName:form.studentName.trim(), parentPhone:String(form.parentPhone).replace(/\D/g,'').replace(/^977/,''),
        class:form.class, examType:form.examType, section:form.section||'A',
        rollNo:form.rollNo||'', symbolNo:form.symbolNo||'', academicYear:form.academicYear||'2083',
        rank:Number(form.rank)||0, remarks:form.remarks||'', isPublished:!!form.isPublished,
        marksheetType:t,
      }
      let payload=base
      if(t==='preprimary'){
        payload={...base,studentAge:form.studentAge||'',studentHeight:form.studentHeight||'',studentWeight:form.studentWeight||'',
          attendance:{schoolDays:Number(form.attendance?.schoolDays)||0,presentDays:Number(form.attendance?.presentDays)||0,absentDays:Math.max(0,(Number(form.attendance?.schoolDays)||0)-(Number(form.attendance?.presentDays)||0))},
          subjects:filledSubs.map(s=>({name:s.name.trim(),assessment:Number(s.assessment)||0,achievementLevel:Number(s.achievementLevel)||0})),
          montessoriTotal:Number(form.montessoriTotal)||0,extraTotal:Number(form.extraTotal)||0}
      } else if(t==='primary'){
        const subData=filledSubs.map(s=>({name:s.name.trim(),assessment:Number(s.assessment)||0,cwHw:Number(s.cwHw)||0,subAttendance:Number(s.subAttendance)||0,projectWork:Number(s.projectWork)||0,reading:Number(s.reading)||0,learningAchievement:Number(s.learningAchievement)||0,assignmentTotal:(Number(s.cwHw)||0)+(Number(s.subAttendance)||0)+(Number(s.projectWork)||0)+(Number(s.reading)||0)+(Number(s.learningAchievement)||0),subjectTotal:(Number(s.assessment)||0)+(Number(s.cwHw)||0)+(Number(s.subAttendance)||0)+(Number(s.projectWork)||0)+(Number(s.reading)||0)+(Number(s.learningAchievement)||0)}))
        const ec=form.eca||{}
        const ecaTotal=(Number(ec.dance)||0)+(Number(ec.danceDisc)||0)+(Number(ec.music)||0)+(Number(ec.musicDisc)||0)+(Number(ec.karate)||0)+(Number(ec.karateDisc)||0)+(Number(ec.handwriting)||0)+(Number(ec.handwritingDisc)||0)+(Number(ec.creativity)||0)+(Number(ec.creativityDisc)||0)
        payload={...base,studentAge:form.studentAge||'',studentBloodGroup:form.studentBloodGroup||'',studentHeight:form.studentHeight||'',studentWeight:form.studentWeight||'',
          attendance:{schoolDays:Number(form.attendance?.schoolDays)||0,presentDays:Number(form.attendance?.presentDays)||0,absentDays:Math.max(0,(Number(form.attendance?.schoolDays)||0)-(Number(form.attendance?.presentDays)||0))},
          subjects:subData,eca:{...ec,ecaTotal}}
      } else if(t==='secondary'){
        const {averageGP,averageGrade}=computeSecondaryStats(filledSubs)
        payload={...base,
          subjects:filledSubs.map(s=>({name:s.name.trim(),theoryGrade:s.theoryGrade||'',examGrade:s.examGrade||'',finalGrade:s.finalGrade||'',gradePoint:Number(s.gradePoint)||0})),
          averageGP,averageGrade,
          attendance:{schoolDays:Number(form.attendance?.schoolDays)||0,presentDays:Number(form.attendance?.presentDays)||0,absentDays:Math.max(0,(Number(form.attendance?.schoolDays)||0)-(Number(form.attendance?.presentDays)||0))},
          activities:(form.activities||[]).filter(a=>a.topic),
          teacherComment:form.teacherComment||'',dateOfIssue:form.dateOfIssue||''}
      } else {
        if(!filledSubs.length){toast.error('Add at least one subject');setSaving(false);return}
        payload={...base,subjects:filledSubs.map(s=>({name:s.name.trim(),fm:Number(s.fm)||100,pm:Number(s.pm)||40,th:Number(s.th)||0,pr:Number(s.pr)||0,total:(Number(s.th)||0)+(Number(s.pr)||0)}))}
      }
      if(editing?._id){
        const resp=await api.put(`/results/${editing._id}`,payload)
        const saved=resp?.data||resp
        setItems(prev=>prev.map(it=>it._id===editing._id?(saved||{...it,...payload}):it))
        toast.success('✓ Result updated successfully')
      } else {
        const resp=await api.post('/results',payload)
        const saved=resp?.data||resp
        setItems(prev=>[saved||payload,...prev])
        toast.success('✓ Result added successfully')
      }
      setModal(null)
    } catch(e){
      const status=e?.response?.status
      const msg=e?.response?.data?.message||e?.data?.message||e?.message||'Failed to save'
      if(status===409)toast.error('⚠️ '+msg,{duration:6000}); else toast.error(msg,{duration:5000})
    } finally{setSaving(false)}
  }

  const handleDelete=async id=>{
    try{await api.delete(`/results/${id}`);setItems(prev=>prev.filter(it=>it._id!==id));toast.success('Result deleted')}
    catch(e){toast.error(e?.message||'Delete failed')}
    setDelId(null)
  }
  const togglePublish=async(id,pub)=>{
    try{await api.post('/results/toggle-publish',{ids:[id],isPublished:pub});setItems(prev=>prev.map(it=>it._id===id?{...it,isPublished:pub}:it));toast.success(pub?'✓ Published':'Hidden')}
    catch(e){toast.error(e?.message||'Failed')}
  }
  const handleExport=async()=>{
    try{
      const resp=await api.get('/results/export',{params:{class:filters.class,examType:filters.examType,academicYear:filters.academicYear}})
      const data=resp?.data||resp||[]
      const a=document.createElement('a')
      a.href=URL.createObjectURL(new Blob(['\uFEFF'+toExportCSV(Array.isArray(data)?data:[])],{type:'text/csv;charset=utf-8'}))
      a.download=`results-export-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      toast.success('✓ Export complete')
    } catch(e){toast.error(e?.message||'Export failed')}
  }

  const handleFileChange=e=>{
    const f=e.target.files?.[0]
    if(!f)return
    const r=new FileReader()
    r.onload=ev=>{
      const text=ev.target.result
      setCsvText(text)
      setImportRows(parseCSVImport(text))
      setImportRes(null)
      setModal('import')
    }
    r.readAsText(f,'UTF-8')
    e.target.value=''
  }

  const handleImport=async()=>{
    if(!importRows.length){toast.error('No valid rows');return}
    setImporting(true);setImportRes(null)
    try{
      const resp=await api.post('/results/bulk-import',{results:importRows})
      const msg=resp?.message||resp?.data?.message||`Imported ${importRows.length} results`
      const errors=resp?.errors||resp?.data?.errors||[]
      setImportRes({message:msg,errors})
      toast.success(msg)
      if(errors.length)errors.forEach(err=>toast.error(err,{duration:4000}))
      load()
    } catch(e){
      const msg=e?.message||'Import failed'
      setImportRes({message:msg,errors:[msg]})
      toast.error(msg)
    } finally{setImporting(false)}
  }

  const closeImport=()=>{setModal(null);setCsvText('');setImportRows([]);setImportRes(null)}

  /* ── Computed values for live stats ── */
  const liveTotals=computeTotals(form.subjects.filter(s=>s.name?.trim()))
  const liveSecondary=computeSecondaryStats(form.subjects.filter(s=>s.name?.trim()))
  const ec=form.eca||{}
  const liveEcaTotal=(Number(ec.dance)||0)+(Number(ec.danceDisc)||0)+(Number(ec.music)||0)+(Number(ec.musicDisc)||0)+(Number(ec.karate)||0)+(Number(ec.karateDisc)||0)+(Number(ec.handwriting)||0)+(Number(ec.handwritingDisc)||0)+(Number(ec.creativity)||0)+(Number(ec.creativityDisc)||0)

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Result Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add, edit, publish and export student results — Playgroup to Grade 10</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setModal('template')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:-translate-y-0.5" style={{borderColor:'#16a34a',color:'#16a34a'}}><FaFileExcel size={13}/> Class Templates</button>
          <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:-translate-y-0.5" style={{borderColor:'#54B435',color:'#54B435'}}><FaUpload size={12}/> Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange}/>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:-translate-y-0.5 transition-all"><FaDownload size={12}/> Export CSV</button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:-translate-y-0.5 transition-all shadow-lg" style={{background:'#54B435',boxShadow:'0 4px 14px rgba(84,180,53,0.35)'}}><FaPlus size={12}/> Add Result</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
            <FaSearch size={12} className="text-gray-400 shrink-0"/>
            <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} placeholder="Search name, phone, symbol, roll…" className="flex-1 text-sm outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400"/>
          </div>
          <select value={filters.class} onChange={e=>setFilters(f=>({...f,class:e.target.value}))} className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2.5 outline-none">
            <option value="">All Classes</option>{CLASSES.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.examType} onChange={e=>setFilters(f=>({...f,examType:e.target.value}))} className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2.5 outline-none">
            <option value="">All Exams</option>{EXAM_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          <div className="w-44">
            <AcademicYearInput value={filters.academicYear} onChange={v=>setFilters(f=>({...f,academicYear:v}))} placeholder="Filter Year (e.g. 2083)" datalistId="filter-academic-years"/>
          </div>
          <button onClick={load} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors">Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[['Total',visible.length,'#54B435'],['Published',visible.filter(r=>r.isPublished).length,'#2563eb'],['Unpublished',visible.filter(r=>!r.isPublished).length,'#d97706'],['Classes',new Set(visible.map(r=>r.class)).size,'#9333ea']].map(([l,n,col])=>(
          <div key={l} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="text-2xl font-black mb-0.5" style={{color:col}}>{n}</div>
            <div className="text-xs text-gray-400">{l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading?(
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2"><FaSpinner className="animate-spin text-[#54B435]" size={20}/><span>Loading…</span></div>
        ):visible.length===0?(
          <div className="flex flex-col items-center justify-center py-20 text-gray-400"><FaGraduationCap size={40} className="mb-3 opacity-20"/><p className="font-semibold">No results found</p></div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                <tr>{['Student','Class','Type','Exam','Year','Phone','Summary','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visible.map((r,i)=>(
                  <tr key={r._id||i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.class}{r.section?` - ${r.section}`:''}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:BADGE_COLOR[r.marksheetType]||BADGE_COLOR.standard}}>
                        {r.marksheetType||'standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r.examType}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.academicYear}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.parentPhone}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {r.marksheetType==='secondary'?`GP: ${r.averageGP?.toFixed?.(2)||'—'} / ${r.averageGrade||'—'}`:r.marksheetType==='primary'?`${r.subjects?.length||0} subjects`:`${r.obtainedMarks||'—'}/${r.totalMarks||'—'}`}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={()=>togglePublish(r._id,!r.isPublished)}
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
                        style={{background:r.isPublished?'#f0fde8':'#f9fafb',color:r.isPublished?'#16a34a':'#9ca3af'}}>
                        {r.isPublished?<><FaEye size={9}/>Published</>:<><FaEyeSlash size={9}/>Hidden</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={()=>openView(r)} title="View" className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"><FaEye size={11}/></button>
                        <button onClick={()=>openEdit(r)} title="Edit" className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100"><FaEdit size={11}/></button>
                        <button onClick={()=>setDelId(r._id)} title="Delete" className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100"><FaTrash size={11}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ TEMPLATE DOWNLOAD SELECTOR MODAL ══ */}
      {modal==='template'&&(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.65)'}}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-black text-gray-900 dark:text-white text-lg">Select Class Template to Download</h2>
                <p className="text-xs text-gray-400 mt-0.5">Download simple CSV template customized for your target grade/tier</p>
              </div>
              <button onClick={()=>setModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><FaTimes size={14}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { type:'preprimary', title:'Pre-Primary Template', desc:'Playgroup, Infant, Toddler, Pre-School (Assessment & Achievement Levels)', Icon:FaChild, col:'#9333ea', bg:'#f3e8ff' },
                { type:'primary', title:'Primary Template (1–5)', desc:'Class 1 to 5 (Assessment, CW/HW, Projects, ECA 25)', Icon:FaBookReader, col:'#2563eb', bg:'#dbeafe' },
                { type:'secondary', title:'Secondary Report Card (6–10)', desc:'Grade 6 to 10 Progress Report (Theory/Exam Grades, GP)', Icon:FaAward, col:'#0a3d6b', bg:'#e0f2fe' },
                { type:'standard', title:'Standard Marksheet', desc:'Generic numeric marks template (FM/PM/Theory/Practical)', Icon:FaTable, col:'#54B435', bg:'#f0fde8' },
              ].map(card=>(
                <div key={card.type} onClick={()=>{downloadSpecificTemplate(card.type);setModal(null)}}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-[#54B435] cursor-pointer transition-all hover:-translate-y-1 shadow-sm flex flex-col justify-between"
                  style={{background:card.bg}}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{background:card.col}}>
                      <card.Icon size={18}/>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-gray-900">{card.title}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{card.type}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{card.desc}</p>
                  <button className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2" style={{background:card.col}}>
                    <FaDownload size={11}/> Download CSV
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ══ */}
      {modal==='form'&&(
        <div className="fixed inset-0 z-[999] overflow-y-auto" style={{background:'rgba(0,0,0,0.65)'}}>
          <div className="flex min-h-full items-start justify-center p-4 pt-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl shadow-2xl" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="font-black text-gray-900 dark:text-white text-xl">{editing?'Edit Result':'Add New Result'}</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block text-white" style={{background:BADGE_COLOR[mType]}}>
                    {BADGE_LABEL[mType]}
                  </span>
                </div>
                <button onClick={()=>setModal(null)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200"><FaTimes size={15}/></button>
              </div>

              <div className="px-6 py-5 space-y-6 overflow-y-auto" style={{maxHeight:'80vh'}}>
                {isPrePrim&&(
                  <PrePrimaryForm
                    form={form}
                    onFieldChange={handleFieldChange}
                    onClassChange={handleClassChange}
                    onAttendanceChange={handleAttendanceChange}
                    onPrePrimarySubjectChange={handlePrePrimarySubjectChange}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                  />
                )}
                {isPrimary&&(
                  <PrimaryForm
                    form={form}
                    onFieldChange={handleFieldChange}
                    onClassChange={handleClassChange}
                    onAttendanceChange={handleAttendanceChange}
                    onPrimarySubjectChange={handlePrimarySubjectChange}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    onEcaChange={handleEcaChange}
                    ecaTotal={liveEcaTotal}
                  />
                )}
                {isSecondary&&(
                  <SecondaryForm
                    form={form}
                    onFieldChange={handleFieldChange}
                    onClassChange={handleClassChange}
                    onAttendanceChange={handleAttendanceChange}
                    onSecondarySubjectChange={handleSecondarySubjectChange}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    onActivityChange={handleActivityChange}
                    liveStats={liveSecondary}
                  />
                )}
                {isStandard&&(
                  <StandardForm
                    form={form}
                    onFieldChange={handleFieldChange}
                    onClassChange={handleClassChange}
                    onSubjectChange={handleSubjectChange}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    liveTotals={liveTotals}
                  />
                )}

                <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{background:'#f0fde8'}}>
                  <input type="checkbox" checked={!!form.isPublished} onChange={e=>handleFieldChange('isPublished',e.target.checked)} className="w-4 h-4 rounded accent-[#54B435]"/>
                  <div>
                    <div className="text-sm font-bold text-gray-800">✓ Publish this result</div>
                    <div className="text-xs text-gray-500 mt-0.5">Students/parents can view using phone / symbol / roll number</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={()=>setModal(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{background:'#54B435',boxShadow:'0 4px 14px rgba(84,180,53,0.35)'}}>
                  {saving?<><FaSpinner className="animate-spin"/>Saving…</>:editing?'✓ Save Changes':'✓ Add Result'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ VIEW MODAL ══ */}
      {modal==='view'&&editing&&(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.65)'}}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-black text-gray-900 dark:text-white">Result — {editing.studentName}</h2>
              <button onClick={()=>setModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><FaTimes size={14}/></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {[['Name',editing.studentName],['Class',`${editing.class}${editing.section?' - '+editing.section:''}`],['Exam',editing.examType],['Year',editing.academicYear],['Phone',editing.parentPhone],['Roll',editing.rollNo||'—'],['Symbol',editing.symbolNo||'—'],['Type',editing.marksheetType||'standard']].map(([l,v])=>(
                  <div key={l} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{l}</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{v}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500">{editing.subjects?.length||0} subjects recorded. Click Edit to modify.</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ IMPORT MODAL ══ */}
      {modal==='import'&&(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.65)'}}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-black text-gray-900 dark:text-white">Import Results from CSV</h2>
              <button onClick={closeImport} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><FaTimes size={14}/></button>
            </div>
            <div className="p-5 space-y-4">
              {importRows.length>0&&!importRes&&(<div><div className="flex items-center justify-between mb-2"><p className="text-sm font-bold text-gray-700">{importRows.length} student{importRows.length>1?'s':''} detected</p><span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Ready to import</span></div><ImportPreview rows={importRows}/></div>)}
              {!importRows.length&&(<div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Or paste CSV content:</label><textarea value={csvText} onChange={e=>{setCsvText(e.target.value);setImportRows(parseCSVImport(e.target.value))}} rows={8} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#54B435] bg-gray-50 text-gray-700" placeholder="Paste CSV…"/><div className="text-xs text-gray-400 mt-1">{importRows.length} valid rows detected</div></div>)}
              {importRes&&(<div className={`p-4 rounded-xl border text-sm ${importRes.errors.length?'bg-amber-50 border-amber-200':'bg-green-50 border-green-200'}`}><div className="flex items-center gap-2 font-bold mb-2">{importRes.errors.length?<FaExclamationTriangle className="text-amber-500"/>:<FaCheckCircle className="text-green-600"/>}<span>{importRes.message}</span></div>{importRes.errors.map((e,i)=><div key={i} className="text-xs text-red-600 mt-1">• {e}</div>)}</div>)}
              <div className="flex justify-end gap-3">
                <button onClick={closeImport} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">{importRes?'Close':'Cancel'}</button>
                {!importRes&&(<button onClick={handleImport} disabled={importing||!importRows.length} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60" style={{background:'#54B435'}}>{importing?<><FaSpinner className="animate-spin"/>Importing…</>:<><FaUpload size={12}/>Import {importRows.length}</>}</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {delId&&(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.65)'}}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-72 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><FaTrash size={18} className="text-red-400"/></div>
            <h3 className="font-black text-gray-900 dark:text-white mb-2">Delete Result?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDelId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600">Cancel</button>
              <button onClick={()=>handleDelete(delId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
   </div>
  )
}
