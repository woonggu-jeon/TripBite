import { describe, it, expect, beforeEach } from 'vitest';
import { useLocationStore } from './location-store';

describe('location-store', () => {
  beforeEach(() => {
    useLocationStore.setState({ resolved: null });
  });

  it('초기 resolved는 null', () => {
    expect(useLocationStore.getState().resolved).toBeNull();
  });

  it('setResolved로 위치 저장', () => {
    useLocationStore.getState().setResolved({
      latitude: 36.6,
      longitude: 127.4,
      label: '충북 청주시',
      regionCode: 'cheongju',
    });
    expect(useLocationStore.getState().resolved?.label).toBe('충북 청주시');
    expect(useLocationStore.getState().resolved?.regionCode).toBe('cheongju');
  });

  it('clear로 초기화', () => {
    useLocationStore
      .getState()
      .setResolved({ latitude: 1, longitude: 2, label: 'X' });
    useLocationStore.getState().clear();
    expect(useLocationStore.getState().resolved).toBeNull();
  });
});
