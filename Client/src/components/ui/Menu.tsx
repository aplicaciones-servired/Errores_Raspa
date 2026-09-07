export type MenuItemKey = string

export interface MenuItem<T extends MenuItemKey> {
  key: T
  label: string
  icon?: string
}

interface Props<T extends MenuItemKey> {
  items: MenuItem<T>[]
  active: T
  onChange: (key: T) => void
}

export default function Menu<T extends MenuItemKey>({
  items,
  active,
  onChange,
}: Props<T>) {
  return (
    <nav className="inline-flex bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/50 shadow-sm">
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm'
            }`}
          >
            {item.icon && <span className={`text-base ${isActive ? 'scale-110' : ''} transition-transform duration-300`}>{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
