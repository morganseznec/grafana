import { css } from '@emotion/css';
import { t } from '@lingui/macro';
import React, { FC, ReactElement } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button, Form, Input, Field } from '@grafana/ui';

import { PasswordField } from '../PasswordField/PasswordField';

import { FormModel } from './LoginCtrl';

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
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field
              label={t({ id: 'login.email-or-username', message: `Email or username` })}
              invalid={!!errors.user}
              error={errors.user?.message}
            >
              <Input
                {...register('user', {
                  required: t({ id: 'login.email-or-username-required', message: `Email or username is required` }),
                })}
                autoFocus
                autoCapitalize="none"
                placeholder={loginHint}
                aria-label={selectors.pages.Login.username}
              />
            </Field>
            <Field
              label={t({ id: 'login.password', message: `Password` })}
              invalid={!!errors.password}
              error={errors.password?.message}
            >
              <PasswordField
                id="current-password"
                autoComplete="current-password"
                passwordHint={passwordHint}
                {...register('password', {
                  required: t({ id: 'login.password-required', message: `Password is required` }),
                })}
              />
            </Field>
            <Button aria-label={selectors.pages.Login.submit} className={submitButton} disabled={isLoggingIn}>
              {isLoggingIn
                ? t({ id: 'login.logging-in', message: `Logging in...` })
                : t({ id: 'login.log-in', message: `Log in` })}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
