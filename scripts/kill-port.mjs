/**
 * Cross-platform port kill — Windows / macOS / Linux.
 *
 * 사용:
 *   node scripts/kill-port.mjs 3900
 *   npm run kill:3900
 *
 * dev 가 background 로 떠 있거나, 이전 dev 가 좀비로 남아 다음 dev 가 다른
 * port 로 빠질 때 안전하게 정리.
 */
import { execSync } from 'node:child_process';

const port = process.argv[2] ?? '3900';

function killWindows(p) {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr :${p}`, {
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();
  } catch {
    return 0;
  }
  const pids = new Set();
  for (const line of out.split('\n')) {
    // LISTENING 상태의 LOCAL_ADDRESS:port 인 라인만
    const m = line.match(/LISTENING\s+(\d+)\s*$/);
    if (m) pids.add(m[1]);
  }
  let killed = 0;
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      killed += 1;
    } catch {
      // 이미 종료됐거나 권한 없음 — 무시
    }
  }
  return killed;
}

function killUnix(p) {
  let pids = '';
  try {
    pids = execSync(`lsof -ti:${p}`, {
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();
  } catch {
    return 0;
  }
  const list = pids.split('\n').filter(Boolean);
  for (const pid of list) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    } catch {
      // 무시
    }
  }
  return list.length;
}

const killed =
  process.platform === 'win32' ? killWindows(port) : killUnix(port);

if (killed > 0) {
  console.log(`port ${port}: killed ${killed} process(es)`);
} else {
  console.log(`port ${port}: nothing listening (free)`);
}
