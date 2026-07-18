import { existsSync, readFileSync } from 'node:fs'

export interface TerminalCommandOption {
  command: string
  labelKey: string
}

export interface AllowedTerminalCommand {
  file?: string
  args?: string[]
  output?: () => string | Promise<string>
}

export const terminalCommandOptions: TerminalCommandOption[] = [
  { command: 'help', labelKey: 'admin.healthPage.terminal.command.help' },
  { command: 'pwd', labelKey: 'admin.healthPage.terminal.command.pwd' },
  { command: 'date -u', labelKey: 'admin.healthPage.terminal.command.dateUtc' },
  { command: 'uptime', labelKey: 'admin.healthPage.terminal.command.uptime' },
  { command: 'node -v', labelKey: 'admin.healthPage.terminal.command.nodeVersion' },
  { command: 'npm -v', labelKey: 'admin.healthPage.terminal.command.npmVersion' },
  { command: 'df -h . /app/data /app/uploads', labelKey: 'admin.healthPage.terminal.command.diskUsage' },
  { command: 'cat /proc/self/cgroup', labelKey: 'admin.healthPage.terminal.command.cgroup' },
  { command: 'cat /proc/meminfo', labelKey: 'admin.healthPage.terminal.command.memoryInfo' },
  { command: 'process', labelKey: 'admin.healthPage.terminal.command.process' }
]

function formatBytes(bytes: number): string {
  const mib = bytes / 1024 / 1024
  return `${Math.round(mib)} MiB`
}

function readTextFile(path: string): string {
  if (!existsSync(path)) {
    return `${path}: unavailable`
  }

  return readFileSync(path, 'utf8').trimEnd() || '(empty)'
}

export const allowedTerminalCommands: Record<string, AllowedTerminalCommand> = {
  help: {
    output: () => [
      'Allowed read-only diagnostics commands:',
      '',
      ...terminalCommandOptions.map(option => option.command)
    ].join('\n')
  },
  pwd: {
    output: () => process.cwd()
  },
  'date -u': {
    file: 'date',
    args: ['-u']
  },
  uptime: {
    file: 'uptime',
    args: []
  },
  'node -v': {
    output: () => process.version
  },
  'npm -v': {
    file: 'npm',
    args: ['-v']
  },
  'df -h . /app/data /app/uploads': {
    file: 'df',
    args: ['-h', '.', '/app/data', '/app/uploads']
  },
  'cat /proc/self/cgroup': {
    output: () => readTextFile('/proc/self/cgroup')
  },
  'cat /proc/meminfo': {
    output: () => readTextFile('/proc/meminfo')
  },
  process: {
    output: () => {
      const memory = process.memoryUsage()
      return [
        `pid: ${process.pid}`,
        `ppid: ${process.ppid}`,
        `cwd: ${process.cwd()}`,
        `node: ${process.version}`,
        `uptime: ${Math.floor(process.uptime())}s`,
        `rss: ${formatBytes(memory.rss)}`,
        `heapUsed: ${formatBytes(memory.heapUsed)}`,
        `heapTotal: ${formatBytes(memory.heapTotal)}`,
        `external: ${formatBytes(memory.external)}`
      ].join('\n')
    }
  }
}
