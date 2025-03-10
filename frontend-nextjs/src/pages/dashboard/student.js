import DashboardLayout from '@/components/DashboarLayout'
import React from 'react'

export default function student() {
  return (
      <DashboardLayout>
          <h2 className="text-xl font-semibold text-gray-800">
            Student
          </h2>
          <p className="mt-4 text-gray-600">
            Welcome to the student dashboard. Add your content here.
          </p>
        </DashboardLayout>
  )
}
