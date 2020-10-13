import React, { FC } from 'react';
import { Language } from '@grafana/data';
import { Select } from '@grafana/ui';
import { css, cx } from 'emotion';

interface Props {
  value: string;
  onChange: (language: string) => void;
}

const options = Object.entries(Language).map(lang => ({ label: lang[1], value: lang[0] }));

export const LanguagePicker: FC<Props> = ({ value, onChange, ...restProps }) => (
  <Select
    value={value}
    options={options}
    onChange={val => onChange(val.value as string)}
    placeholder="Choose language..."
    className={cx(
      css`
        max-width: 100px;
        margin-right: 20px;
        margin-left: auto;
        margin-bottom: -32px;
      `
    )}
    {...restProps}
  />
);
