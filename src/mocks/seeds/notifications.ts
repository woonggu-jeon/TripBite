/**
 * 알림 시드 — 7개 (안 읽음 3 + 읽음 4)
 */
export const notificationSeeds = [
  { id: 'n-1', type: 'letter.received', read: false, createdAt: new Date().toISOString() },
  { id: 'n-2', type: 'letter.liked', read: false, createdAt: new Date().toISOString() },
  { id: 'n-3', type: 'event', read: false, createdAt: new Date().toISOString() },
  { id: 'n-4', type: 'letter.received', read: true, createdAt: new Date(Date.now() - 86400 * 1000).toISOString() },
  { id: 'n-5', type: 'tournament.shared', read: true, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
  { id: 'n-6', type: 'letter.liked', read: true, createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString() },
  { id: 'n-7', type: 'event', read: true, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString() },
];
