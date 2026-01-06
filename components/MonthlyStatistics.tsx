
import React from 'react';
import { Member, AttendanceRecord, MetadataRecord } from '../types';
import { Trophy, ChevronLeft, ChevronRight, User, Calendar, Award, Medal } from 'lucide-react';

interface MonthlyStatisticsProps {
  members: Member[];
  attendance: AttendanceRecord;
  metadata: MetadataRecord;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

const MonthlyStatistics: React.FC<MonthlyStatisticsProps> = ({
  members,
  attendance,
  metadata,
  selectedMonth,
  setSelectedMonth,
}) => {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const stats = members.map((member) => {
    let count = 0;
    Object.entries(attendance).forEach(([date, dailyData]) => {
      if (date.startsWith(monthStr)) {
        const memberStatus = dailyData[member.id];
        if (memberStatus) {
          const activeCount = metadata[date]?.sessionCount || 1;
          const attended = memberStatus.slice(0, activeCount).filter((s) => s === 1).length;
          count += attended;
        }
      }
    });
    return { name: member.name, count };
  });

  const sortedStats = stats
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Month Selector */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-8 w-full">
          <button 
            onClick={handlePrevMonth} 
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
          >
            <ChevronLeft className="w-8 h-8 text-slate-400" />
          </button>
          
          <div className="text-center">
            <p className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">{year} YEAR</p>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
              {month + 1}<span className="text-xl text-slate-400 ml-1 font-bold">월 누적 참여</span>
            </h2>
          </div>

          <button 
            onClick={handleNextMonth} 
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
          >
            <ChevronRight className="w-8 h-8 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-4">
        {sortedStats.length > 0 ? (
          sortedStats.map((stat, idx) => (
            <div 
              key={stat.name} 
              className={`bg-white p-5 lg:p-6 rounded-[28px] border transition-all flex items-center justify-between group ${
                idx === 0 ? 'border-amber-200 shadow-amber-50 shadow-lg' : 
                idx === 1 ? 'border-slate-200' : 
                idx === 2 ? 'border-orange-100' : 
                'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                  idx === 0 ? 'bg-amber-400 text-white' : 
                  idx === 1 ? 'bg-slate-400 text-white' : 
                  idx === 2 ? 'bg-orange-400 text-white' : 
                  'bg-slate-100 text-slate-500'
                }`}>
                  {idx === 0 ? <Medal className="w-8 h-8" /> : idx + 1}
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {stat.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {idx === 0 && <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">TOP EXPLORER</span>}
                    {idx < 3 && idx > 0 && <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">HONORABLE</span>}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {month + 1}월 활동 기록
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
                    {stat.count}
                  </span>
                  <span className="text-sm font-black text-slate-400 mt-1">회</span>
                </div>
                <div className="w-32 lg:w-48 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      idx === 0 ? 'bg-amber-400' : 
                      idx === 1 ? 'bg-slate-400' : 
                      idx === 2 ? 'bg-orange-400' : 
                      'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min((stat.count / sortedStats[0].count) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-4 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
            <Calendar className="w-16 h-16 text-slate-100" />
            <p className="text-xl font-black text-slate-300 uppercase tracking-tight">활동 데이터가 없습니다</p>
            <p className="text-sm font-bold text-slate-400">선택하신 월의 출석 기록이 존재하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyStatistics;
