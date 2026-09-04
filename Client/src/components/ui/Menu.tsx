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
    <nav className="inline-flex bg-white rounded-xl shadow-sm p-1 border border-gray-200/80">
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
