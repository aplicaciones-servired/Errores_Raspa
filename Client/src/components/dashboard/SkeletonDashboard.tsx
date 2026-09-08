const skeleton = 'bg-slate-100 rounded-xl animate-pulse'

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className={`w-12 h-12 ${skeleton} mb-4`} />
            <div className={`h-8 w-16 ${skeleton} mb-2`} />
            <div className={`h-4 w-24 ${skeleton}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white rounded-3xl border border-slate-100 p-6 h-72 ${skeleton}`} />
        <div className={`bg-white rounded-3xl border border-slate-100 p-6 h-72 ${skeleton}`} />
      </div>
    </div>
  )
}