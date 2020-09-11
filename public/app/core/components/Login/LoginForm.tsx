import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { selectors } from '@grafana/e2e-selectors';

import { FormModel } from './LoginCtrl';
import { Button, Form, Input, Field } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
`;

export const LoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  const { t } = useTranslation();
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field label={t('Email or username')} invalid={!!errors.user} error={errors.user?.message}>
              <Input
                autoFocus
                name="user"
                ref={register({ required: String(t('Email or username is required')) })}
                placeholder={t(loginHint)}
                aria-label={selectors.pages.Login.username}
              />
            </Field>
            <Field label={t('Password')} invalid={!!errors.password} error={errors.password?.message}>
              <Input
                name="password"
                type="password"
                placeholder={t(passwordHint)}
                ref={register({ required: String(t('Password is required')) })}
                aria-label={selectors.pages.Login.password}
              />
            </Field>
            <Button aria-label={selectors.pages.Login.submit} className={submitButton} disabled={isLoggingIn}>
              {isLoggingIn ? t('Logging in...') : t('Log in')}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
