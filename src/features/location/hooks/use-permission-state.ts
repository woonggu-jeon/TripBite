'use client';

import { useEffect, useState } from 'react';
import type { PermissionState } from '@/features/location/types';

/**
 * 위치 권한 상태 조회 훅
 *
 * Permissions API (https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
 * 를 사용해 prompt를 띄우지 않고도 현재 권한 상태를 알 수 있음.
 *
 * 미지원 브라우저 (iOS Safari 16 미만 등) 에서는 'unsupported' 반환.
 * 이 경우 호출부는 직접 getCurrentPosition을 시도해야 함.
 *
 * 변경 이벤트 구독:
 *   사용자가 OS 설정에서 권한을 변경하면 onchange가 트리거되어
 *   UI가 자동으로 업데이트됨.
 *
 * 성능:
 *   - 권한 query는 한 번만 (effect cleanup으로 listener 제거)
 *   - 권한이 'granted'일 때만 실제 위치 요청해야 prompt 안 뜸
 */
export function usePermissionState(): PermissionState {
  const [state, setState] = useState<PermissionState>('prompt');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      setState('unsupported');
      return;
    }

    let status: PermissionStatus | null = null;
    let cancelled = false;

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        setState(result.state as PermissionState);
        result.onchange = () => {
          setState(result.state as PermissionState);
        };
      })
      .catch(() => {
        if (!cancelled) setState('unsupported');
      });

    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, []);

  return state;
}
