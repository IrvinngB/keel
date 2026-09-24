'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const SDD = path.resolve(__dirname, '..', 'bin', 'sdd');

// Isolated HOME so user-scope lookups and git config never touch the real machine.
function env(extra = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'keel-home-'));
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Keel Test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Keel Test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
    SDD_ALLOW_COMMIT: '',
    ...extra,
  };
}

function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'keel-repo-')));
  const e = env();
  git(dir, e, 'init', '-q');
  git(dir, e, 'commit', '-q', '--allow-empty', '-m', 'init');
  return { dir, env: e };
}

function git(cwd, e, ...args) {
  return cp.execFileSync('git', args, { cwd, env: e, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// Runs the CLI and never throws: tests assert on status and output.
function sdd(cwd, e, ...args) {
  const r = cp.spawnSync(process.execPath, [SDD, ...args], { cwd, env: e, encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
}

// Attempts a commit and reports whether git accepted it.
function tryCommit(cwd, e, extraEnv = {}) {
  const r = cp.spawnSync('git', ['commit', '-q', '--allow-empty', '-m', 'test'], { cwd, env: { ...e, ...extraEnv }, encoding: 'utf8' });
  return { ok: r.status === 0, out: r.stdout + r.stderr };
}

function write(file, text, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, mode ? { mode } : undefined);
}

const read = (file) => fs.readFileSync(file, 'utf8');

// Everything in dir except .git, so dry-run tests can prove nothing was written.
const entries = (dir) => fs.readdirSync(dir).filter((n) => n !== '.git').sort();

module.exports = { SDD, env, repo, git, sdd, tryCommit, write, read, entries };
