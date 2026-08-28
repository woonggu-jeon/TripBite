'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { Checkbox } from '@/components/forms/Checkbox';
import styles from './ConsentBlock.module.scss';

/**
 * <ConsentBlock />
 *
 * [보존/preserved] 현재 온보딩/가입 플로우에서 미마운트(약관 동의 step 노출 보류)라
 * 미사용. 동의 step 재노출 시 재사용하는 설계 완료 UI — dead-code sweep 제외(의도적 보존).
 *
 * 회원가입 / 온보딩 시 노출하는 동의 체크박스 그룹.
 *
 * 한국 법 준수 사항:
 *   - 만 14세 이상 확인 (PIPA)
 *   - 이용약관 동의 (필수)
 *   - 개인정보처리방침 동의 (필수)
 *   - 위치정보 수집 동의 (선택, 위치정보법)
 *   - 마케팅 정보 수신 (선택, 정보통신망법)
 *
 * 디자인 원칙:
 *   - "전체 동의" 는 필수만 동의시키도록 분리 — 일괄 동의 강요 금지
 *   - 약관 본문 링크는 새 탭이 아닌 같은 탭 (PWA)
 *   - 필수 항목 미체크 시 onSubmit 호출 불가
 *
 * 사용:
 *   <ConsentBlock onChange={(state) => setCanSubmit(state.allRequired)} />
 *
 *   submit 시 다음 정보를 백엔드에 전송:
 *     - termsVersion
 *     - privacyVersion
 *     - marketingOptIn
 *     - locationOptIn (위치 권한과 별개로 명시적 동의 여부)
 */
export type ConsentState = {
  age14: boolean;
  terms: boolean;
  privacy: boolean;
  location: boolean;
  marketing: boolean;
  allRequired: boolean;
};

export function ConsentBlock({
  onChange,
}: {
  onChange?: (state: ConsentState) => void;
}) {
  const t = useTranslations('consent');
  const [age14, setAge14] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [location, setLocation] = useState(false);
  const [marketing, setMarketing] = useState(false);

  function emit(next: Partial<ConsentState>) {
    const merged = { age14, terms, privacy, location, marketing, ...next };
    const allRequired = merged.age14 && merged.terms && merged.privacy;
    onChange?.({ ...merged, allRequired });
  }

  function setAll(value: boolean) {
    setAge14(value);
    setTerms(value);
    setPrivacy(value);
    setLocation(value);
    setMarketing(value);
    emit({
      age14: value,
      terms: value,
      privacy: value,
      location: value,
      marketing: value,
    });
  }

  return (
    <div className={styles.wrap}>
      <label className={`${styles.row} ${styles.allRow}`}>
        <Checkbox
          checked={age14 && terms && privacy && location && marketing}
          onChange={setAll}
        />
        <span className={styles.label}>{t('all')}</span>
      </label>

      <div className={styles.divider} />

      <Row
        required
        checked={age14}
        label={t('age14')}
        onChange={(v) => {
          setAge14(v);
          emit({ age14: v });
        }}
      />
      <Row
        required
        checked={terms}
        label={t('terms')}
        href="/policy/terms"
        onChange={(v) => {
          setTerms(v);
          emit({ terms: v });
        }}
      />
      <Row
        required
        checked={privacy}
        label={t('privacy')}
        href="/policy/privacy"
        onChange={(v) => {
          setPrivacy(v);
          emit({ privacy: v });
        }}
      />
      <Row
        checked={location}
        label={t('location')}
        onChange={(v) => {
          setLocation(v);
          emit({ location: v });
        }}
      />
      <Row
        checked={marketing}
        label={t('marketing')}
        onChange={(v) => {
          setMarketing(v);
          emit({ marketing: v });
        }}
      />
    </div>
  );
}

function Row({
  checked,
  label,
  required,
  href,
  onChange,
}: {
  checked: boolean;
  label: string;
  required?: boolean;
  href?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <Checkbox checked={checked} onChange={onChange} />
      <span className={styles.label}>
        <span className={required ? styles.required : styles.optional}>
          [{required ? '필수' : '선택'}]
        </span>{' '}
        {label}
      </span>
      {href && (
        <Link
          href={href as React.ComponentProps<typeof Link>['href']}
          className={styles.viewLink}
        >
          보기
        </Link>
      )}
    </label>
  );
}
