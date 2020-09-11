import React, { PureComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { LegacyForms, Icon } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { dashboardPermissionLevels, DashboardAcl, PermissionLevel } from 'app/types/acl';
import { FolderInfo } from 'app/types';
const { Select } = LegacyForms;

const setClassNameHelper = (inherited: boolean) => {
  return inherited ? 'gf-form-disabled' : '';
};

function ItemAvatar({ item }: { item: DashboardAcl }) {
  if (item.userAvatarUrl) {
    return <img className="filter-table__avatar" src={item.userAvatarUrl} />;
  }
  if (item.teamAvatarUrl) {
    return <img className="filter-table__avatar" src={item.teamAvatarUrl} />;
  }
  if (item.role === 'Editor') {
    return <Icon size="lg" name="edit" />;
  }

  return <Icon size="lg" name="eye" />;
}

function ItemDescription({ item }: { item: DashboardAcl }) {
  const { t } = useTranslation();
  if (item.userId) {
    return <span className="filter-table__weak-italic">({t('User')})</span>;
  }
  if (item.teamId) {
    return <span className="filter-table__weak-italic">({t('Team')})</span>;
  }
  return <span className="filter-table__weak-italic">({t('Role')})</span>;
}

interface Props {
  item: DashboardAcl;
  onRemoveItem: (item: DashboardAcl) => void;
  onPermissionChanged: (item: DashboardAcl, level: PermissionLevel) => void;
  folderInfo?: FolderInfo;
}

export default class PermissionsListItem extends PureComponent<Props> {
  onPermissionChanged = (option: SelectableValue<PermissionLevel>) => {
    this.props.onPermissionChanged(this.props.item, option.value!);
  };

  onRemoveItem = () => {
    this.props.onRemoveItem(this.props.item);
  };

  render() {
    const { item, folderInfo } = this.props;
    const inheritedFromRoot = item.dashboardId === -1 && !item.inherited;
    const currentPermissionLevel = dashboardPermissionLevels.find(dp => dp.value === item.permission);
    const { t } = useTranslation();

    return (
      <tr className={setClassNameHelper(Boolean(item?.inherited))}>
        <td style={{ width: '1%' }}>
          <ItemAvatar item={item} />
        </td>
        <td style={{ width: '90%' }}>
          {item.name} <ItemDescription item={item} />
        </td>
        <td>
          {item.inherited && folderInfo && (
            <em className="muted no-wrap">
              {t('Inherited from folder')}{' '}
              <a className="text-link" href={`${folderInfo.url}/permissions`}>
                {folderInfo.title}
              </a>{' '}
            </em>
          )}
          {inheritedFromRoot && <em className="muted no-wrap">{t('Default Permission')}</em>}
        </td>
        <td className="query-keyword">{t('Can')}</td>
        <td>
          <div className="gf-form">
            <Select
              isSearchable={false}
              options={dashboardPermissionLevels}
              onChange={this.onPermissionChanged}
              isDisabled={item.inherited}
              className="gf-form-select-box__control--menu-right"
              value={currentPermissionLevel}
            />
          </div>
        </td>
        <td>
          {!item.inherited ? (
            <a className="btn btn-danger btn-small" onClick={this.onRemoveItem}>
              <Icon name="times" style={{ marginBottom: 0 }} />
            </a>
          ) : (
            <button className="btn btn-inverse btn-small">
              <Icon name="lock" style={{ marginBottom: '3px' }} />
            </button>
          )}
        </td>
      </tr>
    );
  }
}
