import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from '@/lib/toast';
import { Toaster } from './Toaster';

const meta = {
  title: 'Feedback/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ destructive }: { destructive?: boolean }) {
  const confirm = useConfirm();
  return (
    <div style={{ padding: 24 }}>
      <ConfirmDialog />
      <Toaster />
      <Button
        variant={destructive ? 'danger' : 'primary'}
        onClick={async () => {
          const ok = await confirm({
            title: destructive ? '편지를 삭제할까요?' : '저장하시겠어요?',
            description: destructive
              ? '이 작업은 되돌릴 수 없어요.'
              : undefined,
            confirmLabel: destructive ? '삭제' : '저장',
            destructive,
          });
          toast.info(ok ? '확정' : '취소');
        }}
      >
        다이얼로그 열기
      </Button>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
export const Destructive: Story = { render: () => <Demo destructive /> };
