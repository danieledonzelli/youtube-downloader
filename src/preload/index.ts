import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  downloadMedia: (options: { url: string, format: string, quality: string }) => 
    ipcRenderer.invoke('download-media', options),
  onProgress: (callback: (percent: number) => void) => 
    ipcRenderer.on('download-progress', (_event, value) => callback(value))
})