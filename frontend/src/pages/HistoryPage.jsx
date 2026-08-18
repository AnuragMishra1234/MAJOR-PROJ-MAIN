import React, { useState } from 'react';
import DecoCard from '../components/ui/DecoCard';
import DiamondIcon from '../components/ui/DiamondIcon';
import SectionHeading from '../components/ui/SectionHeading';
import DecoButton from '../components/ui/DecoButton';

/**
 * PROJECT HISTORY MATRIX PAGE
 */
export default function HistoryPage({ onNavigate }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED'

  const historyData = [
    {
      id: 'HIST-01',
      title: 'ECOCAMPUS LAUNCH',
      goal: 'Launch package for eco-friendly campus startup.',
      status: 'ACTIVE',
      statusColor: 'text-[#D4AF37] border-[#D4AF37]',
      tasksCompleted: 3,
      tasksTotal: 5,
      created: '2026-08-16',
      updated: '10 mins ago',
    },
    {
      id: 'HIST-02',
      title: 'AI PRODUCT CONCEPT',
      goal: 'Landing page, copy, and React application.',
      status: 'COMPLETED',
      statusColor: 'text-[#F2F0E4] border-[#F2F0E4]',
      tasksCompleted: 7,
      tasksTotal: 7,
      created: '2026-08-15',
      updated: '1 day ago',
    },
    {
      id: 'HIST-03',
      title: 'SMART AGRICULTURE SUITE',
      goal: 'Crop telemetry dashboard and API hooks.',
      status: 'FAILED',
      statusColor: 'text-red-400 border-red-500/50',
      tasksCompleted: 2,
      tasksTotal: 4,
      created: '2026-08-14',
      updated: '2 days ago',
    },
    {
      id: 'HIST-04',
      title: 'QUANTUM FLEET ENGINE',
      goal: 'Logistics DAG optimization matrix.',
      status: 'ACTIVE',
      statusColor: 'text-[#D4AF37] border-[#D4AF37]',
      tasksCompleted: 4,
      tasksTotal: 6,
      created: '2026-08-12',
      updated: '4 days ago',
    },
  ];

  const filteredData =
    filter === 'ALL' ? historyData : historyData.filter((item) => item.status === filter);

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b-2 border-[#D4AF37]/30">
        <div>
          <span className="font-sans text-xs tracking-[0.35em] uppercase text-[#D4AF37] block mb-2">
            ARCHIVAL CATALOGUE
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.2em] text-[#F2F0E4]">
            PROJECT HISTORY <span className="text-[#D4AF37]">LOGS</span>
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'ACTIVE', 'COMPLETED', 'FAILED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-sans text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-all ${
                filter === f
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0A] font-bold shadow-gold'
                  : 'bg-[#0A0A0A] border-[#D4AF37]/30 text-[#888888] hover:border-[#D4AF37] hover:text-[#F2F0E4]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History Log Table / Cards */}
      <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 md:p-8 space-y-6">
        <div className="hidden md:grid grid-cols-6 gap-4 pb-4 border-b border-[#D4AF37]/20 font-sans text-xs tracking-[0.25em] text-[#D4AF37] uppercase font-bold">
          <span>PROJECT</span>
          <span className="col-span-2">INTENT OBJECTIVE</span>
          <span>STATUS</span>
          <span>TASKS</span>
          <span className="text-right">ACTION</span>
        </div>

        <div className="space-y-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-5 grid grid-cols-1 md:grid-cols-6 gap-4 items-center transition-all hover:border-[#D4AF37]"
            >
              <div>
                <span className="font-display text-sm text-[#D4AF37] tracking-widest block font-bold">
                  {item.id}
                </span>
                <h4 className="font-display text-base uppercase tracking-wider text-[#F2F0E4]">
                  {item.title}
                </h4>
              </div>

              <div className="md:col-span-2 font-sans text-xs text-[#888888]">
                "{item.goal}"
              </div>

              <div>
                <span className={`font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1 border font-bold ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>

              <div className="font-sans text-xs text-[#888888]">
                <strong className="text-[#F2F0E4]">
                  {item.tasksCompleted} / {item.tasksTotal}
                </strong>{' '}
                TASKS
              </div>

              <div className="text-right">
                <DecoButton
                  variant="ghost"
                  onClick={() => onNavigate('workspace')}
                  className="h-9 text-[10px] px-3"
                >
                  OPEN LOGS ↗
                </DecoButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
