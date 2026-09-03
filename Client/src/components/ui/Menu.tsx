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
    <nav className="flex gap-1 bg-white rounded-xl shadow-sm p-1.5 border border-gray-200">
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
