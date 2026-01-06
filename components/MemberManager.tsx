
import React, { useState, useMemo, useEffect } from 'react';
import { Member, AttendanceRecord, AttendanceStatus } from '../types';
import { UserPlus, Trash2, Search, CalendarDays, Sparkles, UserCheck, Clock, AlertCircle, Edit2, Check, X, Lock, ShieldCheck, User as UserIcon, Save, Table as TableIcon, Users, UserRoundPlus, Zap, Trophy, Crown, UserX } from 'lucide-react';
import { matchSearch } from '../utils/chosung';

interface MemberManagerProps {
  members: Member[];
  attendance: AttendanceRecord;
  onlineAttendance: AttendanceRecord;
  selectedDate: Date;
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Member>) => void;
  onBulkUpdate: (updatedMembers: Member[]) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const MemberManager: React.FC<MemberManagerProps> = ({ 
  members, 
  attendance, 
  onlineAttendance,
  selectedDate, 
  onAdd, 
  onUpdate,
  onBulkUpdate,
  onDelete,
  isAdmin
}) => {
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [bulkData, setBulkData] = useState<Member[]>([]);

  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      if (a.isStaff && !b.isStaff) return -1;
      if (!a.isStaff && b.isStaff) return 1;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    return sortedMembers.filter(m => matchSearch(m.name, searchTerm));
  }, [sortedMembers, searchTerm]);

  useEffect(() => {
    if (isBulkEdit) {
      setBulkData([...sortedMembers]);
    }
  }, [isBulkEdit, sortedMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const handleBulkChange = (id: string, field: keyof Member, value: any) => {
    setBulkData(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSaveBulk = () => {
    if (window.confirm('전체 변경 사항을 저장하시겠습니까?')) {
      onBulkUpdate(bulkData);
      setIsBulkEdit(false);
    }
  };

  const getLastAttendanceDate = (memberId: string) => {
    const dates = Object.keys(attendance).sort((a, b) => b.localeCompare(a));
    for (const date of dates) {
      const dayData = attendance[date];
      if (dayData[memberId]?.some(s => Number(s) === 1)) return date;
    }
    return null;
  };

  const getTotalAttendanceCount = (memberId: string) => {
    let total = 0;
    const calc = (rec: AttendanceRecord) => {
      Object.values(rec).forEach(day => {
        if (day[memberId]) {
          total += day[memberId].filter(s => Number(s) === 1).length;
        }
      });
    }
    calc(attendance);
    calc(onlineAttendance);
    return total;
  };

  const getTotalNoShowCount = (memberId: string) => {
    let total = 0;
    const calc = (rec: AttendanceRecord) => {
      Object.values(rec).forEach(day => {
        if (day[memberId]) {
          total += day[memberId].filter(s => Number(s) === 2).length;
        }
      });
    }
    calc(attendance);
    calc(onlineAttendance);
    return total;
  };

  const getDaysDiff = (dateStr: string) => {
    const lastDate = new Date(dateStr);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const newMembersThisMonth = members.filter(m => m.joinedAt.startsWith(monthPrefix));
  const staffCount = members.filter(m => m.isStaff).length;
  const leaderCount = members.filter(m => m.isLeader).length;
  const inactiveCount = members.filter(m => {
    const lastDate = getLastAttendanceDate(m.id);
    if (!lastDate) return false;
    const isNew = m.joinedAt.startsWith(monthPrefix);
    const days = getDaysDiff(lastDate);
    return (isNew && days >= 60) || (!isNew && days >= 120);
  }).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {!isBulkEdit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:shadow-xl hover:shadow-blue-50 transition-all">
            <div className="absolute top-[-10px] right-[-10px] bg-blue-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
            <Users className="w-8 h-8 text-blue-600 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">전체 회원</p>
              <h4 className="text-4xl lg:text-5xl font-black text-slate-900 mt-1">{members.length}<span className="text-lg font-bold text-slate-400 ml-1">명</span></h4>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> 방장 {leaderCount}</span>
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100">운영진 {staffCount}</span>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">일반 {members.length - staffCount - leaderCount}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:shadow-xl hover:shadow-green-50 transition-all">
            <div className="absolute top-[-10px] right-[-10px] bg-green-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
            <UserRoundPlus className="w-8 h-8 text-green-600 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{month + 1}월 신규 가입</p>
              <h4 className="text-4xl lg:text-5xl font-black text-slate-900 mt-1">{newMembersThisMonth.length}<span className="text-lg font-bold text-slate-400 ml-1">명</span></h4>
              <div className="mt-4 flex -space-x-2 overflow-hidden">
                {newMembersThisMonth.slice(0, 5).map((m, i) => (
                  <div key={m.id} className="w-7 h-7 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={m.name}>{m.name[0]}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:shadow-xl hover:shadow-red-50 transition-all">
            <div className="absolute top-[-10px] right-[-10px] bg-red-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
            <Zap className="w-8 h-8 text-red-500 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">장기 휴면 관리</p>
              <h4 className="text-4xl lg:text-5xl font-black text-slate-900 mt-1">{inactiveCount}<span className="text-lg font-bold text-slate-400 ml-1">명</span></h4>
              <p className="text-[10px] font-bold text-red-400 mt-4 leading-relaxed">최근 4개월간 참석 기록이 없는 인원입니다.</p>
            </div>
          </div>
        </div>
      )}

      {!isBulkEdit && newMembersThisMonth.length > 0 && (
        <div className="bg-white rounded-3xl p-5 lg:px-8 border border-blue-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100"><Sparkles className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{month + 1}월의 새로운 식구들</h3>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">New Faces Highlight</p>
              </div>
            </div>
            <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-3">
                {newMembersThisMonth.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl shrink-0 hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">{member.name[0]}</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-none">{member.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{member.joinedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && !isBulkEdit && (
        <div className="bg-white rounded-[32px] p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <h3 className="text-[10px] font-black mb-2 text-slate-400 flex items-center gap-2 uppercase tracking-widest"><UserPlus className="w-3.5 h-3.5 text-blue-600" /> 신규 회원 퀵 추가 (기본 가입일: 2026-01-01)</h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새로운 회원의 이름을 입력하세요" className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-sm" />
              <button type="submit" disabled={!newName.trim()} className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:bg-slate-300 transition-all text-sm active:scale-95">추가</button>
            </form>
          </div>
          <div className="shrink-0 pt-0 md:pt-5">
            <button onClick={() => setIsBulkEdit(true)} className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200 text-sm"><TableIcon className="w-4 h-4" /> 일괄 편집</button>
          </div>
        </div>
      )}

      {isBulkEdit && (
        <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-2xl flex items-center justify-between sticky top-4 z-50">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl"><Edit2 className="w-6 h-7" /></div>
            <div>
              <h3 className="text-xl font-black tracking-tight">일괄 편집 모드</h3>
              <p className="text-sm text-indigo-100 font-medium">정보를 수정한 후 저장 버튼을 누르세요.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveBulk} className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"><Save className="w-5 h-5" /> 저장</button>
            <button onClick={() => setIsBulkEdit(false)} className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-400 transition-all">취소</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Member List</h3>
            <p className="text-[10px] text-slate-400 font-black mt-0.5 uppercase tracking-widest">Active Database System</p>
          </div>
          {!isBulkEdit && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="회원 이름 또는 초성 검색..." className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-slate-100 outline-none transition-all" />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {isBulkEdit ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">방장</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">운영진</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">이름</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">가입일</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulkData.map((m) => (
                  <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4 text-center"><input type="checkbox" checked={!!m.isLeader} onChange={(e) => handleBulkChange(m.id, 'isLeader', e.target.checked)} className="w-5 h-5 accent-amber-500 cursor-pointer rounded-lg" /></td>
                    <td className="p-4 text-center"><input type="checkbox" checked={!!m.isStaff} onChange={(e) => handleBulkChange(m.id, 'isStaff', e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" /></td>
                    <td className="p-3"><input type="text" value={m.name} onChange={(e) => handleBulkChange(m.id, 'name', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black" /></td>
                    <td className="p-3"><input type="date" value={m.joinedAt} onChange={(e) => handleBulkChange(m.id, 'joinedAt', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold" /></td>
                    <td className="p-4 text-center"><button onClick={() => setBulkData(prev => prev.filter(item => item.id !== m.id))} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const lastAttendance = getLastAttendanceDate(member.id);
                  const totalAttendance = getTotalAttendanceCount(member.id);
                  const totalNoShow = getTotalNoShowCount(member.id);
                  const isNewThisMonth = member.joinedAt.startsWith(monthPrefix);
                  const daysPassed = lastAttendance ? getDaysDiff(lastAttendance) : 0;
                  const isInactive = lastAttendance && ((isNewThisMonth && daysPassed >= 60) || (!isNewThisMonth && daysPassed >= 120));

                  return (
                    <div key={member.id} className={`p-5 lg:p-6 flex items-center justify-between hover:bg-slate-50/80 transition-all group ${member.isLeader ? 'bg-amber-50/20' : member.isStaff ? 'bg-indigo-50/20' : ''}`}>
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center font-black text-lg lg:text-xl transition-all shrink-0 ${member.isLeader ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : member.isStaff ? 'bg-indigo-600 text-white' : isNewThisMonth ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {member.isLeader ? <Crown className="w-6 h-6 lg:w-8 lg:h-8" /> : member.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-black text-lg transition-colors truncate ${member.isLeader ? 'text-amber-800' : member.isStaff ? 'text-indigo-800' : 'text-slate-900'}`}>{member.name}</h4>
                            <div className="flex items-center gap-1.5">
                              {member.isLeader && <span className="flex items-center gap-1 text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm"><Crown className="w-2.5 h-2.5" /> 방장</span>}
                              {member.isStaff && <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">운영진</span>}
                              {isNewThisMonth && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">NEW</span>}
                              {isInactive && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-red-200">INACTIVE</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold"><CalendarDays className="w-3 h-3" /> <span>가입: {member.joinedAt}</span></div>
                            <div className={`flex items-center gap-1 text-[10px] ${isInactive ? 'text-red-500' : 'text-slate-500'} font-bold`}><Clock className="w-3 h-3" /> <span>최근: {lastAttendance || '-'} ({daysPassed}일 전)</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 lg:gap-10">
                        {/* Attendance Count with No-show small below */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tighter leading-none">{totalAttendance}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SESSIONS</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-black text-red-400 leading-none">{totalNoShow}</span>
                            <span className="text-[8px] font-black text-red-300 uppercase tracking-widest">NO-SHOWS</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setIsBulkEdit(true)} className="p-3 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => onDelete(member.id)} className="p-3 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center flex flex-col items-center gap-4 text-slate-300"><Search className="w-10 h-10 opacity-10" /><p className="text-sm font-black uppercase tracking-tighter">No Members Found</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManager;
