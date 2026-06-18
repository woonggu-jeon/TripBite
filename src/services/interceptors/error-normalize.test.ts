import { describe, it, expect, beforeEach } from 'vitest';
import axios, { type AxiosInstance } from 'axios';
import { attachErrorNormalizeInterceptor } from './error-normalize';

describe('error-normalize interceptor', () => {
  let instance: AxiosInstance;

  beforeEach(() => {
    instance = axios.create();
    attachErrorNormalizeInterceptor(instance);
  });

  function makeError(
    status: number | undefined,
    data: unknown,
    statusText?: string,
  ) {
    const err = new Error('mock') as Parameters<
      Parameters<typeof instance.interceptors.response.use>[1] & object
    >[0];
    Object.assign(err as object, {
      config: {},
      isAxiosError: true,
      response: status === undefined ? undefined : { status, data, statusText },
    });
    return err;
  }

  async function runReject(err: unknown) {
    // interceptor 가 reject 한 결과의 normalized 속성을 검증
    const handlers = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (err: unknown) => unknown }>;
      }
    ).handlers;
    const rejected = handlers[handlers.length - 1]?.rejected;
    try {
      await rejected!(err);
      throw new Error('did not reject');
    } catch (e) {
      return e as { normalized?: { code: string; message: string } };
    }
  }

  it('401 → code=AUTH + generic 메시지', async () => {
    const e = await runReject(makeError(401, null));
    expect(e.normalized?.code).toBe('AUTH');
    expect(e.normalized?.message).toContain('로그인');
  });

  it('404 → code=NOT_FOUND', async () => {
    const e = await runReject(makeError(404, null));
    expect(e.normalized?.code).toBe('NOT_FOUND');
  });

  it('500 → code=SERVER', async () => {
    const e = await runReject(makeError(500, null));
    expect(e.normalized?.code).toBe('SERVER');
  });

  it('BE 응답에 code 가 있으면 status 매핑보다 우선', async () => {
    const e = await runReject(
      makeError(409, {
        code: 'NICKNAME_TAKEN',
        message: '이미 쓰는 닉네임이에요',
      }),
    );
    expect(e.normalized?.code).toBe('NICKNAME_TAKEN');
    expect(e.normalized?.message).toBe('이미 쓰는 닉네임이에요');
  });

  it('BE 응답에 message 만 있으면 status 기반 code + BE 메시지', async () => {
    const e = await runReject(makeError(422, { message: '필수값 누락' }));
    expect(e.normalized?.code).toBe('VALIDATION');
    expect(e.normalized?.message).toBe('필수값 누락');
  });

  it('response 자체가 없으면 NETWORK', async () => {
    const e = await runReject(makeError(undefined, null));
    expect(e.normalized?.code).toBe('NETWORK');
    expect(e.normalized?.message).toContain('네트워크');
  });

  it('403 + BE code=CSRF → 사용자 친화 메시지', async () => {
    // BE 의 CsrfGuard 가 X-Requested-With 부재 시 응답하는 형태.
    const e = await runReject(makeError(403, { code: 'CSRF' }));
    expect(e.normalized?.code).toBe('CSRF');
    expect(e.normalized?.message).toContain('새로고침');
  });

  it('429 + BE code=AUTH_ACCOUNT_LOCKED → BE code 보존 (LoginForm 분기용)', async () => {
    const e = await runReject(
      makeError(429, {
        code: 'AUTH_ACCOUNT_LOCKED',
        message: '계정이 잠겼어요',
      }),
    );
    expect(e.normalized?.code).toBe('AUTH_ACCOUNT_LOCKED');
    expect(e.normalized?.message).toBe('계정이 잠겼어요');
  });
});
