
import React, { useState, useMemo, useEffect } from 'react';
import { Member, AttendanceRecord, SessionAttendance, AttendanceStatus } from '../types';
import { Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, Settings2, Grid, User, Plus, UserX, UserPlus, RotateCcw } from 'lucide-react';
import { matchSearch } from '../utils/chosung';

interface AttendanceGridProps {
  members: Member[];
  attendance: AttendanceRecord;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onUpdate: (memberId: string, sessionIndex: number, value: any) => void;
  onResetDate: () => void;
  sessionNames: string[];
  sessionHosts: string[];
  sessionCount: number;
  onUpdateMetadata: (names: string[], hosts: string[], count: number) => void;
  onAddMember: (name: string, joinedAt: string) => void;
  isAdmin: boolean;
  title: string;
}

const AttendanceGrid: React.FC<AttendanceGridProps> = ({ 
  members, 
  attendance, 
  selectedDate, 
  setSelectedDate, 
  onUpdate,
  onResetDate,
  sessionNames,
  sessionHosts,
  sessionCount,
  onUpdateMetadata,
  onAddMember,
  isAdmin,
  title
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [showOnlyMarked, setShowOnlyMarked] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempNames, setTempNames] = useState<string[]>([]);
  const [tempHosts, setTempHosts] = useState<string[]>([]);
  const [tempCount, setTempCount] = useState<number>(1);
  
  const dateStr = selectedDate.toISOString().split('T')[0];
  const currentDailyAttendance = attendance[dateStr] || {};

  useEffect(() => {
    setTempNames([...sessionNames]);
    setTempHosts([...sessionHosts]);
    setTempCount(sessionCount);
  }, [sessionNames, sessionHosts, sessionCount, selectedDate]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setIsEditingMetadata(false);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setIsEditingMetadata(false);
  };

  const saveMetadata = () => {
    if (!isAdmin) return;
    onUpdateMetadata(tempNames, tempHosts, tempCount);
    setIsEditingMetadata(false);
  };

  const handleAddSession = () => {
    if (tempCount < 4) {
      setTempCount(prev => prev + 1);
    }
  };

  const handleRemoveSession = () => {
    if (tempCount > 1) {
      setTempCount(prev => prev - 1);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddName.trim() && isAdmin) {
      // Pass the selected date as the joinedAt date for the new member
      onAddMember(quickAddName.trim(), dateStr);
      setQuickAddName('');
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const isMatch = matchSearch(member.name, searchTerm);
      const memberStatus = currentDailyAttendance[member.id] || [0, 0, 0, 0];
      const hasAttended = memberStatus.some(s => s === 1 || s === 2);
      
      if (showOnlyMarked) {
        return isMatch && (hasAttended || (searchTerm.length > 0));
      }
      return isMatch;
    });
  }, [members, searchTerm, showOnlyMarked, currentDailyAttendance]);

  // 세션별 참석 인원 계산
  const sessionTotalAttended = useMemo(() => {
    const totals = [0, 0, 0, 0];
    (Object.values(currentDailyAttendance) as SessionAttendance[]).forEach(statusArray => {
      statusArray.forEach((status, idx) => {
        if (status === 1) totals[idx]++;
      });
    });
    return totals;
  }, [currentDailyAttendance]);

  const formattedDate = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  const renderCalendar = () => {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 px-2">
          <h4 className="font-bold text-slate-800">{currentYear}년 {currentMonth + 1}월</h4>
          <div className="flex gap-1">
            <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-9" />;
            const targetDate = new Date(currentYear, currentMonth, day);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const isSelected = targetDateStr === dateStr;
            const hasData = !!attendance[targetDateStr];
            return (
              <button
                key={day}
                onClick={() => { setSelectedDate(targetDate); setShowCalendar(false); }}
                className={`h-9 w-full flex flex-col items-center justify-center rounded-xl transition-all relative ${isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <span className="text-xs">{day}</span>
                {hasData && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="lg:col-span-1 bg-white p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative">
          <button onClick={handlePrevDay} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
          <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 rounded-xl transition-colors group">
            <CalendarIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-slate-800 text-sm lg:text-base">{formattedDate}</span>
          </button>
          <button onClick={handleNextDay} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          {showCalendar && <div className="absolute top-full left-0 right-0 mt-2 z-50">{renderCalendar()}</div>}
        </div>

        <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="회원 이름 검색..."
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnlyMarked(!showOnlyMarked)}
              className={`flex-1 sm:flex-none px-4 py-2.5 lg:py-3 rounded-2xl border font-medium flex items-center justify-center gap-2 transition-all ${showOnlyMarked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className={`w-4 h-4 ${showOnlyMarked ? 'text-white' : 'text-slate-400'}`} />
              {showOnlyMarked ? '활동자 집중' : '참석/노쇼만'}
            </button>
            {isAdmin && (
              <button
                onClick={onResetDate}
                className="p-2.5 lg:p-3 rounded-2xl bg-white border border-slate-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
                title="오늘 기록 초기화"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => { if (!isAdmin) return alert('관리자 권한이 필요합니다.'); setIsEditingMetadata(!isEditingMetadata); }}
              className={`p-2.5 lg:p-3 rounded-2xl transition-all shadow-sm border ${isEditingMetadata ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <div className="relative flex-1">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                placeholder="회원 간편 추가 (이름 입력)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={!quickAddName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-blue-700 disabled:bg-slate-200 transition-all active:scale-95"
            >
              ADD
            </button>
          </form>
        </div>
      )}

      {isEditingMetadata && isAdmin && (
        <div className="bg-white border border-blue-200 p-4 lg:p-5 rounded-2xl shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              벙 세션 설정 ({formattedDate})
            </h4>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">세션 수: {tempCount}</span>
              <button onClick={handleRemoveSession} className="p-1 hover:bg-red-50 text-red-400 rounded"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleAddSession} className="p-1 hover:bg-blue-50 text-blue-400 rounded"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className={`space-y-2 p-3 rounded-xl border transition-opacity ${idx < tempCount ? 'bg-slate-50 border-slate-100 opacity-100' : 'bg-slate-100 border-transparent opacity-30 pointer-events-none'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{idx + 1}회차 정보</p>
                <input
                  type="text"
                  disabled={idx >= tempCount}
                  value={tempNames[idx] || ''}
                  onChange={(e) => { const n = [...tempNames]; n[idx] = e.target.value; setTempNames(n); }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="모임 이름"
                />
                <input
                  type="text"
                  disabled={idx >= tempCount}
                  value={tempHosts[idx] || ''}
                  onChange={(e) => { const h = [...tempHosts]; h[idx] = e.target.value; setTempHosts(h); }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="벙주 닉네임"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={saveMetadata} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold text-xs">저장</button>
            <button onClick={() => setIsEditingMetadata(false)} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold text-xs">취소</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 lg:p-4 font-semibold text-slate-700 text-xs lg:text-sm sticky left-0 bg-slate-50 z-10 w-32 lg:w-40 border-r border-slate-100">이름</th>
                {[...Array(sessionCount)].map((_, i) => (
                  <th key={i} className="p-3 lg:p-4 font-semibold text-slate-700 text-center min-w-[120px]">
                    <span className="truncate block text-[10px] lg:text-xs text-slate-500">{sessionNames[i] || `모임 ${i+1}`}</span>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <div className="bg-blue-50 text-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">벙주</div>
                      <span className="text-[10px] lg:text-xs font-bold text-slate-800 truncate max-w-[80px]">
                        {sessionHosts[i] || '-'}
                      </span>
                    </div>
                    {/* 세션별 참석 인원 합계 표시 */}
                    <div className="mt-2 text-center">
                      <span className="inline-block bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 shadow-sm">
                        참여: {sessionTotalAttended[i]}명
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-3 lg:p-4 font-semibold text-slate-700 text-xs text-center">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const memberStatus: SessionAttendance = currentDailyAttendance[member.id] || [0, 0, 0, 0];
                  // 활성화된 세션에 대해서만 합산 및 렌더링
                  const activeStatuses = memberStatus.slice(0, sessionCount);
                  const attendedCount = activeStatuses.filter(s => s === 1).length;
                  const noShowCount = activeStatuses.filter(s => s === 2).length;
                  const isAnyMarked = attendedCount > 0 || noShowCount > 0;

                  return (
                    <tr key={member.id} className={`transition-colors ${isAnyMarked ? 'bg-blue-50/10' : 'hover:bg-slate-50'}`}>
                      <td className={`p-3 lg:p-4 font-medium sticky left-0 z-10 border-r border-slate-100 transition-colors ${isAnyMarked ? 'bg-white text-blue-700' : 'bg-white text-slate-900'} text-sm lg:text-base`}>
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          {member.previousNames && member.previousNames.length > 0 && (
                            <span className="text-[9px] text-slate-400 font-normal leading-tight">
                              ({member.previousNames.join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      {activeStatuses.map((status, sessionIdx) => (
                        <td key={sessionIdx} className="p-1 lg:p-2 text-center">
                          <button
                            disabled={!isAdmin}
                            onClick={() => onUpdate(member.id, sessionIdx, null)}
                            className={`mx-auto w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-all border-2 ${
                              status === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 
                              status === 2 ? 'bg-red-50 border-red-300 text-red-500 shadow-sm' : 
                              'bg-white border-slate-200 text-slate-100'
                            } ${!isAdmin ? 'cursor-default opacity-90' : 'active:scale-90 touch-manipulation'}`}
                          >
                            {status === 1 && <Check className="w-6 h-6" />}
                            {status === 2 && <UserX className="w-6 h-6" />}
                            {status === 0 && <Check className="w-6 h-6 opacity-0" />}
                          </button>
                        </td>
                      ))}
                      <td className={`p-3 lg:p-4 text-center font-bold text-base lg:text-lg ${attendedCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                        <div className="flex flex-col items-center">
                          <span>{attendedCount}</span>
                          {noShowCount > 0 && <span className="text-[9px] text-red-400 font-black">노쇼 {noShowCount}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={sessionCount + 2} className="p-20 text-center text-slate-400"><Grid className="w-10 h-10 opacity-10 mx-auto mb-2" /><p className="text-sm">검색 결과가 없습니다.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGrid;
