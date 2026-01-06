
import { Member, AttendanceRecord, MetadataRecord, BannedMember, Suggestion, HallOfFameEntry, FirebaseConfig } from '../types';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, update, push, onDisconnect } from 'firebase/database';

const MEMBERS_KEY = 'club_members_v1';
const BANNED_KEY = 'club_banned_v1';
const ATTENDANCE_KEY = 'club_attendance_v1';
const METADATA_KEY = 'club_daily_metadata_v1';
const ONLINE_ATTENDANCE_KEY = 'club_online_attendance_v1';
const ONLINE_METADATA_KEY = 'club_online_metadata_v1';
const GLOBAL_SESSIONS_KEY = 'club_global_sessions_v1';
const CLUB_LINK_KEY = 'club_link_v1';
const SUGGESTIONS_KEY = 'club_suggestions_v1';
const HALL_OF_FAME_KEY = 'club_hall_of_fame_v1';
const FIREBASE_CONFIG_KEY = 'club_firebase_config_v1';

export const DEFAULT_SESSIONS = ['모임 1회', '모임 2회', '모임 3회', '모임 4회'];

let database: any = null;

export const storageService = {
  initFirebase: (config: FirebaseConfig) => {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      database = getDatabase(app);
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Firebase init failed", e);
      return false;
    }
  },

  getFirebaseConfig: (): FirebaseConfig | null => {
    const data = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  },

  isCloudEnabled: () => database !== null,

  subscribe: (callback: (data: any) => void) => {
    if (!database) return () => {};
    const dbRef = ref(database, '/');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });
  },

  trackPresence: (callback: (count: number) => void) => {
    if (!database) return;
    const presenceRef = ref(database, 'presence');
    const myPresenceRef = push(presenceRef);
    set(myPresenceRef, true);
    onDisconnect(myPresenceRef).remove();
    onValue(presenceRef, (snapshot) => {
      const count = snapshot.size || 0;
      callback(count);
    });
  },

  saveToCloud: async (data: any) => {
    if (!database) return;
    await set(ref(database, '/'), data);
  },

  getMembers: (): Member[] => {
    const data = localStorage.getItem(MEMBERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveMembers: (members: Member[]) => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    if (database) set(ref(database, 'members'), members);
  },
  getBannedMembers: (): BannedMember[] => {
    const data = localStorage.getItem(BANNED_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveBannedMembers: (members: BannedMember[]) => {
    localStorage.setItem(BANNED_KEY, JSON.stringify(members));
    if (database) set(ref(database, 'bannedMembers'), members);
  },
  getAttendance: (): AttendanceRecord => {
    const data = localStorage.getItem(ATTENDANCE_KEY);
    return data ? JSON.parse(data) : {};
  },
  saveAttendance: (attendance: AttendanceRecord) => {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
    if (database) set(ref(database, 'attendance'), attendance);
  },
  getOnlineAttendance: (): AttendanceRecord => {
    const data = localStorage.getItem(ONLINE_ATTENDANCE_KEY);
    return data ? JSON.parse(data) : {};
  },
  saveOnlineAttendance: (attendance: AttendanceRecord) => {
    localStorage.setItem(ONLINE_ATTENDANCE_KEY, JSON.stringify(attendance));
    if (database) set(ref(database, 'onlineAttendance'), attendance);
  },
  getMetadata: (): MetadataRecord => {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : {};
  },
  saveMetadata: (metadata: MetadataRecord) => {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    if (database) set(ref(database, 'metadata'), metadata);
  },
  getOnlineMetadata: (): MetadataRecord => {
    const data = localStorage.getItem(ONLINE_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  },
  saveOnlineMetadata: (metadata: MetadataRecord) => {
    localStorage.setItem(ONLINE_METADATA_KEY, JSON.stringify(metadata));
    if (database) set(ref(database, 'onlineMetadata'), metadata);
  },
  getGlobalSessionNames: (): string[] => {
    const data = localStorage.getItem(GLOBAL_SESSIONS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SESSIONS;
  },
  saveGlobalSessionNames: (names: string[]) => {
    localStorage.setItem(GLOBAL_SESSIONS_KEY, JSON.stringify(names));
    if (database) set(ref(database, 'globalSessionNames'), names);
  },
  getClubLink: (): string => {
    return localStorage.getItem(CLUB_LINK_KEY) || '';
  },
  saveClubLink: (link: string) => {
    localStorage.setItem(CLUB_LINK_KEY, link);
    if (database) set(ref(database, 'clubLink'), link);
  },
  getSuggestions: (): Suggestion[] => {
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveSuggestions: (suggestions: Suggestion[]) => {
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
    if (database) set(ref(database, 'suggestions'), suggestions);
  },
  getHallOfFame: (): HallOfFameEntry[] => {
    const data = localStorage.getItem(HALL_OF_FAME_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveHallOfFame: (entries: HallOfFameEntry[]) => {
    localStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify(entries));
    if (database) set(ref(database, 'hallOfFame'), entries);
  },
  
  exportAllData: () => {
    const data = {
      members: storageService.getMembers(),
      bannedMembers: storageService.getBannedMembers(),
      attendance: storageService.getAttendance(),
      metadata: storageService.getMetadata(),
      onlineAttendance: storageService.getOnlineAttendance(),
      onlineMetadata: storageService.getOnlineMetadata(),
      globalSessions: storageService.getGlobalSessionNames(),
      clubLink: storageService.getClubLink(),
      suggestions: storageService.getSuggestions(),
      hallOfFame: storageService.getHallOfFame(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `club_attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importAllData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.members) storageService.saveMembers(data.members);
      if (data.bannedMembers) storageService.saveBannedMembers(data.bannedMembers);
      if (data.attendance) storageService.saveAttendance(data.attendance);
      if (data.metadata) storageService.saveMetadata(data.metadata);
      if (data.onlineAttendance) storageService.saveOnlineAttendance(data.onlineAttendance);
      if (data.onlineMetadata) storageService.saveOnlineMetadata(data.onlineMetadata);
      if (data.globalSessions) storageService.saveGlobalSessionNames(data.globalSessions);
      if (data.clubLink) storageService.saveClubLink(data.clubLink);
      if (data.suggestions) storageService.saveSuggestions(data.suggestions);
      if (data.hallOfFame) storageService.saveHallOfFame(data.hallOfFame);
      
      if (database) {
        storageService.saveToCloud(data);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  clearMonthData: (year: number, month: number, attendance: AttendanceRecord): AttendanceRecord => {
    const newRecord = { ...attendance };
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    Object.keys(newRecord).forEach(date => {
      if (date.startsWith(monthStr)) {
        delete newRecord[date];
      }
    });
    return newRecord;
  }
};
