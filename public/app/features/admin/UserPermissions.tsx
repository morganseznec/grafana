import React, { PureComponent } from 'react';
import { ConfirmButton, RadioButtonGroup, Icon } from '@grafana/ui';
import { cx } from 'emotion';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  isGrafanaAdmin: boolean;

  onGrafanaAdminChange: (isGrafanaAdmin: boolean) => void;
}

interface State {
  isEditing: boolean;
  currentAdminOption: string;
}

const adminOptions = [
  { label: 'Yes', value: 'YES' },
  { label: 'No', value: 'NO' },
];

class __UserPermissions extends PureComponent<Props, State> {
  state = {
    isEditing: false,
    currentAdminOption: this.props.isGrafanaAdmin ? this.props.t('YES') : this.props.t('NO'),
  };

  onChangeClick = () => {
    this.setState({ isEditing: true });
  };

  onCancelClick = () => {
    this.setState({
      isEditing: false,
      currentAdminOption: this.props.isGrafanaAdmin ? this.props.t('YES') : this.props.t('NO'),
    });
  };

  onGrafanaAdminChange = () => {
    const { currentAdminOption } = this.state;
    const newIsGrafanaAdmin = currentAdminOption === 'YES' ? true : false;
    this.props.onGrafanaAdminChange(newIsGrafanaAdmin);
  };

  onAdminOptionSelect = (value: string) => {
    this.setState({ currentAdminOption: value });
  };

  render() {
    const { isGrafanaAdmin } = this.props;
    const { isEditing, currentAdminOption } = this.state;
    const changeButtonContainerClass = cx('pull-right');

    translateAdminOpts(this.props.t, adminOptions);

    return (
      <>
        <h3 className="page-heading">{this.props.t('Permissions')}</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <table className="filter-table form-inline">
              <tbody>
                <tr>
                  <td className="width-16">{this.props.t('Grafana Admin')}</td>
                  {isEditing ? (
                    <td colSpan={2}>
                      <RadioButtonGroup
                        options={adminOptions}
                        value={currentAdminOption}
                        onChange={this.onAdminOptionSelect}
                      />
                    </td>
                  ) : (
                    <td colSpan={2}>
                      {isGrafanaAdmin ? (
                        <>
                          <Icon name="shield" /> {this.props.t('Yes')}
                        </>
                      ) : (
                        <>{this.props.t('No')}</>
                      )}
                    </td>
                  )}
                  <td>
                    <div className={changeButtonContainerClass}>
                      <ConfirmButton
                        className="pull-right"
                        onClick={this.onChangeClick}
                        onConfirm={this.onGrafanaAdminChange}
                        onCancel={this.onCancelClick}
                        confirmText={this.props.t('Change')}
                      >
                        {this.props.t('Change')}
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
}

function translateAdminOpts(t: any, adminOptions: any) {
  for (let option of adminOptions) {
    option.label = t(option.label);
  }
}

export const UserPermissions = withTranslation()(__UserPermissions);
