import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const Ctx = createContext(null)

const DEFAULTS = {
  name: 'Kidland School',
  tagline: 'Duty, Honor, Country',
  est: '2005',
  aff: 'NMTC — Nepal Montessori Training Centre',
  desc: 'Kidland School is a leading NMTC-affiliated institution at Kusunti, Lalitpur, providing quality Montessori and academic education since 2005.',
  address: 'Kusunti, Lalitpur-13 (Opposite Yatayat Office), Nepal',
  phone1: '9841404920',
  phone2: '01-5430237',
  email1: 'kidlandmontessori@gmail.com',
  email2: 'info@kidlandschool.edu.np',
  hours: 'Sunday – Friday: 10:00 AM – 4:00 PM',
  pname: 'Ms. Shanti Khadka',
  ptitle: 'Founder and Director',
  pphoto: null,
  pmsg1: 'Since our establishment in 2005, we have been deeply committed to nurturing the minds of future leaders, innovators and changemakers.',
  pmsg2: 'At Kidland, education extends beyond academic achievement — it is about shaping character and cultivating creativity.',
  fb: 'https://www.facebook.com/kidlandmontessori/',
  ig: 'https://www.instagram.com/kidlandeducation/',
  wa: '9779841404920',
  yt: '',
  noticeText: '',
  noticeEnabled: true,
  popupEnabled: false,
  popupImage: null,
  popupTitle: '',
  popupLink: '',
  popupFrequencyHours: 24,
  // Student enrollment by grade — admin dashboard only, never shown on public site.
  // Each entry: { grade: 'Grade 1', boys: 12, girls: 14 }
  studentsByGrade: [
    { grade: 'Nursery', boys: 0, girls: 0 },
    { grade: 'LKG',     boys: 0, girls: 0 },
    { grade: 'UKG',     boys: 0, girls: 0 },
    { grade: 'Grade 1', boys: 0, girls: 0 },
    { grade: 'Grade 2', boys: 0, girls: 0 },
    { grade: 'Grade 3', boys: 0, girls: 0 },
    { grade: 'Grade 4', boys: 0, girls: 0 },
    { grade: 'Grade 5', boys: 0, girls: 0 },
    { grade: 'Grade 6', boys: 0, girls: 0 },
    { grade: 'Grade 7', boys: 0, girls: 0 },
    { grade: 'Grade 8', boys: 0, girls: 0 },
    { grade: 'Grade 9', boys: 0, girls: 0 },
    { grade: 'Grade 10', boys: 0, girls: 0 },
  ],
  lastPromotionDate: null,
}

// Sequential grade order used for promotion (Nursery -> ... -> Grade 10 -> Graduated/removed)
const GRADE_ORDER = ['Nursery','LKG','UKG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10']

const STORAGE_KEY = 'ks_settings'

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      return cached ? { ...DEFAULTS, ...JSON.parse(cached) } : DEFAULTS
    } catch { return DEFAULTS }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings')
      .then(r => {
        const fetched = r?.data || r
        if (fetched && Object.keys(fetched).length > 0) {
          const merged = { ...DEFAULTS, ...fetched }
          setSettings(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        }
      })
      .catch(() => { /* offline — keep cached/default settings */ })
      .finally(() => setLoading(false))
  }, [])

  const saveSettings = useCallback(async (partial) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    try {
      await api.put('/settings', partial)
    } catch {
      console.warn('Settings saved locally (server offline)')
    }
    return updated
  }, [settings])

  // Update a single grade's boy/girl counts
  const updateGradeCount = useCallback(async (grade, boys, girls) => {
    const current = settings.studentsByGrade || DEFAULTS.studentsByGrade
    const updated = current.map(g => g.grade === grade ? { ...g, boys: Math.max(0, Number(boys) || 0), girls: Math.max(0, Number(girls) || 0) } : g)
    return saveSettings({ studentsByGrade: updated })
  }, [settings, saveSettings])

  // Promote every grade up one level: Nursery->LKG->...->Grade 10 (Grade 10 students graduate and leave the roll).
  // Nursery resets to 0/0 ready for new intake.
  const promoteAllGrades = useCallback(async () => {
    const current = settings.studentsByGrade || DEFAULTS.studentsByGrade
    const byGrade = Object.fromEntries(current.map(g => [g.grade, g]))
    const promoted = GRADE_ORDER.map((grade, i) => {
      if (grade === 'Nursery') return { grade, boys: 0, girls: 0 } // new intake starts empty
      const prevGrade = GRADE_ORDER[i - 1]
      const prev = byGrade[prevGrade] || { boys: 0, girls: 0 }
      return { grade, boys: prev.boys, girls: prev.girls }
    })
    // Grade 10 students graduate out - they are not carried forward (already excluded since loop ends at Grade 10 from Grade 9's data)
    return saveSettings({ studentsByGrade: promoted, lastPromotionDate: new Date().toISOString() })
  }, [settings, saveSettings])

  // Total students = sum of boys + girls across all grades
  const studentsByGrade = settings.studentsByGrade || DEFAULTS.studentsByGrade
  const totalStudents = studentsByGrade.reduce((sum, g) => sum + (Number(g.boys)||0) + (Number(g.girls)||0), 0)
  const totalBoys  = studentsByGrade.reduce((sum, g) => sum + (Number(g.boys)||0), 0)
  const totalGirls = studentsByGrade.reduce((sum, g) => sum + (Number(g.girls)||0), 0)

  return (
    <Ctx.Provider value={{
      settings, loading, saveSettings,
      studentsByGrade, updateGradeCount, promoteAllGrades,
      totalStudents, totalBoys, totalGirls,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSettings = () => useContext(Ctx)
