'use client';

import { useEffect } from 'react';

/**
 * 작성 중 내용 보호 — 페이지 떠나기 전 경고
 *
 * 사용처:
 *   - 편지 작성 중 우연한 뒤로가기
 *   - 온보딩 닉네임 입력 중 새로고침
 *   - 토너먼트 진행 중 페이지 종료 (선택 — 보통은 OK)
 *
 * 동작:
 *   - 브라우저 기본 beforeunload 다이얼로그 표시
 *   - 메시지는 보안상 브라우저가 무시 — 사용자 정의 텍스트 표시 불가
 *
 * SPA 내부 라우팅 (next/link) 은 beforeunload 가 트리거되지 않음 →
 * 이 케이스를 보호하려면 별도 router event 후킹 필요 (App Router는 미지원,
 * Pages Router의 routeChangeStart는 가능). 현재는 외부 이탈만 보호.
 *
 * 사용:
 *   const { formState: { isDirty } } = useForm();
 *   useUnsavedChangesWarning(isDirty);
 */
export function useUnsavedChangesWarning(when: boolean) {
  useEffect(() => {
    if (!when) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = ''; // legacy 브라우저
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
