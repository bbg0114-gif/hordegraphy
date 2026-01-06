
import React, { useState, useRef } from 'react';
import { HallOfFameEntry, Member } from '../types';
import { Crown, Plus, Image as ImageIcon, Trash2, Calendar, User, History, X, Save, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface HallOfFameProps {
  entries: HallOfFameEntry[];
  members: Member[];
  onAdd: (entry: Omit<HallOfFameEntry, 'id'>) => void;
  onDelete: (id: string) => void;
  onReorder: (index: number, direction: 'up' | 'down') => void;
  isAdmin: boolean;
}

const HallOfFame: React.FC<HallOfFameProps> = ({ entries, members, onAdd, onDelete, onReorder, isAdmin }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [imageData, setImageData] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 리사이징 및 압축 함수
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; // 최대 너비 제한 (용량 최적화)
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // JPEG 형식으로 압축 (품질 0.7)
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(base64Str);
        }
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64);
        setImageData(compressed);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && sessionCount > 0 && imageData) {
      onAdd({ name, imageData, sessionCount, year, month });
      setName('');
      setSessionCount(0);
      setImageData('');
      setShowAddForm(false);
    } else {
      alert('모든 필드를 채워주세요 (사진 포함)');
    }
  };

  const displayEntries = entries;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
        <Crown className="absolute right-[-20px] top-[-20px] w-64 h-64 opacity-20 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl shadow-xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight italic">Hall of Fame</h2>
              <p className="text-sm font-bold text-amber-100 uppercase tracking-widest mt-1">이달의 벙왕 명예의 전당</p>
            </div>
          </div>
          <p className="text-amber-50 font-medium leading-relaxed max-w-xl text-lg">
            매달 가장 열정적으로 모임에 참여해주신 분들을 기록합니다. 
            호드의 역사와 함께하는 명예로운 얼굴들을 만나보세요.
          </p>
          
          {isAdmin && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-8 px-8 py-4 bg-white text-amber-600 rounded-2xl font-black hover:bg-amber-50 transition-all shadow-xl flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-6 h-6" />
              벙왕 등록하기
            </button>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 lg:p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Crown className="w-8 h-8 text-amber-500" />
                  새로운 벙왕 등록
                </h3>
                <button onClick={() => setShowAddForm(false)} className="p-3 hover:bg-slate-100 rounded-2xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Image Upload Area */}
                  <div 
                    onClick={() => !isProcessingImage && fileInputRef.current?.click()}
                    className={`relative aspect-[3/4] rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${imageData ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300 bg-slate-50'}`}
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-400">이미지 최적화 중...</p>
                      </div>
                    ) : imageData ? (
                      <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400">대표 이미지 업로드</p>
                        <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold tracking-widest">Auto Resizing Enabled</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이름 / 닉네임</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        list="member-names"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none font-bold"
                        placeholder="벙왕 닉네임"
                      />
                      <datalist id="member-names">
                        {members.map(m => <option key={m.id} value={m.name} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">참여 횟수 (오프라인)</label>
                    <input 
                      type="number" 
                      value={sessionCount}
                      onChange={(e) => setSessionCount(parseInt(e.target.value) || 0)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none font-black"
                      placeholder="참여 횟수"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">년도</label>
                      <select 
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none font-bold"
                      >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">월</label>
                      <select 
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none font-bold"
                      >
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}월</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={isProcessingImage}
                    className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-6 h-6" />
                    명예의 전당 등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grid Display */}
      {displayEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 px-2">
          {displayEntries.map((entry, index) => (
            <div key={entry.id} className="group relative">
              {/* Photo Frame Style */}
              <div className="bg-white p-4 pb-8 lg:p-6 lg:pb-12 rounded-sm shadow-2xl transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-1 border-t-[1px] border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Image Container */}
                <div className="aspect-[3/4] overflow-hidden bg-slate-100 mb-6 rounded-sm relative">
                  <img src={entry.imageData} alt={entry.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute top-4 left-4">
                    <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                      <Crown className="w-3 h-3" />
                      MONTHLY KING
                    </div>
                  </div>
                  
                  {/* Reorder Buttons Over Image */}
                  {isAdmin && (
                    <div className="absolute inset-x-0 bottom-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        disabled={index === 0}
                        onClick={() => onReorder(index, 'up')}
                        className="p-2 bg-white/90 text-slate-900 rounded-full hover:bg-white disabled:opacity-30 disabled:hover:bg-white/90"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        disabled={index === displayEntries.length - 1}
                        onClick={() => onReorder(index, 'down')}
                        className="p-2 bg-white/90 text-slate-900 rounded-full hover:bg-white disabled:opacity-30 disabled:hover:bg-white/90"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="text-center space-y-2">
                  <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {entry.year}년 {entry.month}월
                  </p>
                  <h4 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter italic">
                    {entry.name}
                  </h4>
                  <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">오프라인 참석</span>
                    <span className="text-lg font-black text-blue-600">{entry.sessionCount}<span className="text-xs ml-0.5">회</span></span>
                  </div>
                </div>

                {/* Admin Action */}
                {isAdmin && (
                  <button 
                    onClick={() => { if(window.confirm('명예의 전당에서 삭제하시겠습니까?')) onDelete(entry.id); }}
                    className="absolute bottom-4 right-4 p-3 bg-red-50 text-red-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Fake Depth Shadow */}
              <div className="absolute -bottom-4 left-4 right-4 h-8 bg-slate-900/5 blur-xl -z-10 group-hover:blur-2xl transition-all" />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center flex flex-col items-center gap-6 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
          <History className="w-20 h-20 text-slate-100" />
          <div>
            <p className="text-2xl font-black text-slate-300 uppercase tracking-tight">명예의 전당이 비어있습니다</p>
            <p className="text-sm font-bold text-slate-400 mt-2">첫 번째 벙왕을 등록하여 역사를 시작하세요.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
