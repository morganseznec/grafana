import { t } from '@lingui/macro';
import React, { FC, SyntheticEvent } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Tooltip, Form, Field, VerticalGroup, Button } from '@grafana/ui';

import { submitButton } from '../Login/LoginForm';
import { PasswordField } from '../PasswordField/PasswordField';
interface Props {
  onSubmit: (pw: string) => void;
  onSkip?: (event?: SyntheticEvent) => void;
}

interface PasswordDTO {
  newPassword: string;
  confirmNew: string;
}

export const ChangePassword: FC<Props> = ({ onSubmit, onSkip }) => {
  const submit = (passwords: PasswordDTO) => {
    onSubmit(passwords.newPassword);
  };
  return (
    <Form onSubmit={submit}>
      {({ errors, register, getValues }) => (
        <>
          <Field
            label={t({ id: 'forgotten-password.new-password', message: `New password` })}
            invalid={!!errors.newPassword}
            error={errors?.newPassword?.message}
          >
            <PasswordField
              id="new-password"
              autoFocus
              autoComplete="new-password"
              {...register('newPassword', {
                required: t({ id: 'forgotten-password.new-password-is-required', message: `New Password is required` }),
              })}
            />
          </Field>
          <Field
            label={t({ id: 'forgotten-password.confirm-new-password', message: `Confirm new password` })}
            invalid={!!errors.confirmNew}
            error={errors?.confirmNew?.message}
          >
            <PasswordField
              id="confirm-new-password"
              autoComplete="new-password"
              {...register('confirmNew', {
                required: t({
                  id: 'forgotten-password.password-is-required',
                  message: `Confirmed Password is required`,
                }),
                validate: (v: string) =>
                  v === getValues().newPassword ||
                  t({ id: 'forgotten-password.password-must-match', message: `Passwords must match!` }),
              })}
            />
          </Field>
          <VerticalGroup>
            <Button type="submit" className={submitButton}>
              {t({ id: 'forgotten-password.submit', message: `Submit` })}
            </Button>

            {onSkip && (
              <Tooltip
                content={t({
                  id: 'forgotten-password.skip-description',
                  message: `If you skip you will be prompted to change password next time you log in.`,
                })}
                placement="bottom"
              >
                <Button fill="text" onClick={onSkip} type="button" aria-label={selectors.pages.Login.skip}>
                  {t({ id: 'forgotten-password.skip', message: `Skip` })}
                </Button>
              </Tooltip>
            )}
          </VerticalGroup>
        </>
      )}
    </Form>
  );
};
