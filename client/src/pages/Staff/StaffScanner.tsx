import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  RefreshCw, 
  Sparkles,
  Ticket as TicketIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export const StaffScanner: React.FC = () => {
  const [scanInput, setScanInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([
    {
      code: 'CL-839210',
      movie: 'Coyote vs. Acme',
      seats: 'E5, E6',
      time: '19:30',
      status: 'SUCCESS',
      scannedAt: '07:40',
    },
    {
      code: 'CL-624109',
      movie: 'Bầy Xác Sống',
      seats: 'F7, F8',
      time: '20:15',
      status: 'DOUBLE_SCAN',
      scannedAt: '07:35',
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically for hardware scanners
  useEffect(() => {
    inputRef.current?.focus();
  }, [scanResult]);

  // Audio synthesize sound effect
  const playSound = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        // High chime
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        // Low buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      // Check for double scan demo condition
      if (code === 'CL-624109' || code.includes('USED')) {
        playSound(false);
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        setScanResult({
          status: 'DUPLICATE',
          title: 'CẢNH BÁO: VÉ ĐÃ SỬ DỤNG!',
          message: 'Vé này đã được nhân viên soát lúc 07:35. Tuyệt đối KHÔNG cho khách vào rạp!',
          code,
          movie: 'Bầy Xác Sống',
          room: 'Phòng 02 - Dolby Atmos',
          seats: 'F7, F8',
          customer: 'Trần Thị Mai',
        });
      } else {
        // Successful check-in
        playSound(true);
        if ('vibrate' in navigator) navigator.vibrate(150);
        const newResult = {
          status: 'SUCCESS',
          title: 'VÉ HỢP LỆ — MỜI KHÁCH VÀO RẠP',
          message: 'Soát vé thành công!',
          code: code.startsWith('CL-') || code.startsWith('TK-') ? code : `CL-${code}`,
          movie: 'Coyote vs. Acme',
          room: 'Phòng 01 - IMAX Laser',
          seats: 'E5, E6',
          time: '19:30',
          customer: 'Nguyễn Văn A',
        };
        setScanResult(newResult);
        setScanHistory((prev) => [
          {
            code: newResult.code,
            movie: newResult.movie,
            seats: newResult.seats,
            time: newResult.time,
            status: 'SUCCESS',
            scannedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 4),
        ]);
        toast.success(`Soát vé thành công [${newResult.code}]!`);
      }
      setScanInput('');
    }, 180);
  };

  const handleReset = () => {
    setScanResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">Cửa Soát Vé Số 1 — Sẵn Sàng</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
              soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}
            title="Bật/Tắt âm thanh thông báo"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewfinder / Scanner Stage */}
      {!scanResult ? (
        <div className="bg-slate-900 rounded-3xl p-6 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Animated Scanning Laser */}
          <div className="relative w-56 h-56 mx-auto rounded-3xl border-2 border-dashed border-emerald-400/80 flex flex-col items-center justify-center bg-black/40 overflow-hidden shadow-inner">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-500 animate-bounce" />
            <Camera className="w-12 h-12 text-emerald-400/60 mb-2" />
            <span className="text-xs font-bold text-emerald-300">Hướng camera về mã QR</span>
            <span className="text-[10px] text-slate-400 mt-1">hoặc nhập mã vé bên dưới</span>
          </div>

          {/* Form input for barcode guns or keyboard */}
          <form onSubmit={handleScanSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Nhập mã vé hoặc mã QR..."
                className="flex-1 bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 text-white rounded-2xl px-4 py-3.5 text-center font-mono font-black text-lg tracking-widest uppercase focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-emerald-950/50 cursor-pointer"
              isLoading={isScanning}
            >
              Soát Vé Ngay
            </Button>
          </form>

          {/* Quick Demo Hint */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Test vé hợp lệ: <code onClick={() => setScanInput('CL-839210')} className="cursor-pointer text-emerald-400 underline font-mono">CL-839210</code></span>
            <span>Test vé trùng: <code onClick={() => setScanInput('CL-624109')} className="cursor-pointer text-amber-400 underline font-mono">CL-624109</code></span>
          </div>
        </div>
      ) : (
        /* Result Screen with Big Feedback Colors */
        <div
          className={`rounded-3xl p-6 text-white text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 ${
            scanResult.status === 'SUCCESS'
              ? 'bg-gradient-to-b from-emerald-600 to-emerald-800'
              : 'bg-gradient-to-b from-red-600 to-red-800'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto backdrop-blur-md">
            {scanResult.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-white animate-bounce" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight">{scanResult.title}</h2>
            <p className="text-xs text-white/80">{scanResult.message}</p>
          </div>

          {/* Ticket Information Card */}
          <div className="bg-white text-slate-900 rounded-2xl p-4 text-left space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">Mã vé:</span>
              <span className="font-mono font-black text-sm text-slate-900">{scanResult.code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Khách hàng:</span>
              <span className="font-bold text-xs text-slate-800">{scanResult.customer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Phim:</span>
              <span className="font-bold text-xs text-slate-800">{scanResult.movie}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Phòng chiếu:</span>
              <span className="font-bold text-xs text-slate-800">{scanResult.room}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">Ghế ngồi:</span>
              <span className="font-black text-base text-rose-600">{scanResult.seats}</span>
            </div>
          </div>

          {/* Next Action Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="w-full justify-center bg-white text-slate-900 font-black text-base py-4 rounded-2xl hover:bg-white/90 shadow-lg cursor-pointer"
          >
            Quét Khách Tiếp Theo ➜
          </Button>
        </div>
      )}

      {/* Recent Scans History (Scrollable) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <TicketIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lịch Sử Soát Vé Ca Trực Này</span>
        </h3>

        <div className="space-y-2">
          {scanHistory.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div>
                <div className="font-mono font-bold text-slate-800">{item.code}</div>
                <div className="text-[11px] text-slate-500">{item.movie} • Ghế: {item.seats}</div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.status === 'SUCCESS' ? '✓ Hợp lệ' : '✕ Trùng vé'}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.scannedAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
