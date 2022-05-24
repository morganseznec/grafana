import { css } from '@emotion/css';
import { t, Trans } from '@lingui/macro';
import React, { FC, useState } from 'react';

import { GrafanaTheme } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Form, Field, Input, Button, Legend, Container, useStyles, HorizontalGroup, LinkButton } from '@grafana/ui';
import config from 'app/core/config';

interface EmailDTO {
  userOrEmail: string;
}

const paragraphStyles = (theme: GrafanaTheme) => css`
  color: ${theme.colors.formDescription};
  font-size: ${theme.typography.size.sm};
  font-weight: ${theme.typography.weight.regular};
  margin-top: ${theme.spacing.sm};
  display: block;
`;

export const ForgottenPassword: FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  const styles = useStyles(paragraphStyles);
  const loginHref = `${config.appSubUrl}/login`;

  const sendEmail = async (formModel: EmailDTO) => {
    const res = await getBackendSrv().post('/api/user/password/send-reset-email', formModel);
    if (res) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div>
        <p>
          <Trans id="reset-password.description">
            An email with a reset link has been sent to the email address. You should receive it shortly.
          </Trans>
        </p>
        <Container margin="md" />
        <LinkButton variant="primary" href={loginHref}>
          {t({ id: 'reset-password.back-to-login', message: `Back to login` })}
        </LinkButton>
      </div>
    );
  }
  return (
    <Form onSubmit={sendEmail}>
      {({ register, errors }) => (
        <>
          <Legend>{t({ id: 'reset-password.legend', message: `Reset password` })}</Legend>
          <Field
            label={t({ id: 'reset-password.label', message: `User` })}
            description={t({
              id: 'reset-password.field-description',
              message: `Enter your information to get a reset link sent to you`,
            })}
            invalid={!!errors.userOrEmail}
            error={errors?.userOrEmail?.message}
          >
            <Input
              id="user-input"
              placeholder={t({ id: 'reset-password.placeholder', message: `Email or username` })}
              {...register('userOrEmail', {
                required: t({
                  id: 'reset-password.email-or-username-required',
                  message: `Email or username is required`,
                }),
              })}
            />
          </Field>
          <HorizontalGroup>
            <Button>{t({ id: 'reset-password.send-reset-email', message: `Send reset email` })}</Button>
            <LinkButton fill="text" href={loginHref}>
              {t({ id: 'reset-password.back-to-login', message: `Back to login` })}
            </LinkButton>
          </HorizontalGroup>

          <p className={styles}>
            <Trans id="reset-password.forget-username">
              Did you forget your username or email? Contact your Grafana administrator.
            </Trans>
          </p>
        </>
      )}
    </Form>
  );
};
