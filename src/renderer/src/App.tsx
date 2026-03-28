import { useState, useEffect } from 'react'
import { Music, Video, ShieldCheck, Settings2 } from 'lucide-react'

function App() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3')
  const [quality, setQuality] = useState('1080')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    // @ts-ignore
    window.api.onProgress((p: number) => setProgress(Math.floor(p)))
  }, [])

const handleDownload = async () => {
    if (!url) return
    setStatus('loading')
    setProgress(0)

    try {
      // @ts-ignore
      await window.api.downloadMedia({ url, format, quality })
      
      // Reset dei campi solo dopo il successo
      setStatus('success')
      setUrl('') 
      setProgress(100)

      // Torna allo stato idle dopo 4 secondi
      setTimeout(() => {
        setStatus('idle')
        setProgress(0)
      }, 4000)

    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
        
        <div className="flex flex-col items-center mb-10 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
            {format === 'mp3' ? <Music className="text-white w-10 h-10" /> : <Video className="text-white w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">YouTube Downloader</h1>
          <div className="flex items-center gap-1.5 text-green-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold opacity-80">
            <ShieldCheck size={12} strokeWidth={3} /> yt-dlp Engine Active
          </div>
        </div>

        <div className="space-y-6 relative">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setFormat('mp3')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${format === 'mp3' ? 'bg-red-600 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Music size={18} /> MP3
            </button>
            <button 
              onClick={() => setFormat('mp4')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${format === 'mp4' ? 'bg-red-600 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Video size={18} /> Video
            </button>
          </div>

          <input
            type="text"
            placeholder="Incolla l'URL qui..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {format === 'mp4' && (
            <div className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-2xl border border-white/5">
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                <Settings2 size={14} /> Qualità Video
              </span>
              <select 
                value={quality} 
                onChange={(e) => setQuality(e.target.value)}
                className="bg-[#2a2e35] text-white font-bold text-sm outline-none rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="2160" className="bg-[#1a1d23]">4K (2160p)</option>
                <option value="1440" className="bg-[#1a1d23]">2K (1440p)</option>
                <option value="1080" className="bg-[#1a1d23]">Full HD (1080p)</option>
                <option value="720" className="bg-[#1a1d23]">HD (720p)</option>
                <option value="480" className="bg-[#1a1d23]">480p</option>
              </select>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={status === 'loading' || !url}
            className={`w-full py-5 rounded-[1.25rem] font-black text-lg transition-all active:scale-[0.97] ${
              status === 'loading' ? 'bg-slate-800 text-slate-500' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {status === 'loading' ? `SCARICAMENTO ${progress}%` : 'AVVIA DOWNLOAD'}
          </button>

          {status === 'loading' && (
            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
              <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          {status === 'success' && <p className="text-center text-green-400 text-xs font-black uppercase">Salvato nei Download!</p>}
          {status === 'error' && <p className="text-center text-red-400 text-xs font-black uppercase">Errore: link non valido</p>}
        </div>
      </div>
    </div>
  )
}

export default App