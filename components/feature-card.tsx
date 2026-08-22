'use client'

import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  buttonText: string
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  buttonText,
}: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
      {/* Icon */}
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {/* Button */}
      <button className="text-sm font-medium text-gray-700 hover:text-gray-900 border-t border-gray-200 pt-3 w-full text-left">
        {buttonText}
      </button>
    </div>
  )
}
