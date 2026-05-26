'use client';

import Link from 'next/link';
import { Mail, Heart } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/use-confirm';

/**
 * 카탈로그 본문 — 컴포넌트별 사용 예시
 */
export function CatalogClient() {
  const confirm = useConfirm();

  return (
    <div style={{ display: 'grid', gap: '2rem', padding: '1rem' }}>
      <Block title="EmptyState">
        <EmptyState
          icon={<Mail size={28} />}
          title="아직 받은 편지가 없어요"
          description="편지가 도착하면 여기에 표시돼요"
          action={
            <Link
              href="/letter/compose"
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-primary)',
                color: 'var(--color-primary-fg)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              편지 쓰러 가기
            </Link>
          }
        />
      </Block>

      <Block title="Skeleton">
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width="60%" height={20} radius="sm" />
          <Skeleton width="100%" height={80} radius="md" />
          <Skeleton width="40%" height={16} radius="sm" />
        </div>
      </Block>

      <Block title="Toast">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => toast.success('저장되었어요')}>success</Btn>
          <Btn onClick={() => toast.error('실패했어요')}>error</Btn>
          <Btn onClick={() => toast.info('새 알림')}>info</Btn>
          <Btn onClick={() => toast.warning('주의')}>warning</Btn>
        </div>
      </Block>

      <Block title="ConfirmDialog">
        <Btn
          onClick={async () => {
            const ok = await confirm({
              title: '편지를 삭제할까요?',
              description: '이 작업은 되돌릴 수 없어요.',
              confirmLabel: '삭제',
              destructive: true,
            });
            toast.info(ok ? '삭제 확정' : '취소');
          }}
        >
          <Heart size={14} /> 다이얼로그 열기
        </Btn>
      </Block>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          padding: '1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Btn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.5rem 0.875rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
      }}
    >
      {children}
    </button>
  );
}
