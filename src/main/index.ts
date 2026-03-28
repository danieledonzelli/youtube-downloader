import { app, BrowserWindow, ipcMain, Menu, MenuItem, nativeImage } from 'electron'
import path from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import fs from 'fs'
import YTDlpWrapModule from 'yt-dlp-wrap'

// @ts-ignore
const YTDlpWrap = YTDlpWrapModule.default || YTDlpWrapModule

function createWindow(): void {
  const iconPath = is.dev 
    ? path.join(app.getAppPath(), 'resources', 'icon.png')
    : path.join(process.resourcesPath, 'bin', 'icon.png')

  const mainWindow = new BrowserWindow({
    width: 550,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    title: "YouTube Downloader",
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.on('context-menu', (_, props) => {
    const menu = new Menu()
    if (props.isEditable) {
      menu.append(new MenuItem({ label: 'Taglia', role: 'cut' }))
      menu.append(new MenuItem({ label: 'Copia', role: 'copy' }))
      menu.append(new MenuItem({ label: 'Incolla', role: 'paste' }))
      menu.popup()
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.youtube.downloader')
  
  ipcMain.handle('download-media', async (event, { url, format, quality }) => {
    const isWin = process.platform === 'win32'
    
    // 1. GESTIONE PERCORSI PORTABLE (CRITICO)
    // Creiamo una cartella 'bin' fissa nei dati utente per evitare problemi di permessi nella cartella temporanea
    const userBinPath = path.join(app.getPath('userData'), 'bin')
    if (!fs.existsSync(userBinPath)) fs.mkdirSync(userBinPath, { recursive: true })

    const ytDlpPath = path.join(userBinPath, isWin ? 'yt-dlp.exe' : 'yt-dlp')
    const ffmpegPath = path.join(userBinPath, isWin ? 'ffmpeg.exe' : 'ffmpeg')

    // Se i binari non sono nella cartella userData, li copiamo/scarichiamo lì
    if (!fs.existsSync(ytDlpPath)) {
      await YTDlpWrap.downloadFromGithub(ytDlpPath)
    }

    // Copiamo ffmpeg dalla cartella delle risorse alla cartella userData per massima compatibilità
    if (!fs.existsSync(ffmpegPath)) {
      const sourceFfmpeg = is.dev 
        ? path.join(app.getAppPath(), 'resources', isWin ? 'win' : 'mac', isWin ? 'ffmpeg.exe' : 'ffmpeg')
        : path.join(process.resourcesPath, 'bin', isWin ? 'ffmpeg.exe' : 'ffmpeg')
      
      if (fs.existsSync(sourceFfmpeg)) {
        fs.copyFileSync(sourceFfmpeg, ffmpegPath)
      }
    }

    const ytDlp = new YTDlpWrap(ytDlpPath)
    const outputTemplate = format === 'mp3' ? '%(title)s.%(ext)s' : `%(title)s [%(height)sp].%(ext)s`
    const outputPath = path.join(app.getPath('downloads'), outputTemplate)

    // 2. ARGOMENTI PER COMPATIBILITÀ MASSIMA
    let args = [
      url,
      '--ffmpeg-location', ffmpegPath,
      '-o', outputPath,
      '--no-mtime',
      '--force-overwrites'
    ]

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else {
      // FORZIAMO IL FORMATO MP4 E L'AUDIO AAC (per risolvere il problema Opus)
      args.push('-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`)
      args.push('--merge-output-format', 'mp4')
    }

    return new Promise((resolve) => {
      ytDlp.exec(args)
        .on('progress', (progress) => event.sender.send('download-progress', progress.percent))
        .on('error', (err) => console.error("yt-dlp log:", err.message))
        .on('close', () => resolve('Successo'))
    })
  })

  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })