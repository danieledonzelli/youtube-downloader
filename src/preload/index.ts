import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  downloadMedia: (options: { url: string, format: string, quality: string }) => 
    ipcRenderer.invoke('download-media', options),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  onProgress: (callback: (percent: number) => void) => 
    ipcRenderer.on('download-progress', (_event, value) => callback(value)),
  onStatusUpdate: (callback: (status: string) => void) => 
    ipcRenderer.on('download-status', (_event, value) => callback(value))
})