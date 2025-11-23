'use client';

import { useState } from 'react';
import { Eye, Plus, FileText, Edit } from 'lucide-react';
import Link from 'next/link';

interface NDA {
  id: string;
  partyName: string;
  status: string;
  createdAt: Date;
  signedAt: Date | null;
  type: 'created' | 'received';
}

interface DashboardClientProps {
  ndas: NDA[];
}

export default function DashboardClient({ ndas }: DashboardClientProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'signed'>('all');

  const filteredNdas = ndas.filter((nda) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return nda.type === 'created' && (nda.status === 'sent' || nda.status === 'pending');
    if (filter === 'received') return nda.type === 'received' && nda.status !== 'signed';
    if (filter === 'draft') return nda.status === 'draft' && nda.type === 'created';
    if (filter === 'signed') return nda.status === 'signed';
    return true;
  });

  const stats = {
    total: ndas.length,
    draft: ndas.filter((n) => n.status === 'draft' && n.type === 'created').length,
    sent: ndas.filter((n) => n.type === 'created' && (n.status === 'sent' || n.status === 'pending')).length,
    received: ndas.filter((n) => n.type === 'received' && n.status !== 'signed').length,
    signed: ndas.filter((n) => n.status === 'signed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2">My NDAs</h1>
                <p className="text-xl text-gray-200">Manage and track your non-disclosure agreements</p>
              </div>
            </div>
            <Link href="/newnda">
              <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New NDA
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Now clickable filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${
              filter === 'all'
                ? 'bg-teal-50 border-teal-500'
                : 'bg-white border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total NDAs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                filter === 'all' ? 'bg-teal-600' : 'bg-teal-100'
              }`}>
                <FileText className={`w-6 h-6 ${filter === 'all' ? 'text-white' : 'text-teal-600'}`} />
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('draft')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${
              filter === 'draft'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-white border-gray-200 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Drafts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.draft}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                filter === 'draft' ? 'bg-yellow-600' : 'bg-yellow-100'
              }`}>
                <svg className={`w-6 h-6 ${filter === 'draft' ? 'text-white' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('sent')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${
              filter === 'sent'
                ? 'bg-purple-50 border-purple-500'
                : 'bg-white border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sent}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                filter === 'sent' ? 'bg-purple-600' : 'bg-purple-100'
              }`}>
                <svg className={`w-6 h-6 ${filter === 'sent' ? 'text-white' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('received')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${
              filter === 'received'
                ? 'bg-orange-50 border-orange-500'
                : 'bg-white border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Waiting for You</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.received}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                filter === 'received' ? 'bg-orange-600' : 'bg-orange-100'
              }`}>
                <svg className={`w-6 h-6 ${filter === 'received' ? 'text-white' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('signed')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${
              filter === 'signed'
                ? 'bg-green-50 border-green-500'
                : 'bg-white border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Signed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.signed}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                filter === 'signed' ? 'bg-green-600' : 'bg-green-100'
              }`}>
                <svg className={`w-6 h-6 ${filter === 'signed' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* NDA List */}
        <div className="space-y-4">
          {filteredNdas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No NDAs found</h3>
              <p className="text-gray-600 mb-6">Create your first NDA to get started.</p>
              <Link href="/newnda">
                <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Create New NDA
                </button>
              </Link>
            </div>
          ) : (
            filteredNdas.map((nda) => (
              <div
                key={nda.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-102"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">
                        {nda.partyName}
                      </h3>
                      {nda.type === 'received' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          RECEIVED
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          nda.status === 'signed'
                            ? 'bg-green-100 text-green-800'
                            : nda.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : nda.status === 'sent' || nda.status === 'pending'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {nda.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created: {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {nda.signedAt && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Signed: {new Date(nda.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/preview-template?draftId=${nda.id}`}>
                      <button className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-teal-500 transition-all flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </Link>
                    {nda.status === 'draft' && (
                      <Link href={`/fillndahtml?draftId=${nda.id}`}>
                        <button className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-teal-500 transition-all flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}