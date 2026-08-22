import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockSeeds } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { authApi } from './auth';

/**
 * 인증 어댑터 단위 테스트 — 계정찾기 3종 + 비번변경 + 탈퇴 + /me 매핑(avatarUrl).
 * be/ 클라이언트(엔벨로프) → 도메인 반환값 coerce 검증.
 */
const apiUrl = mockSeeds.apiUrl;
const ok = (data: unknown) => ({ success: true, message: null, data });

describe('authApi.findId — POST /auth/find-id', () => {
  it('매칭 시 username 반환', async () => {
    server.use(
      http.post(`${apiUrl}/auth/find-id`, () =>
        HttpResponse.json(ok({ username: 'tes***01' })),
      ),
    );
    expect(await authApi.findId('a@e.st')).toBe('tes***01');
  });

  it('미매칭(username=null) → null', async () => {
    server.use(
      http.post(`${apiUrl}/auth/find-id`, () =>
        HttpResponse.json(ok({ username: null })),
      ),
    );
    expect(await authApi.findId('none@e.st')).toBeNull();
  });
});

describe('authApi.forgotPassword / resetPassword — Unit 응답', () => {
  it('forgotPassword 는 { username, email } 전송 후 정상 완료', async () => {
    let received: unknown;
    server.use(
      http.post(`${apiUrl}/auth/forgot-password`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(ok(null));
      }),
    );
    await expect(
      authApi.forgotPassword({ username: 'tester', email: 'a@e.st' }),
    ).resolves.toBeUndefined();
    expect(received).toEqual({ username: 'tester', email: 'a@e.st' });
  });

  it('resetPassword 는 { token, password } 전송', async () => {
    let received: unknown;
    server.use(
      http.post(`${apiUrl}/auth/reset-password`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(ok(null));
      }),
    );
    await authApi.resetPassword({ token: 'tok', password: 'Abcd123456' });
    expect(received).toEqual({ token: 'tok', password: 'Abcd123456' });
  });
});

describe('authApi.changePassword / deleteAccount — /me 계정 액션', () => {
  it('changePassword 는 current/new 전송', async () => {
    let received: unknown;
    server.use(
      http.post(`${apiUrl}/me/change-password`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(ok(null));
      }),
    );
    await authApi.changePassword({
      currentPassword: 'old1234567',
      newPassword: 'new1234567',
    });
    expect(received).toEqual({
      currentPassword: 'old1234567',
      newPassword: 'new1234567',
    });
  });

  it('deleteAccount 는 DELETE /me 호출', async () => {
    let called = false;
    server.use(
      http.delete(`${apiUrl}/me`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await authApi.deleteAccount();
    expect(called).toBe(true);
  });
});

describe('authApi.me — UserResponseDto → UserDto(avatarUrl 포함)', () => {
  it('avatarUrl 매핑 + id string 정규화', async () => {
    server.use(
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json(
          ok({
            id: 7,
            username: 'tester',
            nickname: '여행자',
            email: 't@e.st',
            avatarUrl: 'https://cdn/avatars/7.jpg',
          }),
        ),
      ),
    );
    const u = await authApi.me();
    expect(u).toMatchObject({
      id: '7',
      username: 'tester',
      nickname: '여행자',
      email: 't@e.st',
      avatarUrl: 'https://cdn/avatars/7.jpg',
    });
  });

  it('avatarUrl 미제공 → null fallback', async () => {
    server.use(
      http.get(`${apiUrl}/me`, () =>
        HttpResponse.json(
          ok({ id: 8, username: 'x', nickname: 'y', email: '' }),
        ),
      ),
    );
    const u = await authApi.me();
    expect(u.avatarUrl).toBeNull();
  });
});
