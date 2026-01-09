
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MemberManager from './components/MemberManager';
import AttendanceGrid from './components/AttendanceGrid';
import Dashboard from './components/Dashboard';
import AIReport from './components/AIReport';
import Settings from './components/Settings';
import BlacklistManager from './components/BlacklistManager';
import SuggestionBox from './components/SuggestionBox';
import HallOfFame from './components/HallOfFame';
import MonthlyStatistics from './components/MonthlyStatistics';
import { Member, AttendanceRecord, ViewMode, SessionAttendance, MetadataRecord, BannedMember, Suggestion, HallOfFameEntry, AttendanceStatus, FirebaseConfig } from './types';
import { storageService, DEFAULT_SESSIONS } from './services/storageService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [bannedMembers, setBannedMembers] = useState<BannedMember[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [metadata, setMetadata] = useState<MetadataRecord>({});
  const [onlineAttendance, setOnlineAttendance] = useState<AttendanceRecord>({});
  const [onlineMetadata, setOnlineMetadata] = useState<MetadataRecord>({});
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [globalSessionNames, setGlobalSessionNames] = useState<string[]>(DEFAULT_SESSIONS);
  const [clubLink, setClubLink] = useState('');
  const [clubNotice, setClubNotice] = useState('');

  // 로컬 시간 기준 YYYY-MM-DD 생성 함수
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadData = () => {
    setMembers(storageService.getMembers());
    setBannedMembers(storageService.getBannedMembers());
    setSuggestions(storageService.getSuggestions());
    setAttendance(storageService.getAttendance());
    setMetadata(storageService.getMetadata());
    setOnlineAttendance(storageService.getOnlineAttendance());
    setOnlineMetadata(storageService.getOnlineMetadata());
    setGlobalSessionNames(storageService.getGlobalSessionNames());
    setClubLink(storageService.getClubLink());
    setClubNotice(storageService.getClubNotice());
    setHallOfFame(storageService.getHallOfFame());
  };

  useEffect(() => {
    loadData();
    const savedAdmin = sessionStorage.getItem('is_admin') === 'true';
    if (savedAdmin) setIsAdmin(true);

    const cloudConfig = storageService.getFirebaseConfig();
    if (cloudConfig) {
      handleSetupFirebase(cloudConfig);
    }
  }, []);

  const handleSetupFirebase = (config: FirebaseConfig) => {
    if (storageService.initFirebase(config)) {
      setIsCloudSyncing(true);
      
      storageService.trackPresence((count) => {
        setOnlineUserCount(count);
      });

      storageService.subscribe((data) => {
        if (data.members) setMembers(data.members);
        if (data.bannedMembers) setBannedMembers(data.bannedMembers);
        if (data.attendance) setAttendance(data.attendance);
        if (data.metadata) setMetadata(data.metadata);
        if (data.onlineAttendance) setOnlineAttendance(data.onlineAttendance);
        if (data.onlineMetadata) setOnlineMetadata(data.onlineMetadata);
        if (data.globalSessionNames) setGlobalSessionNames(data.globalSessionNames);
        if (data.clubLink) setClubLink(data.clubLink);
        if (data.clubNotice) setClubNotice(data.clubNotice);
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.hallOfFame) setHallOfFame(data.hallOfFame);
      });
    }
  };

  const handleAdminToggle = (status: boolean) => {
    setIsAdmin(status);
    sessionStorage.setItem('is_admin', status.toString());
  };

  const handleUpdateClubNotice = (notice: string) => {
    if (!isAdmin) return;
    setClubNotice(notice);
    storageService.saveClubNotice(notice);
  };

  const dateStr = getLocalDateStr(selectedDate);
  
  const currentDailyMeta = metadata[dateStr] || {};
  const currentSessionNames = currentDailyMeta.sessionNames || globalSessionNames;
  const currentSessionHosts = currentDailyMeta.sessionHosts || ['', '', '', ''];
  const currentSessionCount = currentDailyMeta.sessionCount || 1;

  const currentOnlineMeta = onlineMetadata[dateStr] || {};
  const currentOnlineNames = currentOnlineMeta.sessionNames || ['온라인 1', '온라인 2', '온라인 3', '온라인 4'];
  const currentOnlineHosts = currentOnlineMeta.sessionHosts || ['', '', '', ''];
  const currentOnlineCount = currentOnlineMeta.sessionCount || 1;

  const handleAddMember = (name: string, joinedAt: string = '2026-01-01') => {
    if (!isAdmin) return;
    if (bannedMembers.some(bm => bm.name === name)) {
      alert('해당 닉네임은 블랙리스트에 등록되어 있어 추가할 수 없습니다.');
      return;
    }
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      joinedAt: joinedAt,
      previousNames: []
    };
    const updated = [...members, newMember];
    setMembers(updated);
    storageService.saveMembers(updated);
  };

  const handleUpdateMember = (id: string, updates: Partial<Member>) => {
    if (!isAdmin) return;
    const updated = members.map(m => {
      if (m.id === id) {
        let newHistory = m.previousNames || [];
        if (updates.name && updates.name !== m.name) {
          newHistory = [m.name, ...newHistory].slice(0, 3);
        }
        return { ...m, ...updates, previousNames: newHistory };
      }
      return m;
    });
    setMembers(updated);
    storageService.saveMembers(updated);
  };

  const handleBulkUpdateMembers = (updatedMembers: Member[]) => {
    if (!isAdmin) return;
    const finalMembers = updatedMembers.map(updated => {
      const original = members.find(m => m.id === updated.id);
      if (original && updated.name !== original.name) {
        const currentHistory = original.previousNames || [];
        const newHistory = [original.name, ...currentHistory].slice(0, 3);
        return { ...updated, previousNames: newHistory };
      }
      return updated;
    });
    setMembers(finalMembers);
    storageService.saveMembers(finalMembers);
  };

  const handleDeleteMember = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('정말 이 회원을 삭제하시겠습니까? 관련 데이터가 모두 사라집니다.')) {
      const updated = members.filter(m => m.id !== id);
      setMembers(updated);
      storageService.saveMembers(updated);
      
      const updateAt = (record: AttendanceRecord, setRecord: (r: AttendanceRecord) => void, save: (r: AttendanceRecord) => void) => {
        const newR = { ...record };
        Object.keys(newR).forEach(date => {
          if (newR[date]) delete newR[date][id];
        });
        setRecord(newR);
        save(newR);
      }
      updateAt(attendance, setAttendance, storageService.saveAttendance);
      updateAt(onlineAttendance, setOnlineAttendance, storageService.saveOnlineAttendance);
    }
  };

  const handleAddBanned = (name: string, reason: string) => {
    if (!isAdmin) return;
    const newBanned: BannedMember = {
      id: crypto.randomUUID(),
      name,
      reason,
      bannedAt: getLocalDateStr(new Date())
    };
    const updated = [...bannedMembers, newBanned];
    setBannedMembers(updated);
    storageService.saveBannedMembers(updated);
  };

  const handleDeleteBanned = (id: string) => {
    if (!isAdmin) return;
    const updated = bannedMembers.filter(bm => bm.id !== id);
    setBannedMembers(updated);
    storageService.saveBannedMembers(updated);
  };

  const handleAddSuggestion = (content: string, author: string) => {
    const newSuggestion: Suggestion = {
      id: crypto.randomUUID(),
      content,
      author: author || '익명',
      createdAt: new Date().toLocaleString()
    };
    const updated = [newSuggestion, ...suggestions];
    setSuggestions(updated);
    storageService.saveSuggestions(updated);
  };

  const handleDeleteSuggestion = (id: string) => {
    if (!isAdmin) return;
    const updated = suggestions.filter(s => s.id !== id);
    setSuggestions(updated);
    storageService.saveSuggestions(updated);
  };

  const handleAddHallOfFame = (entry: Omit<HallOfFameEntry, 'id'>) => {
    if (!isAdmin) return;
    const newEntry: HallOfFameEntry = {
      ...entry,
      id: crypto.randomUUID()
    };
    const updated = [newEntry, ...hallOfFame]; // 새로 등록한 것을 가장 앞에
    setHallOfFame(updated);
    storageService.saveHallOfFame(updated);
  };

  const handleDeleteHallOfFame = (id: string) => {
    if (!isAdmin) return;
    const updated = hallOfFame.filter(e => e.id !== id);
    setHallOfFame(updated);
    storageService.saveHallOfFame(updated);
  };

  const handleReorderHallOfFame = (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const newEntries = [...hallOfFame];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newEntries.length) {
      [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
      setHallOfFame(newEntries);
      storageService.saveHallOfFame(newEntries);
    }
  };

  const handleUpdateAttendance = (memberId: string, sessionIdx: number, value: any) => {
    if (!isAdmin) return;
    const newAttendance = { ...attendance };
    if (!newAttendance[dateStr]) newAttendance[dateStr] = {};
    if (!newAttendance[dateStr][memberId]) {
      newAttendance[dateStr][memberId] = [0, 0, 0, 0];
    }
    const currentSessions = [...newAttendance[dateStr][memberId]] as SessionAttendance;
    const current = currentSessions[sessionIdx];
    const next = ((Number(current) + 1) % 3) as AttendanceStatus;
    currentSessions[sessionIdx] = next;
    newAttendance[dateStr][memberId] = currentSessions;
    setAttendance(newAttendance);
    storageService.saveAttendance(newAttendance);
  };

  const handleUpdateOnlineAttendance = (memberId: string, sessionIdx: number, value: any) => {
    if (!isAdmin) return;
    const newAttendance = { ...onlineAttendance };
    if (!newAttendance[dateStr]) newAttendance[dateStr] = {};
    if (!newAttendance[dateStr][memberId]) {
      newAttendance[dateStr][memberId] = [0, 0, 0, 0];
    }
    const currentSessions = [...newAttendance[dateStr][memberId]] as SessionAttendance;
    const current = currentSessions[sessionIdx];
    const next = ((Number(current) + 1) % 3) as AttendanceStatus;
    currentSessions[sessionIdx] = next;
    newAttendance[dateStr][memberId] = currentSessions;
    setOnlineAttendance(newAttendance);
    storageService.saveOnlineAttendance(newAttendance);
  };

  const handleResetDailyAttendance = (type: 'offline' | 'online') => {
    if (!isAdmin) return;
    const formatted = selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    if (window.confirm(`${formatted}의 모든 ${type === 'offline' ? '벙' : '온라인'} 출석 기록을 초기화하시겠습니까?`)) {
      if (type === 'offline') {
        const newAttendance = { ...attendance };
        delete newAttendance[dateStr];
        setAttendance(newAttendance);
        storageService.saveAttendance(newAttendance);
      } else {
        const newOnline = { ...onlineAttendance };
        delete newOnline[dateStr];
        setOnlineAttendance(newOnline);
        storageService.saveOnlineAttendance(newOnline);
      }
    }
  };

  const handleMoveSession = (srcDate: string, srcIdx: number, targetDate: string, targetIdx: number, isOnline: boolean) => {
    if (!isAdmin) return;
    
    const currentAtt = isOnline ? { ...onlineAttendance } : { ...attendance };
    const currentMeta = isOnline ? { ...onlineMetadata } : { ...metadata };
    
    if (currentAtt[srcDate]) {
      if (!currentAtt[targetDate]) currentAtt[targetDate] = {};
      
      Object.keys(currentAtt[srcDate]).forEach(memberId => {
        const srcMemberSessions = [...currentAtt[srcDate][memberId]] as SessionAttendance;
        const val = srcMemberSessions[srcIdx];
        
        if (!currentAtt[targetDate][memberId]) currentAtt[targetDate][memberId] = [0, 0, 0, 0];
        const targetMemberSessions = [...currentAtt[targetDate][memberId]] as SessionAttendance;
        
        targetMemberSessions[targetIdx] = val;
        currentAtt[targetDate][memberId] = targetMemberSessions;
        
        srcMemberSessions[srcIdx] = 0;
        currentAtt[srcDate][memberId] = srcMemberSessions;
      });
    }

    if (currentMeta[srcDate]) {
      if (!currentMeta[targetDate]) {
        currentMeta[targetDate] = {
          sessionNames: isOnline ? ['온라인 1','온라인 2','온라인 3','온라인 4'] : [...globalSessionNames],
          sessionHosts: ['','','',''],
          sessionCount: 1
        };
      }
      
      const srcNames = [...(currentMeta[srcDate].sessionNames || [])];
      const srcHosts = [...(currentMeta[srcDate].sessionHosts || [])];
      
      const targetNames = [...(currentMeta[targetDate].sessionNames || [])];
      const targetHosts = [...(currentMeta[targetDate].sessionHosts || [])];
      
      if (srcNames[srcIdx]) {
        targetNames[targetIdx] = srcNames[srcIdx];
        srcNames[srcIdx] = isOnline ? `온라인 ${srcIdx+1}` : `모임 ${srcIdx+1}`;
      }
      
      if (srcHosts[srcIdx]) {
        targetHosts[targetIdx] = srcHosts[srcIdx];
        srcHosts[srcIdx] = '';
      }
      
      currentMeta[targetDate].sessionNames = targetNames;
      currentMeta[targetDate].sessionHosts = targetHosts;
      if (currentMeta[targetDate].sessionCount! < targetIdx + 1) {
        currentMeta[targetDate].sessionCount = targetIdx + 1;
      }
      
      currentMeta[srcDate].sessionNames = srcNames;
      currentMeta[srcDate].sessionHosts = srcHosts;
    }

    if (isOnline) {
      setOnlineAttendance(currentAtt);
      setOnlineMetadata(currentMeta);
      storageService.saveOnlineAttendance(currentAtt);
      storageService.saveOnlineMetadata(currentMeta);
    } else {
      setAttendance(currentAtt);
      setMetadata(currentMeta);
      storageService.saveAttendance(currentAtt);
      storageService.saveMetadata(currentMeta);
    }
    
    alert('세션 이동이 완료되었습니다.');
  };

  const handleUpdateDailyMetadata = (names: string[], hosts: string[], count: number) => {
    if (!isAdmin) return;
    const newMetadata = { ...metadata };
    if (!newMetadata[dateStr]) newMetadata[dateStr] = {};
    newMetadata[dateStr].sessionNames = names;
    newMetadata[dateStr].sessionHosts = hosts;
    newMetadata[dateStr].sessionCount = count;
    setMetadata(newMetadata);
    storageService.saveMetadata(newMetadata);
  };

  const handleUpdateOnlineMetadata = (names: string[], hosts: string[], count: number) => {
    if (!isAdmin) return;
    const newMetadata = { ...onlineMetadata };
    if (!newMetadata[dateStr]) newMetadata[dateStr] = {};
    newMetadata[dateStr].sessionNames = names;
    newMetadata[dateStr].sessionHosts = hosts;
    newMetadata[dateStr].sessionCount = count;
    setOnlineMetadata(newMetadata);
    storageService.saveOnlineMetadata(newMetadata);
  };

  const handleClearMonth = () => {
    if (!isAdmin) return;
    const updated = storageService.clearMonthData(selectedDate.getFullYear(), selectedDate.getMonth(), attendance);
    setAttendance(updated);
    storageService.saveAttendance(updated);
    
    const updatedOnline = storageService.clearMonthData(selectedDate.getFullYear(), selectedDate.getMonth(), onlineAttendance);
    setOnlineAttendance(updatedOnline);
    storageService.saveOnlineAttendance(updatedOnline);
  };

  const handleUpdateClubLink = (link: string) => {
    if (!isAdmin) return;
    setClubLink(link);
    storageService.saveClubLink(link);
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      isAdmin={isAdmin} 
      setIsAdmin={handleAdminToggle}
      onlineUserCount={onlineUserCount}
    >
      <div className="fixed top-20 right-10 z-50">
        {isCloudSyncing ? (
          <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            LIVE CLOUD SYNC
          </div>
        ) : (
          <div className="bg-slate-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            LOCAL ONLY
          </div>
        )}
      </div>

      {activeView === ViewMode.DASHBOARD && (
        <Dashboard 
          members={members} 
          attendance={attendance} 
          onlineAttendance={onlineAttendance}
          metadata={metadata}
          onlineMetadata={onlineMetadata}
          globalSessionNames={globalSessionNames}
          selectedMonth={selectedDate}
          setSelectedMonth={setSelectedDate}
          onClearMonth={handleClearMonth}
          isAdmin={isAdmin}
          clubLink={clubLink}
          clubNotice={clubNotice}
          onUpdateNotice={handleUpdateClubNotice}
        />
      )}
      
      {activeView === ViewMode.ATTENDANCE && (
        <AttendanceGrid 
          members={members}
          attendance={attendance}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onUpdate={handleUpdateAttendance}
          onResetDate={() => handleResetDailyAttendance('offline')}
          onMoveSession={(srcIdx, targetDate, targetIdx) => handleMoveSession(dateStr, srcIdx, targetDate, targetIdx, false)}
          sessionNames={currentSessionNames}
          sessionHosts={currentSessionHosts}
          sessionCount={currentSessionCount}
          onUpdateMetadata={handleUpdateDailyMetadata}
          onAddMember={handleAddMember}
          isAdmin={isAdmin}
          title="벙 참여 현황"
        />
      )}

      {activeView === ViewMode.MONTHLY_STATISTICS && (
        <MonthlyStatistics 
          members={members}
          attendance={attendance}
          metadata={metadata}
          onlineAttendance={onlineAttendance}
          onlineMetadata={onlineMetadata}
          selectedMonth={selectedDate}
          setSelectedMonth={setSelectedDate}
        />
      )}

      {activeView === ViewMode.ONLINE_ATTENDANCE && (
        <AttendanceGrid 
          members={members}
          attendance={onlineAttendance}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onUpdate={handleUpdateOnlineAttendance}
          onResetDate={() => handleResetDailyAttendance('online')}
          onMoveSession={(srcIdx, targetDate, targetIdx) => handleMoveSession(dateStr, srcIdx, targetDate, targetIdx, true)}
          sessionNames={currentOnlineNames}
          sessionHosts={currentOnlineHosts}
          sessionCount={currentOnlineCount}
          onUpdateMetadata={handleUpdateOnlineMetadata}
          onAddMember={handleAddMember}
          isAdmin={isAdmin}
          title="온라인 벙 현황"
        />
      )}
      
      {activeView === ViewMode.HALL_OF_FAME && (
        <HallOfFame 
          entries={hallOfFame}
          members={members}
          onAdd={handleAddHallOfFame}
          onDelete={handleDeleteHallOfFame}
          onReorder={handleReorderHallOfFame}
          isAdmin={isAdmin}
        />
      )}

      {activeView === ViewMode.MEMBERS && (
        <MemberManager 
          members={members}
          attendance={attendance}
          onlineAttendance={onlineAttendance}
          selectedDate={selectedDate}
          onAdd={handleAddMember}
          onUpdate={handleUpdateMember}
          onBulkUpdate={handleBulkUpdateMembers}
          onDelete={handleDeleteMember}
          isAdmin={isAdmin}
        />
      )}

      {activeView === ViewMode.SUGGESTIONS && (
        <SuggestionBox 
          suggestions={suggestions}
          onAdd={handleAddSuggestion}
          onDelete={handleDeleteSuggestion}
          isAdmin={isAdmin}
        />
      )}

      {activeView === ViewMode.AI_REPORT && (
        <AIReport members={members} attendance={attendance} />
      )}

      {activeView === ViewMode.SETTINGS && (
        <Settings 
          onDataImport={loadData} 
          isAdmin={isAdmin} 
          clubLink={clubLink} 
          onUpdateClubLink={handleUpdateClubLink}
          onSetupFirebase={handleSetupFirebase}
        />
      )}

      {activeView === ViewMode.BLACKLIST && (
        <BlacklistManager bannedMembers={bannedMembers} onAdd={handleAddBanned} onDelete={handleDeleteBanned} isAdmin={isAdmin} />
      )}
    </Layout>
  );
};

export default App;
