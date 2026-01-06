
import React, { useState, useEffect } from 'react';
import { Member, AttendanceRecord, MetadataRecord, SessionAttendance } from '../types';
import { Trophy, TrendingUp, Users, Calendar, Trash2, Activity, ChevronLeft, ChevronRight, FileSpreadsheet, Star, AlertCircle, Copy, Check, Save, Globe, History, UserX } from 'lucide-react';
import { storageService } from '../services/storageService';

interface DashboardProps {
  members: Member[];
  attendance: AttendanceRecord;
  onlineAttendance: AttendanceRecord;
  metadata: MetadataRecord;
  onlineMetadata: MetadataRecord;
  globalSessionNames: string[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  onClearMonth: () => void;
  isAdmin: boolean;
  clubLink: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  members, 
  attendance, 
  onlineAttendance,
  metadata,
  onlineMetadata,
  globalSessionNames,
  selectedMonth, 
  setSelectedMonth,
  onClearMonth,
  isAdmin,
  clubLink
}) => {
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const yearStr = `${year}-`;

  const prevMonthDate = new Date(year, month - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (members.length > 0 && !sessionStorage.getItem('backup_dismissed')) {
      setShowBackupAlert(true);
    }
  }, [members]);

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

  const quickBackup = () => {
    const data = {
      members,
      attendance,
      metadata,
      onlineAttendance,
      onlineMetadata,
      globalSessions: globalSessionNames,
      backupDate: new Date().toLocaleString()
    };
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportToCSV = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let csvContent = "\uFEFF"; 
    csvContent += "회원명,타입,";
    for (let i = 1; i <= daysInMonth; i++) csvContent += `${month + 1}/${i},`;
    csvContent += "참석합계,노쇼합계\n";

    members.forEach(member => {
      const exportType = (rec: AttendanceRecord, meta: MetadataRecord, typeLabel: string) => {
        csvContent += `${member.name},${typeLabel},`;
        let totalAttended = 0;
        let totalNoShow = 0;
        for (let i = 1; i <= daysInMonth; i++) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const dayAttendance = rec[dateKey]?.[member.id] || [0, 0, 0, 0];
          const activeCount = meta[dateKey]?.sessionCount || 1;
          const activeSessions = dayAttendance.slice(0, activeCount);
          
          const attended = activeSessions.filter(s => s === 1).length;
          const noshow = activeSessions.filter(s => s === 2).length;
          
          csvContent += `${attended},`;
          totalAttended += attended;
          totalNoShow += noshow;
        }
        csvContent += `${totalAttended},${totalNoShow}\n`;
      };
      exportType(attendance, metadata, "오프라인");
      exportType(onlineAttendance, onlineMetadata, "온라인");
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `호드출석부_${year}년_${month + 1}월.csv`;
    link.click();
  };

  const hostCounts: Record<string, number> = {};
  const processMetadata = (meta: MetadataRecord) => {
    Object.entries(meta).forEach(([date, data]) => {
      if (date.startsWith(monthStr) && data.sessionHosts) {
        const activeCount = data.sessionCount || 1;
        data.sessionHosts.slice(0, activeCount).forEach(host => {
          if (host && host.trim()) {
            hostCounts[host] = (hostCounts[host] || 0) + 1;
          }
        });
      }
    });
  };
  processMetadata(metadata);
  processMetadata(onlineMetadata);

  const topHosts = Object.entries(hostCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const memberStats = members.map(member => {
    let offlineMonthlySessions = 0;
    let prevOfflineMonthlySessions = 0;
    let onlineMonthlySessions = 0;
    let noshowMonthly = 0;
    let offlineYearlySessions = 0;
    let cumulativeSessions = 0;

    const calc = (rec: AttendanceRecord, meta: MetadataRecord, isOnline: boolean) => {
      Object.entries(rec).forEach(([date, dailyData]) => {
        const status = dailyData[member.id];
        if (status) {
          const activeCount = meta[date]?.sessionCount || 1;
          const activeSessions = status.slice(0, activeCount);
          
          const attended = activeSessions.filter(s => s === 1).length;
          const noshow = activeSessions.filter(s => s === 2).length;

          if (attended > 0 || noshow > 0) {
            cumulativeSessions += attended;
            if (date.startsWith(monthStr)) {
              if (!isOnline) {
                offlineMonthlySessions += attended;
                noshowMonthly += noshow;
              } else {
                onlineMonthlySessions += attended;
              }
            }
            if (date.startsWith(prevMonthStr)) {
              if (!isOnline) prevOfflineMonthlySessions += attended;
            }
            if (date.startsWith(yearStr)) {
              if (!isOnline) offlineYearlySessions += attended;
            }
          }
        }
      });
    };
    calc(attendance, metadata, false); // 오프라인 계산
    calc(onlineAttendance, onlineMetadata, true); // 온라인 계산

    return {
      name: member.name,
      // 랭킹 산정 기준: 오프라인 벙 참여 횟수 (sessions, yearly)
      sessions: offlineMonthlySessions, 
      offline: offlineMonthlySessions,
      online: onlineMonthlySessions,
      prevSessions: prevOfflineMonthlySessions,
      noshow: noshowMonthly,
      yearly: offlineYearlySessions,
      cumulative: cumulativeSessions
    };
  });

  const monthlyRanking = [...memberStats].sort((a, b) => b.sessions - a.sessions).filter(s => s.sessions > 0).slice(0, 5);
  const yearlyRanking = [...memberStats].sort((a, b) => b.yearly - a.yearly).filter(s => s.yearly > 0).slice(0, 5);
  const prevMonthlyRanking = [...memberStats].sort((a, b) => b.prevSessions - a.prevSessions).filter(s => s.prevSessions > 0).slice(0, 3);

  const totalMonthlySessions = memberStats.reduce((acc, curr) => acc + curr.offline + curr.online, 0);
  const totalCumulativeSessions = memberStats.reduce((acc, curr) => acc + curr.cumulative, 0);

  return (
    <div className="space-y-4 lg:space-y-6 pb-20 lg:pb-12">
      {/* Data Safety Notice */}
      {showBackupAlert && isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">데이터를 안전하게 보관하세요!</p>
              <p className="text-xs text-amber-700">브라우저 청소 시 데이터가 사라질 수 있습니다. 정기적인 백업을 권장합니다.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={quickBackup}
              className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사완료' : '데이터 텍스트 복사'}
            </button>
            <button 
              onClick={() => { setShowBackupAlert(false); sessionStorage.setItem('backup_dismissed', 'true'); }}
              className="px-3 py-2 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Centered Month Selector */}
      <div className="bg-white p-8 lg:p-12 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20" />
        
        <div className="flex items-center justify-center gap-12 w-full max-w-2xl">
          <button 
            onClick={handlePrevMonth} 
            className="p-3 lg:p-4 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 shadow-sm hover:scale-105 active:scale-95 group"
          >
            <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
          
          <div className="text-center">
            <p className="text-xs lg:text-sm font-black text-slate-400 tracking-[0.3em] uppercase mb-1">{year} YEAR</p>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter">
              {month + 1}<span className="text-2xl lg:text-3xl text-slate-400 ml-1 font-bold">월</span>
            </h2>
          </div>

          <button 
            onClick={handleNextMonth} 
            className="p-3 lg:p-4 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 shadow-sm hover:scale-105 active:scale-95 group"
          >
            <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full justify-center">
          <button onClick={exportToCSV} className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-2xl hover:bg-green-100 transition-all flex items-center gap-2 font-bold text-xs" title="CSV 다운로드">
            <FileSpreadsheet className="w-5 h-5" />
            엑셀 출력
          </button>
          {clubLink && (
            <a 
              href={clubLink.startsWith('http') ? clubLink : `https://${clubLink}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              모임 공식 링크 바로가기
            </a>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Users className="w-5 h-5 lg:w-6 lg:h-6" /></div>
          <div><p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase">회원 수</p><p className="text-lg lg:text-2xl font-bold text-slate-800">{members.length}명</p></div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0"><TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" /></div>
          <div><p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase">이달 합산참석</p><p className="text-lg lg:text-2xl font-bold text-slate-800">{totalMonthlySessions}회</p></div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><Activity className="w-5 h-5 lg:w-6 lg:h-6" /></div>
          <div><p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase">누적 합계</p><p className="text-lg lg:text-2xl font-bold text-slate-800">{totalCumulativeSessions}회</p></div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0"><Trophy className="w-5 h-5 lg:w-6 lg:h-6" /></div>
          <div><p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase">이달 벙주</p><p className="text-lg lg:text-2xl font-bold text-slate-800">{Object.keys(hostCounts).length}명</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Ranking (오프라인 전용) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                이달의 참석 랭킹 (Top 5)
              </h3>
              <span className="text-[9px] font-black text-slate-400 mt-0.5 tracking-tight">* 오프라인 벙 참여 횟수 기준</span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">OFFLINE ONLY</span>
          </div>
          <div className="space-y-4">
            {monthlyRanking.length > 0 ? monthlyRanking.map((stat, idx) => (
              <div key={stat.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</div>
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{stat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {stat.online > 0 && (
                    <span className="text-[9px] font-black text-slate-300">온라인 {stat.online}회</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">오프</span>
                    <span className="font-black text-slate-700">{stat.sessions}회</span>
                  </div>
                </div>
              </div>
            )) : <div className="py-10 text-center text-slate-300 text-sm">오프라인 참석 기록이 없습니다.</div>}
          </div>
        </div>

        {/* Yearly/Cumulative Attendance Ranking (오프라인 전용) */}
        <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-500" />
                올해 누적 참석 랭킹 (Top 5)
              </h3>
              <span className="text-[9px] font-black text-indigo-300 mt-0.5 tracking-tight">* 오프라인 벙 연간 총합 기준</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{year} KST TOP</span>
          </div>
          <div className="space-y-4">
            {yearlyRanking.length > 0 ? yearlyRanking.map((stat, idx) => (
              <div key={stat.name} className="flex items-center justify-between p-3 bg-indigo-50/30 rounded-xl border border-indigo-50 group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</div>
                  <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{stat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">누적</span>
                  <span className="font-black text-indigo-700">{stat.yearly}회</span>
                </div>
              </div>
            )) : <div className="py-10 text-center text-slate-300 text-sm">오프라인 기록된 데이터가 없습니다.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              이달의 벙주 랭킹 (Top 5)
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">HOST MASTER</span>
          </div>
          <div className="space-y-4">
            {topHosts.length > 0 ? topHosts.map((host, idx) => (
              <div key={host.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</div>
                  <span className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{host.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">개최 횟수</span>
                  <span className="font-black text-slate-700">{host.count}회</span>
                </div>
              </div>
            )) : <div className="py-10 text-center text-slate-300 text-sm">기록된 벙주 정보가 없습니다.</div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              이전달 참석 랭킹 (Top 3)
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">LAST MONTH</span>
          </div>
          <div className="space-y-4">
            {prevMonthlyRanking.length > 0 ? prevMonthlyRanking.map((stat, idx) => (
              <div key={stat.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                    idx === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' : 
                    'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-lg">{stat.name}</span>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{prevMonthStr}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">OFFLINE</span>
                  <span className="font-black text-slate-900 text-xl">{stat.prevSessions}회</span>
                </div>
              </div>
            )) : <div className="py-12 text-center text-slate-300 text-sm border-2 border-dashed border-slate-100 rounded-3xl">이전달 오프라인 기록이 존재하지 않습니다.</div>}
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClearMonth} className="px-4 py-2 text-[10px] text-red-400 font-bold uppercase hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
            현재 달 데이터 초기화
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
