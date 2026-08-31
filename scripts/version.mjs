#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ask = process.argv.includes('--ask')
const args = process.argv.slice(2).filter((a) => a !== '--ask')
const cmd = args[0]
const arg1 = args[1]

function git(argv) {
  return execFileSync('git', argv, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function gitLive(argv) {
  execFileSync('git', argv, { cwd: root, stdio: 'inherit' })
}

function stopServer() {
  execSync('node scripts/control.mjs stoppen', { cwd: root, stdio: 'inherit' })
}

function installDeps() {
  execSync('npm install', { cwd: root, stdio: 'inherit' })
}

function isMac() {
  return process.platform === 'darwin'
}

function osascript(source) {
  return execSync('osascript', { input: source, encoding: 'utf8' }).trim()
}

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function stamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function dirty() {
  return porcelainLines().length > 0
}

function porcelainLines() {
  const raw = git(['status', '--porcelain', '-uall'])
  if (!raw) return []
  return raw.split('\n').filter(Boolean)
}

function porcelainPath(line) {
  const rest = line.slice(3)
  return rest.includes(' -> ') ? rest.split(' -> ').at(-1) : rest
}

function isNoisePath(path) {
  const p = String(path ?? '').replace(/^"+|"+$/g, '')
  return (
    p === '.DS_Store' ||
    p.endsWith('/.DS_Store') ||
    p === 'agent-tools' ||
    p.startsWith('agent-tools/') ||
    p.startsWith('.cursor/')
  )
}

function relevantDirty() {
  return porcelainLines()
    .map(porcelainPath)
    .filter((path) => path && !isNoisePath(path))
}

function askYes(title, prompt, yesLabel) {
  if (!ask || !isMac()) return false
  const result = osascript(`
    try
      set d to display dialog ${JSON.stringify(prompt)} buttons {"Abbrechen", ${JSON.stringify(yesLabel)}} default button ${JSON.stringify(yesLabel)} with title ${JSON.stringify(title)}
      return button returned of d
    on error
      return "__CANCEL__"
    end try
  `)
  return result === yesLabel
}

function requireClean(opts = {}) {
  const files = relevantDirty()
  if (!files.length) return
  const preview = files.slice(0, 8)
  const extra = files.length - preview.length
  console.error('')
  console.error('Stopp: Es gibt ungespeicherte Datei-Änderungen.')
  console.error('Ein Wechsel würde sie gefährden.')
  console.error('')
  for (const file of preview) console.error(`  • ${file}`)
  if (extra > 0) console.error(`  • … und ${extra} weitere`)
  console.error('')
  if (opts.allowStash && ask && isMac()) {
    const where = opts.allowStash
    const lines = [
      'Diese Dateien sind noch nicht festgeschrieben:',
      '',
      ...preview.map((file) => `• ${file}`),
      extra > 0 ? `• … und ${extra} weitere` : '',
      '',
      `Merken (Stash) und nach „${where}“ wechseln?`,
      'Du holst sie später mit: git stash pop',
    ].filter((line) => line !== '')
    const ok = askYes('Lumina · Ungespeicherte Dateien', lines.join('\n'), 'Merken und wechseln')
    if (ok) {
      gitLive(['stash', 'push', '-u', '-m', `Lumina vor Wechsel zu ${where}`])
      console.log('')
      console.log(`Änderungen gemerkt. Wiederherstellen im Terminal: git stash pop`)
      console.log('')
      return
    }
    console.log('Abgebrochen.')
    process.exit(2)
  }
  console.error('Was du tun kannst:')
  console.error('  • Szene in Lumina in einem Slot speichern (unabhängig von Git)')
  console.error('  • Im Dialog „Merken und wechseln“ wählen (Finder), oder:')
  console.error('      git stash push -u -m "vor Wechsel"')
  console.error('  • Eine neue Spielwiese: Lumina Version Test anlegen.command')
  process.exit(1)
}

function currentBranch() {
  const name = git(['branch', '--show-current'])
  return name || null
}

function exactTag() {
  try {
    return git(['describe', '--tags', '--exact-match'])
  } catch {
    return null
  }
}

function shortHash() {
  return git(['rev-parse', '--short', 'HEAD'])
}

function allBranches() {
  return git(['branch', '--format=%(refname:short)'])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function testBranches() {
  return [...new Set(allBranches().filter((s) => s.startsWith('test-')))].sort()
}

function standTags() {
  const tags = git(['tag', '-l', 'stand-*'])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(tags)].sort().reverse()
}

function prettyTest(branch) {
  return branch.replace(/^test-/, '').replace(/-/g, ' ')
}

function prettyStand(tag) {
  return tag.replace(/^stand-/, '').replace(/-/g, ' ')
}

function describeHere() {
  const branch = currentBranch()
  const tag = exactTag()
  if (branch === 'main') return { kind: 'stabil', title: 'Stabil', detail: 'Hauptversion (main)' }
  if (branch?.startsWith('test-')) {
    return { kind: 'test', title: `Test · ${prettyTest(branch)}`, detail: branch }
  }
  if (tag?.startsWith('stand-')) {
    return { kind: 'stand', title: `Gesicherter Stand · ${prettyStand(tag)}`, detail: tag }
  }
  if (branch) return { kind: 'andere', title: branch, detail: branch }
  return { kind: 'losgelöst', title: 'Losgelöster Stand', detail: `Commit ${shortHash()}` }
}

function askText(title, prompt, fallback = '') {
  if (arg1) return { value: arg1, cancelled: false }
  if (!ask) return { value: fallback, cancelled: false }
  if (!isMac()) {
    console.error('Bitte den Namen direkt mitgeben, z. B.: npm run version:test-anlegen -- ki')
    process.exit(1)
  }
  const result = osascript(`
    try
      set d to display dialog ${JSON.stringify(prompt)} default answer ${JSON.stringify(fallback)} buttons {"Abbrechen", "OK"} default button "OK" with title ${JSON.stringify(title)}
      return text returned of d
    on error
      return "__CANCEL__"
    end try
  `)
  if (result === '__CANCEL__') return { value: '', cancelled: true }
  return { value: result, cancelled: false }
}

function chooseOne(title, prompt, items) {
  if (arg1) return arg1
  if (!items.length) return null
  if (!ask) {
    console.error('Bitte eine Auswahl mitgeben.')
    process.exit(1)
  }
  if (!isMac()) {
    console.error('Verfügbare Einträge:')
    for (const item of items) console.error(`  ${item}`)
    console.error('Aufruf z. B.: npm run version:test-laden -- test-ki')
    process.exit(1)
  }
  const list = items.map((item) => `"${item.replace(/"/g, '')}"`).join(', ')
  const result = osascript(`
    set opts to {${list}}
    set c to choose from list opts with prompt ${JSON.stringify(prompt)} with title ${JSON.stringify(title)}
    if c is false then return ""
    return item 1 of c
  `)
  return result || null
}

function resolveTestName(raw) {
  const cleaned = slug(raw)
  if (!cleaned) return null
  return cleaned.startsWith('test-') ? cleaned : `test-${cleaned}`
}

function resolveStandName(raw) {
  if (!raw || !String(raw).trim()) return `stand-${stamp()}`
  const cleaned = slug(raw)
  if (!cleaned) return `stand-${stamp()}`
  return cleaned.startsWith('stand-') ? cleaned : `stand-${cleaned}`
}

function switched() {
  process.exitCode = 10
}

function status() {
  const here = describeHere()
  const tests = testBranches()
  const stands = standTags()
  console.log('')
  console.log(`Du bist gerade auf:   ${here.title}`)
  console.log(`Intern:               ${here.detail}`)
  console.log(`Commit:               ${shortHash()}`)
  const leftover = relevantDirty()
  if (leftover.length) console.log(`Arbeitsstand:         ${leftover.length} ungespeicherte Datei(en)`)
  else if (dirty()) console.log('Arbeitsstand:         nur unkritische Dateien (z. B. .DS_Store)')
  else console.log('Arbeitsstand:         sauber')
  console.log('')
  console.log(`Testversionen:        ${tests.length ? tests.map(prettyTest).join(', ') : 'noch keine'}`)
  console.log(`Gesicherte Stände:    ${stands.length ? stands.map(prettyStand).join(', ') : 'noch keine'}`)
  console.log('')
  console.log('Die anderen Dateien:')
  console.log('  Lumina Version Stabil.command            → zurück auf die sichere Hauptversion')
  console.log('  Lumina Version Test anlegen.command      → neue Spielwiese, Stabil bleibt unberührt')
  console.log('  Lumina Version Test laden.command        → eine vorhandene Spielwiese laden')
  console.log('  Lumina Version Stand sichern.command     → diesen Code-Stand merken (wie ein Foto)')
  console.log('  Lumina Version Stand laden.command       → ein gemerktes Foto wiederherstellen')
  console.log('')
}

function newTest() {
  const raw = askText(
    'Lumina · Test anlegen',
    'Name der Testversion — z. B. KI, Farben oder weicher Rauch:',
    '',
  )
  if (raw.cancelled) {
    console.log('Abgebrochen.')
    process.exit(2)
  }
  const branch = resolveTestName(raw.value)
  if (!branch) {
    console.error('Bitte einen kurzen Namen eingeben.')
    process.exit(1)
  }
  const existing = testBranches()
  if (existing.includes(branch) || allBranches().includes(branch)) {
    console.error(`Die Testversion „${prettyTest(branch)}“ gibt es schon. Öffne sie mit „Test laden“.`)
    process.exit(1)
  }
  gitLive(['checkout', '-b', branch])
  let published = false
  try {
    gitLive(['push', '-u', 'origin', branch])
    published = true
  } catch {
    published = false
  }
  const label = prettyTest(branch)
  console.log('')
  console.log(`Neue Testversion: ${label}`)
  if (dirty()) {
    console.log('Deine ungespeicherten Dateien sind mit rübergekommen — Stabil bleibt unberührt.')
  } else {
    console.log('Stabil (main) bleibt unverändert.')
  }
  if (published) {
    console.log('Die Version ist geschickt. Ich kann sie sehen.')
  } else {
    console.log('Lokal angelegt, aber nicht geschickt. Sag mir den Namen trotzdem — ich lege sie hier an.')
  }
  console.log('')
  console.log('Schreib mir jetzt z. B.:')
  console.log('')
  console.log(`  Bitte auf Test „${label}“ arbeiten.`)
  console.log('  Ich will, dass …')
  console.log('')
  console.log('Zurück: Lumina Version Stabil.command')
  console.log('')
}

function openTest() {
  const tests = testBranches()
  if (!tests.length) {
    console.error('Noch keine Testversion. Lege zuerst eine mit „Test anlegen“ an.')
    process.exit(1)
  }
  const labels = tests.map((branch) => prettyTest(branch))
  const picked = chooseOne(
    'Lumina · Test laden',
    'Welche Testversion soll geladen werden?',
    labels,
  )
  if (ask && !picked) {
    console.log('Abgebrochen.')
    process.exit(2)
  }
  const byLabel = tests[labels.indexOf(picked)]
  const branch = byLabel || resolveTestName(picked)
  if (!branch || !tests.includes(branch)) {
    console.error('Diese Testversion kenne ich nicht.')
    process.exit(1)
  }
  if (currentBranch() === branch) {
    console.log(`Du bist schon auf der Testversion „${prettyTest(branch)}“.`)
    return
  }
  requireClean({ allowStash: prettyTest(branch) })
  stopServer()
  gitLive(['checkout', branch])
  installDeps()
  console.log('')
  console.log(`Geöffnet: Test · ${prettyTest(branch)}`)
  console.log('')
  switched()
}

function goStable() {
  requireClean({ allowStash: 'Stabil' })
  if (currentBranch() !== 'main') {
    stopServer()
    gitLive(['checkout', 'main'])
  } else {
    stopServer()
  }
  try {
    gitLive(['pull', '--ff-only', 'origin', 'main'])
  } catch {
    console.error('git pull ist fehlgeschlagen. Bitte den Stand prüfen — Stabil wurde nicht überschrieben.')
    process.exit(1)
  }
  installDeps()
  console.log('')
  console.log('Zurück auf Stabil. Testversionen und gesicherte Stände bleiben erhalten.')
  console.log('')
  switched()
}

function saveStand() {
  const raw = askText(
    'Lumina · Stand sichern',
    'Name für diesen Schnappschuss (leer = Datum und Uhrzeit):',
    '',
  )
  if (raw.cancelled) {
    console.log('Abgebrochen.')
    process.exit(2)
  }
  const tag = resolveStandName(raw.value)
  if (git(['tag', '-l', tag])) {
    console.error(`Den Stand „${prettyStand(tag)}“ gibt es schon. Wähle einen anderen Namen.`)
    process.exit(1)
  }
  const here = describeHere()
  gitLive(['tag', '-a', tag, '-m', `Lumina-Stand: ${prettyStand(tag)} (${here.title})`])
  console.log('')
  console.log(`Gesichert: ${prettyStand(tag)}`)
  console.log(`Von:       ${here.title}  ·  ${shortHash()}`)
  console.log('Wiederherstellen: Lumina Version Stand laden.command')
  console.log('')
}

function loadStand() {
  const tags = standTags()
  if (!tags.length) {
    console.error('Noch kein gesicherter Stand. Sichere zuerst einen mit „Stand sichern“.')
    process.exit(1)
  }
  const labels = tags.map((tag) => prettyStand(tag))
  const picked = chooseOne(
    'Lumina · Stand laden',
    'Welchen gesicherten Stand willst du sehen?',
    labels,
  )
  if (ask && !picked) {
    console.log('Abgebrochen.')
    process.exit(2)
  }
  const byLabel = tags[labels.indexOf(picked)]
  const tag = byLabel || tags.find((t) => t === picked || prettyStand(t) === picked)
  if (!tag) {
    console.error('Diesen Stand kenne ich nicht.')
    process.exit(1)
  }
  checkoutStand(tag)
}

function checkoutStand(tag) {
  if (exactTag() === tag) {
    console.log(`Dieser Stand ist schon geladen: ${prettyStand(tag)}`)
    return
  }
  requireClean({ allowStash: prettyStand(tag) })
  stopServer()
  gitLive(['checkout', tag])
  installDeps()
  console.log('')
  console.log(`Geladen: ${prettyStand(tag)}`)
  console.log('Das ist ein Foto — Änderungen hier sind flüchtig.')
  console.log('Willst du darauf weiterbauen: Lumina Version Test anlegen.command')
  console.log('Zurück auf Stabil: Lumina Version Stabil.command')
  console.log('')
  switched()
}

if (cmd === 'status' || cmd === 'stand') status()
else if (cmd === 'list-tests') {
  for (const branch of testBranches()) console.log(branch)
}
else if (cmd === 'list-saves') {
  for (const tag of standTags()) console.log(tag)
}
else if (cmd === 'new-test') newTest()
else if (cmd === 'open-test') openTest()
else if (cmd === 'stable') goStable()
else if (cmd === 'save') saveStand()
else if (cmd === 'load') loadStand()
else {
  console.log('Nutzung: node scripts/version.mjs <status|stable|new-test|open-test|save|load>')
  process.exit(1)
}
