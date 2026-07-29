'use client';

import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import { Icon } from '@/components/icon/Icon';
import styles from './PasswordField.module.scss';
import { TextField, type TextFieldProps } from './TextField';

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

/**
 * 비밀번호 입력 primitive — TextField 위에 visibility 토글 (Eye/EyeOff) overlay.
 *
 *   - 내부 state `visible` → type=text / password 토글
 *   - 토글 button 은 input 내부 우측 (trailingAdornment) — text 와 안 겹침
 *   - aria-label 은 i18n (`common.showPassword` / `common.hidePassword`)
 *   - autoComplete (current-password / new-password) 호출 측에서 명시
 *
 * 사용:
 *   <PasswordField
 *     id="password"
 *     label={t('password')}
 *     autoComplete="current-password"
 *     errorMessage={errors.password ? t(errors.password.message) : undefined}
 *     {...register('password')}
 *   />
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const t = useTranslations('common');
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailingAdornment={
          <button
            type="button"
            className={styles.toggle}
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {/* Figma "IC-20px" — visible 시 eye-on (muted), hidden 시 eye-off
                (disabled). path 동일, currentColor 동적 색. */}
            <Icon name={visible ? 'eye-on' : 'eye-off'} size={20} />
          </button>
        }
        {...props}
      />
    );
  },
);
