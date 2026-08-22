'use client'

interface StatCardProps {
  label: string
  value: string
  sublabel: string
}

export default function StatCard({
  label,
  value,
  sublabel,
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-xs text-gray-500">{sublabel}</p>
        </div>
      </div>

      {/* Main Value */}
      <div>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      </div>
    </div>
  )
}
