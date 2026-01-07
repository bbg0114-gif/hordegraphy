
import React from 'react';
import { Member, AttendanceRecord, MetadataRecord } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Medal, Globe, MapPin, Users } from 'lucide-react';

interface MonthlyStatisticsProps {
  members: Member[];
  attendance: AttendanceRecord;
  metadata: MetadataRecord;
  onlineAttendance: AttendanceRecord;
  onlineMetadata: MetadataRecord;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

const MonthlyStatistics: React.FC<MonthlyStatisticsProps> = ({
  members,
  attendance,
  metadata,
  onlineAttendance,
  onlineMetadata,
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

  // 총 개최 횟수 및 총 참여 수 계산
  let totalOfflineHeld = 0;
  let totalOnlineHeld = 0;
  let totalAttendanceSum = 0;

  const getStatsForType = (record: AttendanceRecord, meta: MetadataRecord, isOnline: boolean) => {
    const heldDates = Object.keys(meta).filter(d => d.startsWith(monthStr));
    let heldCount = 0;
    heldDates.forEach(d => {
      heldCount += meta[d].sessionCount || 1;
    });

    let attSum = 0;
    Object.entries(record).forEach(([date, dailyData]) => {
      if (date.startsWith(monthStr)) {
        Object.values(dailyData).forEach(sessions => {
          const activeCount = meta[date]?.sessionCount || 1;
          attSum += sessions.slice(0, activeCount).filter(s => s === 1).length;
        });
      }
    });

    return { heldCount, attSum };
  };

  const offStats = getStatsForType(attendance, metadata, false);
  const onStats = getStatsForType(onlineAttendance, onlineMetadata, true);

  totalOfflineHeld = offStats.heldCount;
  totalOnlineHeld = onStats.heldCount;
  totalAttendanceSum = offStats.attSum + onStats.attSum;

  const memberStats = members.map((member) => {
    let offlineCount = 0;
    let onlineCount = 0;

    // 오프라인 집계
    Object.entries(attendance).forEach(([date, dailyData]) => {
      if (date.startsWith(monthStr)) {
        const status = dailyData[member.id];
        if (status) {
          const activeCount = metadata[date]?.sessionCount || 1;
          offlineCount += status.slice(0, activeCount).filter(s => s === 1).length;
        }
      }
    });

    // 온라인 집계
    Object.entries(onlineAttendance).forEach(([date, dailyData]) => {
      if (date.startsWith(monthStr)) {
        const status = dailyData[member.id];
        if (status) {
          const activeCount = onlineMetadata[date]?.sessionCount || 1;
          onlineCount += status.slice(0, activeCount).filter(s => s === 1).length;
        }
      }
    });

    return { name: member.name, offlineCount, onlineCount };
  });

  // 오프라인 참여 횟수 기준으로 정렬 (온라인은 순위에 영향 미치지 않음)
  const sortedStats = memberStats
    .filter((s) => s.offlineCount > 0 || s.onlineCount > 0)
    .sort((a, b) => b.offlineCount - a.offlineCount);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Month Selector & Summary */}
      <div className="bg-white p-8 lg:p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-10 w-full">
          <button 
            onClick={handlePrevMonth} 
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
          >
            <ChevronLeft className="w-8 h-8 text-slate-400" />
          </button>
          
          <div className="text-center">
            <p className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase mb-1">{year} YEAR</p>
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">
              {month + 1}<span className="text-2xl text-slate-300 ml-1 font-bold">월</span>
            </h2>
          </div>

          <button 
            onClick={handleNextMonth} 
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
          >
            <ChevronRight className="w-8 h-8 text-slate-400" />
          </button>
        </div>

        {/* Monthly Summary Bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">오프라인 벙 <span className="text-slate-900">{totalOfflineHeld}회</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">온라인 벙 <span className="text-slate-900">{totalOnlineHeld}회</span></span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">총 참여 수 <span className="text-green-600 font-black">{totalAttendanceSum}회</span></span>
          </div>
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

              <div className="flex items-baseline gap-4">
                {/* 온라인 참여 횟수 (왼쪽, 작고 흐리게) */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-tighter">ONLINE</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-lg lg:text-xl font-black text-slate-300">
                      {stat.onlineCount}
                    </span>
                    <span className="text-[10px] font-bold text-slate-200">회</span>
                  </div>
                </div>

                {/* 오프라인 참여 횟수 (오른쪽, 크게) */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">OFFLINE</span>
                  <div className="flex items-center gap-1">
                    <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
                      {stat.offlineCount}
                    </span>
                    <span className="text-sm font-black text-slate-400">회</span>
                  </div>
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
