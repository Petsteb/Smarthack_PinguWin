import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Page</h2>
          <p className="text-gray-600">Statistics and analytics will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
