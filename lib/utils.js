export function formatDisplayName(profile) {
  if (!profile) return 'Unknown'
  const first = profile.first_name?.trim()
  const last = profile.last_name?.trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  if (last) return last
  return profile.username || profile.email || 'Unknown'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function truncate(str, n = 100) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function statusColor(status) {
  switch (status) {
    case 'available':
      return 'badge-green'
    case 'lent':
      return 'badge-orange'
    case 'scheduled':
      return 'badge-blue'
    default:
      return 'badge-gray'
  }
}

export function conditionLabel(condition) {
  switch (condition) {
    case 'new':
      return 'New'
    case 'good':
      return 'Good'
    case 'fair':
      return 'Fair'
    case 'worn':
      return 'Worn'
    default:
      return condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : 'Unknown'
  }
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
