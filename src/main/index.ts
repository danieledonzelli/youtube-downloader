import { app, BrowserWindow, ipcMain, Menu, MenuItem, nativeImage } from 'electron'
import path from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import fs from 'fs'
import { spawn } from 'child_process'

function createWindow(): void {
  const isWin = process.platform === 'win32'
  const iconPath = is.dev 
    ? path.join(app.getAppPath(), 'resources', isWin ? 'icon.ico' : 'icon.png')
    : path.join(process.resourcesPath, 'bin', isWin ? 'icon.ico' : 'icon.png')

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
    const isMac = process.platform === 'darwin'
    const arch = process.arch

    try {
      const userBinPath = path.join(app.getPath('userData'), 'bin')
      if (!fs.existsSync(userBinPath)) fs.mkdirSync(userBinPath, { recursive: true })

      const ytDlpPath = path.join(userBinPath, isWin ? 'yt-dlp.exe' : 'yt-dlp')
      const ffmpegPath = path.join(userBinPath, isWin ? 'ffmpeg.exe' : 'ffmpeg')

      let sourceDir: string
      if (is.dev) {
        sourceDir = isWin 
          ? path.join(app.getAppPath(), 'resources', 'win')
          : path.join(app.getAppPath(), 'resources', 'mac', arch)
      } else {
        sourceDir = isWin 
          ? path.join(process.resourcesPath, 'bin', 'win') 
          : path.join(process.resourcesPath, 'bin')
      }

      const sourceYtDlp = path.join(sourceDir, isWin ? 'yt-dlp.exe' : 'yt-dlp')
      const sourceFfmpeg = path.join(sourceDir, isWin ? 'ffmpeg.exe' : 'ffmpeg')

      if (!fs.existsSync(sourceYtDlp)) throw new Error("Binari non trovati")

      // Copia e permessi
      fs.copyFileSync(sourceYtDlp, ytDlpPath)
      fs.copyFileSync(sourceFfmpeg, ffmpegPath)
      if (isMac) {
        fs.chmodSync(ytDlpPath, '755')
        fs.chmodSync(ffmpegPath, '755')
      }

      const outputTemplate = format === 'mp3' ? '%(title)s.%(ext)s' : `%(title)s [%(height)sp].%(ext)s`
      const outputPath = path.join(app.getPath('downloads'), outputTemplate)

      let args = [
        url,
        '--ffmpeg-location', ffmpegPath,
        '-o', outputPath,
        '--newline',
        '--no-mtime',
        '--force-overwrites',
        '--no-warnings' // Aggiunto per nascondere i warning JavaScript nel terminale
      ]

      if (format === 'mp3') {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
      } else {
        args.push('-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`)
        args.push('--merge-output-format', 'mp4')
      }

      return new Promise((resolve, reject) => {
        const ls = spawn(ytDlpPath, args, { detached: false, windowsHide: true })

        ls.stdout.on('data', (data) => {
          const match = data.toString().match(/(\d+\.\d+)%/)
          if (match) event.sender.send('download-progress', parseFloat(match[1]))
        })

        ls.on('error', (err) => reject(err))
        ls.on('close', (code) => {
          if (code === 0) resolve('Successo')
          else reject(new Error(`Errore codice ${code}`))
        })
      })

    } catch (error: any) {
      return { error: error.message }
    }
  })

  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })