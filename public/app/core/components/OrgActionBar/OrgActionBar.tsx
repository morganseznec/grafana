import React, { PureComponent } from 'react';
import { FilterInput } from '../FilterInput/FilterInput';
import { LinkButton } from '@grafana/ui';
import { withTranslation, WithTranslation } from 'react-i18next';

export interface Props extends WithTranslation {
  searchQuery: string;
  setSearchQuery: (value: string) => {};
  linkButton: { href: string; title: string };
  target?: string;
}

class OrgActionBar extends PureComponent<Props> {
  render() {
    const { searchQuery, linkButton, setSearchQuery, target } = this.props;
    const linkProps = { href: linkButton.href };

    if (target) {
      (linkProps as any).target = target;
    }

    return (
      <div className="page-action-bar">
        <div className="gf-form gf-form--grow">
          <FilterInput
            labelClassName="gf-form--has-input-icon"
            inputClassName="gf-form-input width-20"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={this.props.t('Search by name or type')}
          />
        </div>
        <div className="page-action-bar__spacer" />
        <LinkButton {...linkProps}>{linkButton.title}</LinkButton>
      </div>
    );
  }
}

export default withTranslation()(OrgActionBar);
