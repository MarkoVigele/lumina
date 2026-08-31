#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = 45219
const dir = resolve(root, '.lumina')
const pidFile = resolve(dir, 'dev.pid')
const url = `http://127.0.0.1:${port}`

function ensureDir() {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readPid() {
  if (!existsSync(pidFile)) return null
  const n = Number(readFileSync(pidFile, 'utf8').trim())
  return Number.isFinite(n) ? n : null
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function portPids() {
  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim()
    return out ? out.split('\n').map((x) => Number(x)).filter(Boolean) : []
  } catch {
    return []
  }
}

function starten() {
  const existing = readPid()
  if (existing && isAlive(existing)) {
    console.log(`Lumina läuft bereits (PID ${existing})`)
    console.log(url)
    return
  }
  const listening = portPids()
  if (listening.length) {
    ensureDir()
    writeFileSync(pidFile, String(listening[0]))
    console.log(`Lumina antwortet bereits auf Port ${port}`)
    console.log(url)
    return
  }

  ensureDir()
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, BROWSER: 'none' },
  })
  child.unref()
  if (!child.pid) {
    console.error('Konnte den Dev-Server nicht starten.')
    process.exit(1)
  }
  writeFileSync(pidFile, String(child.pid))
  console.log('Lumina wird gestartet …')
  console.log(url)
  console.log(`PID ${child.pid}`)
}

function stoppen() {
  const pids = new Set(portPids())
  const stored = readPid()
  if (stored) pids.add(stored)
  if (!pids.size) {
    if (existsSync(pidFile)) unlinkSync(pidFile)
    console.log('Lumina läuft nicht.')
    return
  }
  for (const pid of pids) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /PID ${pid} /T /F`)
      else process.kill(pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
  }
  if (existsSync(pidFile)) unlinkSync(pidFile)
  console.log('Lumina gestoppt.')
}

function openBrowser() {
  try {
    if (process.platform === 'darwin') execSync(`open ${url}`)
    else if (process.platform === 'win32') execSync(`start ${url}`, { shell: true })
    else execSync(`xdg-open ${url}`)
  } catch {
    console.log(`Browser manuell öffnen: ${url}`)
  }
}

function neustart() {
  stoppen()
  updaten()
  starten()
  setTimeout(() => {
    openBrowser()
    console.log(`Browser: ${url}`)
  }, 1500)
}

function updaten() {
  console.log('Aktualisiere Repository und Abhängigkeiten …')
  try {
    execSync('git pull --ff-only', { cwd: root, stdio: 'inherit' })
  } catch {
    console.error('git pull ist fehlgeschlagen. Bitte Änderungen prüfen oder manuell mergen.')
    process.exit(1)
  }
  execSync('npm install', { cwd: root, stdio: 'inherit' })
  console.log('Update abgeschlossen. Starte danach erneut über die Aufgabe „Starten“.')
}

const cmd = process.argv[2]
if (cmd === 'starten') starten()
else if (cmd === 'stoppen') stoppen()
else if (cmd === 'updaten') updaten()
else if (cmd === 'neustart') neustart()
else {
  console.log('Nutzung: node scripts/control.mjs <starten|stoppen|updaten|neustart>')
  process.exit(1)
}
