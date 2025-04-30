'use client';

import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pennine Stock Control System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/products" 
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <p className="text-gray-600">View and manage product inventory</p>
        </Link>
        {/* Add more menu items here */}
      </div>
    </div>
  )
} 