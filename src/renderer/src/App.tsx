import { useState, useEffect } from 'react'
import { Music, Video, ShieldCheck, Settings2, XCircle, Loader2 } from 'lucide-react'

function App() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3')
  const [quality, setQuality] = useState('1080')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'cancelled'>('idle')
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    // @ts-ignore
    window.api.onProgress((p: number) => {
      setProgress(Math.floor(p))
      if (p < 100) setIsConverting(false)
    })

    // @ts-ignore
    window.api.onStatusUpdate((s: string) => {
      if (s === 'converting') setIsConverting(true)
    })
  }, [])

  const startDownload = async () => {
    if (!url) return
    setStatus('loading')
    setProgress(0)
    setIsConverting(false)

    try {
      // @ts-ignore
      const response = await window.api.downloadMedia({ url, format, quality })
      
      if (response === 'Annullato') return 

      if (response && response.error) throw new Error(response.error)

      setStatus('success')
      setUrl('')
      setProgress(100)
      setIsConverting(false)
      setTimeout(() => setStatus('idle'), 4000)

    } catch (err: any) {
      if (status !== 'cancelled') {
        alert("Errore: " + err.message)
        setStatus('error')
        setTimeout(() => setStatus('idle'), 5000)
      }
    }
  }

  const handleCancel = async () => {
    try {
      setStatus('cancelled')
      // @ts-ignore
      await window.api.cancelDownload()
      setIsConverting(false)
      setProgress(0)
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center p-6 font-sans text-center">
      <div className="w-full max-w-md bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/20 leading-none">
            {format === 'mp3' ? <Music className="text-white w-10 h-10" /> : <Video className="text-white w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none">YouTube Downloader</h1>
          <div className="flex items-center gap-1.5 text-green-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">
            <ShieldCheck size={12} strokeWidth={3} /> Engine Active
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setFormat('mp3')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${format === 'mp3' ? 'bg-red-600 shadow-md' : 'text-slate-400 hover:text-white'}`}>MP3</button>
            <button onClick={() => setFormat('mp4')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${format === 'mp4' ? 'bg-red-600 shadow-md' : 'text-slate-400 hover:text-white'}`}>Video</button>
          </div>

          <input
            type="text"
            placeholder="Incolla il link qui..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {format === 'mp4' && (
            <div className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-2xl border border-white/5">
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400"><Settings2 size={14} /> Qualità</span>
              <select value={quality} onChange={(e) => setQuality(e.target.value)} className="bg-[#2a2e35] text-white font-bold text-sm outline-none rounded-lg px-2 py-1 cursor-pointer">
                <option value="2160">4K (2160p)</option>
                <option value="1080">Full HD (1080p)</option>
                <option value="720">HD (720p)</option>
                <option value="480">480p</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={startDownload} 
              disabled={status === 'loading' || !url} 
              className={`py-5 rounded-[1.25rem] font-black text-lg transition-all flex-[3] flex items-center justify-center gap-3 ${status === 'loading' ? 'bg-slate-800 text-slate-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'}`}
            >
              {status === 'loading' ? (
                <>
                  {isConverting ? (
                    <> <Loader2 className="animate-spin" size={20} /> CONVERSIONE... </>
                  ) : (
                    `SCARICAMENTO ${progress}%`
                  )}
                </>
              ) : 'AVVIA DOWNLOAD'}
            </button>

            {status === 'loading' && (
              <button onClick={handleCancel} className="flex-1 py-5 rounded-[1.25rem] bg-white/5 border border-white/10 hover:bg-white/10 text-red-400 flex items-center justify-center transition-all"><XCircle size={24} /></button>
            )}
          </div>

          {status === 'loading' && (
            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className={`h-full transition-all duration-300 ${isConverting ? 'bg-orange-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {status === 'success' && <p className="text-center text-green-400 text-xs font-black uppercase tracking-widest animate-bounce">Completato!</p>}
          {status === 'cancelled' && <p className="text-center text-orange-400 text-xs font-black uppercase tracking-widest">Annullato</p>}
          {status === 'error' && <p className="text-center text-red-400 text-xs font-black uppercase tracking-widest">Errore</p>}
        </div>
      </div>
    </div>
  )
}

export default App