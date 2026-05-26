'use client';

/**
 * 편지 상세 클라이언트
 *
 * 컴포넌트 분할 (features/letter/components):
 *   - <ManuscriptCard letter={...} />  — 원고지 일러스트 + 본문/메타
 *   - <LetterActions letter={...} />   — 좋아요 / 저장 / 삭제
 */
export function LetterDetailClient({ letterId }: { letterId: string }) {
  // TODO: const { data: letter } = useLetter(letterId);
  void letterId;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* TODO: <ManuscriptCard letter={letter} /> */}
      <div
        style={{
          minHeight: 320,
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-muted)',
        }}
      >
        원고지 일러스트 + 5글자 본문 + 닉네임 + 위치
      </div>

      {/* TODO: <LetterActions /> */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button style={btn}>♡ 좋아요</button>
        <button style={btn}>저장</button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
};
