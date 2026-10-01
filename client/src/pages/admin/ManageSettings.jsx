import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaSave, FaSchool, FaPhoneAlt, FaImage, FaShareAlt, FaBullhorn, FaWindowRestore, FaEye } from 'react-icons/fa'
import { useSettings } from '../../context/SettingsContext'
import ImageUpload from '../../components/ui/ImageUpload'

const TABS = [
  { id:'school',    label:'School Info',   icon:FaSchool },
  { id:'contact',   label:'Contact',       icon:FaPhoneAlt },
  { id:'principal', label:'Principal',     icon:FaImage },
  { id:'notice',    label:'Notice Bar',    icon:FaBullhorn },
  { id:'popup',     label:'Welcome Popup', icon:FaWindowRestore },
  { id:'social',    label:'Social Links',  icon:FaShareAlt },
]

function SchoolTab({ settings, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings })
  const submit = (data) => { onSave(data); toast.success('School info saved — visible on site now') }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">School Name</label><input {...register('name')} className="field"/></div>
        <div><label className="label">Tagline / Motto</label><input {...register('tagline')} className="field"/></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">Established Year</label><input {...register('est')} className="field"/></div>
        <div><label className="label">Affiliation</label><input {...register('aff')} className="field"/></div>
      </div>
      <div><label className="label">Short Description</label><textarea {...register('desc')} rows={4} className="field resize-none"/></div>
      <div><label className="label">Address</label><input {...register('address')} className="field"/></div>
      <button type="submit" className="btn-primary"><FaSave size={13}/> Save School Info</button>
    </form>
  )
}

function ContactTab({ settings, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings })
  const submit = (data) => { onSave(data); toast.success('Contact details saved — visible on site now') }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">Primary Phone</label><input {...register('phone1')} className="field"/></div>
        <div><label className="label">Secondary Phone</label><input {...register('phone2')} className="field"/></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">Primary Email</label><input {...register('email1')} className="field"/></div>
        <div><label className="label">Secondary Email</label><input {...register('email2')} className="field"/></div>
      </div>
      <div><label className="label">Office Hours</label><input {...register('hours')} className="field"/></div>
      <button type="submit" className="btn-primary"><FaSave size={13}/> Save Contact Details</button>
    </form>
  )
}

function PrincipalTab({ settings, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings })
  const [photo, setPhoto] = useState(settings.pphoto || null)
  const submit = (data) => { onSave({ ...data, pphoto: photo }); toast.success('Principal message saved — visible on site now') }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">Principal Name</label><input {...register('pname')} className="field"/></div>
        <div><label className="label">Designation</label><input {...register('ptitle')} className="field"/></div>
      </div>
      <ImageUpload label="Principal Photo" value={photo} onChange={(d) => setPhoto(d)} aspect="aspect-square" />
      <div><label className="label">Message Paragraph 1</label><textarea {...register('pmsg1')} rows={3} className="field resize-none"/></div>
      <div><label className="label">Message Paragraph 2</label><textarea {...register('pmsg2')} rows={3} className="field resize-none"/></div>
      <button type="submit" className="btn-primary"><FaSave size={13}/> Save Principal Message</button>
    </form>
  )
}

function NoticeTab({ settings, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings })
  const submit = (data) => { onSave(data); toast.success('Notice bar saved — updated on site now') }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        This text scrolls in the highlighted top bar on every page, alongside your latest published notices.
      </p>
      <div>
        <label className="label">Highlight Message</label>
        <input {...register('noticeText')} className="field" placeholder="e.g. Admission Open 2083!"/>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="noticeEnabled" {...register('noticeEnabled')} className="w-4 h-4 accent-primary-500"/>
        <label htmlFor="noticeEnabled" className="text-sm text-gray-700 dark:text-gray-300">Show this message in the top bar</label>
      </div>
      <button type="submit" className="btn-primary"><FaSave size={13}/> Save Notice Bar</button>
    </form>
  )
}

function PopupTab({ settings, onSave }) {
  const { register, handleSubmit, watch } = useForm({ defaultValues: settings })
  const [image, setImage] = useState(settings.popupImage || null)
  const watchTitle   = watch('popupTitle')
  const watchEnabled = watch('popupEnabled')

  const submit = (data) => {
    onSave({ ...data, popupImage: image })
    toast.success('Welcome popup saved — will show on the next site visit')
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a promotional image (e.g. admission notice, event flyer). It pops up once per visitor when they open the site.
        </p>
        <ImageUpload label="Popup Image" value={image} onChange={(d) => setImage(d)} aspect="aspect-[4/5]" maxSizeMB={3} />
        <div>
          <label className="label">Title (accessibility, optional)</label>
          <input {...register('popupTitle')} className="field" placeholder="e.g. Admission Open for 2083"/>
        </div>
        <div>
          <label className="label">Link URL (optional — clicking the popup opens this)</label>
          <input {...register('popupLink')} className="field" placeholder="https://... or /apply"/>
        </div>
        <div>
          <label className="label">Show Again After</label>
          <select {...register('popupFrequencyHours')} className="field">
            <option value="1">Every visit (1 hour)</option>
            <option value="24">Once per day (24 hours)</option>
            <option value="168">Once per week (7 days)</option>
            <option value="720">Once per month (30 days)</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="popupEnabled" {...register('popupEnabled')} className="w-4 h-4 accent-primary-500"/>
          <label htmlFor="popupEnabled" className="text-sm text-gray-700 dark:text-gray-300">Enable welcome popup on site</label>
        </div>
        <button type="submit" className="btn-primary"><FaSave size={13}/> Save Popup Settings</button>
      </form>

      <div>
        <label className="label flex items-center gap-1.5"><FaEye size={11}/> Live Preview</label>
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-6 flex items-center justify-center min-h-[320px]">
          {image ? (
            <div className="relative w-full max-w-[260px] rounded-xl overflow-hidden shadow-2xl bg-white">
              <button type="button" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-gray-800 flex items-center justify-center shadow-md text-xs">✕</button>
              <img src={image} alt={watchTitle || 'Preview'} className="w-full h-auto object-contain"/>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center">Upload an image to preview the popup here</p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {watchEnabled ? 'Popup is enabled and will show to visitors.' : 'Popup is currently disabled — toggle the checkbox to enable it.'}
        </p>
      </div>
    </div>
  )
}

function SocialTab({ settings, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings })
  const submit = (data) => { onSave(data); toast.success('Social links saved — visible on site now') }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div><label className="label">Facebook Page URL</label><input {...register('fb')} className="field"/></div>
      <div><label className="label">Instagram Profile URL</label><input {...register('ig')} className="field"/></div>
      <div><label className="label">WhatsApp Number</label><input {...register('wa')} className="field" placeholder="Country code + number"/></div>
      <div><label className="label">YouTube Channel URL</label><input {...register('yt')} className="field" placeholder="https://youtube.com/..."/></div>
      <button type="submit" className="btn-primary"><FaSave size={13}/> Save Social Links</button>
    </form>
  )
}

export default function ManageSettings() {
  const [active, setActive] = useState('school')
  const { settings, saveSettings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin" />
      </div>
    )
  }

  const TabContent = {
    school: SchoolTab, contact: ContactTab, principal: PrincipalTab, notice: NoticeTab, popup: PopupTab, social: SocialTab,
  }[active]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage school information — changes appear on the live site immediately</p>
      </div>
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-4 md:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                active===t.id ? 'border-primary-400 text-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>
        <div className="p-5 md:p-6">
          <TabContent settings={settings} onSave={saveSettings} />
        </div>
      </div>
    </div>
  )
}
