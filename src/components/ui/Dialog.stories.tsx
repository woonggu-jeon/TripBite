import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon } from '@/components/icon/Icon';
import { Dialog } from './Dialog';
import { Button } from './Button';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>다이얼로그 열기</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="편지를 삭제할까요?"
          description="이 작업은 되돌릴 수 없어요."
          actions={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                삭제
              </Button>
            </>
          }
        />
      </>
    );
  },
};

export const WithIcon: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        icon={<Icon name="location" size={28} />}
        title="위치 권한이 필요해요"
        description="가까운 여행지를 추천하려면 현재 위치가 필요해요."
        actions={
          <Button onClick={() => setOpen(false)} fullWidth>
            확인
          </Button>
        }
      />
    );
  },
};

export const WithCloseButton: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        showCloseButton
        title="알림"
        description="우상단 X 버튼으로 닫을 수 있어요."
      />
    );
  },
};
