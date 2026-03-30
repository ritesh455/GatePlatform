import React from 'react';

const NotFound: React.FC = () => {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-xl text-center bg-white p-10 rounded-2xl shadow-lg border border-slate-200">
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4">404</h1>
        <p className="text-lg text-slate-600 mb-6">Page not found. The link you followed may be broken or the page may have been removed.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-50">Go Home</button>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600">Go to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
