export const ADMIN_MODULES = [
  ['news','/admin/news'], ['events','/admin/events'], ['gallery','/admin/gallery'],
  ['notices','/admin/notices'], ['teachers','/admin/teachers'], ['alumni','/admin/alumni'],
  ['results','/admin/results'], ['admissions','/admin/admissions'], ['contacts','/admin/contacts'],
  ['whatsapp','/admin/whatsapp'], ['fees','/admin/fees/'], ['library','/admin/library/'],
  ['transport','/admin/transport'], ['lms','/admin/lms'], ['attendance','/admin/attendance'], ['roles','/admin/users'],
  ['roles','/admin/roles'], ['audit','/admin/audit'], ['settings','/admin/settings'],
]
export function moduleForAdminPath(pathname) {
  return ADMIN_MODULES
    .filter(([, prefix]) => pathname === prefix || pathname.startsWith(prefix))
    .sort((a,b) => b[1].length - a[1].length)[0]?.[0] || null
}
export function canAccess(user, module, action = 'view') {
  if (!user || !module) return false
  if (['superadmin','admin'].includes(user.role)) return true
  const overrides = user.permissionOverrides || []
  const override = overrides.find(p => p.module === module && p.action === action)
  if (override) return override.allowed
  if (user.role === 'coadmin' && !user.customRole) return !['roles','audit'].includes(module)
  if (user.role === 'teacher' && !user.customRole && module === 'lms') return true
  if (user.role === 'staff' && !user.customRole && ['library','transport','fees'].includes(module)) return true
  return !!user.customRole?.isActive && !!user.customRole.permissions?.some(
    p => p.module === module && p.actions?.includes(action)
  )
}
