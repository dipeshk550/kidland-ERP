import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaUserGraduate, FaEdit, FaArrowUp, FaMale, FaFemale, FaExclamationTriangle } from 'react-icons/fa'
import { useSettings } from '../../context/SettingsContext'
import { Modal } from '../ui/index'

export default function StudentEnrollmentCard() {
  const { studentsByGrade, totalStudents, totalBoys, totalGirls, updateGradeCount, promoteAllGrades, saveSettings, settings } = useSettings()
  const [editModal, setEditModal]   = useState(false)
  const [confirmPromote, setConfirmPromote] = useState(false)
  const [draft, setDraft] = useState([])

  const openEdit = () => {
    setDraft(studentsByGrade.map(g => ({ ...g })))
    setEditModal(true)
  }

  const saveAll = async () => {
    // Save all grades in a single call to avoid stale-closure bug
    // where sequential updateGradeCount calls each overwrite with stale state
    const updatedGrades = draft.map(g => ({
      grade: g.grade,
      boys: Math.max(0, Number(g.boys) || 0),
      girls: Math.max(0, Number(g.girls) || 0),
    }))
    await saveSettings({ studentsByGrade: updatedGrades })
    toast.success('Student counts updated')
    setEditModal(false)
  }

  const doPromote = async () => {
    await promoteAllGrades()
    toast.success('All students promoted to next grade. Nursery is ready for new intake.')
    setConfirmPromote(false)
  }

  const lastPromo = settings?.lastPromotionDate
    ? new Date(settings.lastPromotionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-4 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
          <FaUserGraduate className="text-lg text-green-500" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalStudents.toLocaleString()}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-1">Total Students</div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
          <span className="flex items-center gap-1"><FaMale className="text-blue-400" size={11}/>{totalBoys}</span>
          <span className="flex items-center gap-1"><FaFemale className="text-pink-400" size={11}/>{totalGirls}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={openEdit}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
            <FaEdit size={9} /> Edit Counts
          </button>
          <button onClick={() => setConfirmPromote(true)} title="Promote all students to next grade"
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <FaArrowUp size={11} />
          </button>
        </div>
        {lastPromo && <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-2">Last promoted: {lastPromo}</p>}
      </motion.div>

      {/* Edit grade counts modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Student Enrollment by Grade" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set the number of boys and girls in each grade. Total updates automatically.
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2 -mx-1 px-1">
            {draft.map((g, i) => (
              <div key={g.grade} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-20 shrink-0">{g.grade}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <FaMale className="text-blue-400 shrink-0" size={13} />
                  <input
                    type="number" min="0" value={g.boys}
                    onChange={e => setDraft(d => d.map((x, idx) => idx === i ? { ...x, boys: e.target.value } : x))}
                    className="field py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <FaFemale className="text-pink-400 shrink-0" size={13} />
                  <input
                    type="number" min="0" value={g.girls}
                    onChange={e => setDraft(d => d.map((x, idx) => idx === i ? { ...x, girls: e.target.value } : x))}
                    className="field py-1.5 text-sm"
                  />
                </div>
                <span className="text-xs font-bold text-gray-400 w-10 text-right shrink-0">
                  {(Number(g.boys)||0) + (Number(g.girls)||0)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Total: {draft.reduce((s, g) => s + (Number(g.boys)||0) + (Number(g.girls)||0), 0)}
            </span>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveAll} className="btn-primary">Save All</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm promotion modal */}
      <Modal open={confirmPromote} onClose={() => setConfirmPromote(false)} title="Promote All Students?" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
            <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" size={16} />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This moves every grade's students up one level (Nursery → LKG → ... → Grade 10).
              Grade 10 students graduate and leave the active roll. Nursery resets to 0 for new intake.
              This is normally done once at the start of a new academic year.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmPromote(false)} className="btn-ghost">Cancel</button>
            <button onClick={doPromote} className="btn-primary"><FaArrowUp size={12}/> Promote All</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
