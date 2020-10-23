import React, { PureComponent } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import PermissionsListItem from './PermissionListItem';
import DisabledPermissionsListItem from './DisabledPermissionListItem';
import { FolderInfo } from 'app/types';
import { DashboardAcl } from 'app/types/acl';

export interface Props extends WithTranslation {
  items: DashboardAcl[];
  onRemoveItem: (item: DashboardAcl) => void;
  onPermissionChanged: any;
  isFetching: boolean;
  folderInfo?: FolderInfo;
}

class PermissionList extends PureComponent<Props> {
  render() {
    const { items, onRemoveItem, onPermissionChanged, isFetching, folderInfo, t } = this.props;
    return (
      <table className="filter-table gf-form-group">
        <tbody>
          <DisabledPermissionsListItem
            key={0}
            item={{
              name: 'Admin',
              permission: 4,
              icon: 'fa fa-fw fa-street-view',
            }}
          />
          {items.map((item, idx) => {
            return (
              <PermissionsListItem
                key={idx + 1}
                item={item}
                onRemoveItem={onRemoveItem}
                onPermissionChanged={onPermissionChanged}
                folderInfo={folderInfo}
              />
            );
          })}
          {isFetching === true && items.length < 1 ? (
            <tr>
              <td colSpan={4}>
                <em>{t('Loading permissions...')}</em>
              </td>
            </tr>
          ) : null}

          {isFetching === false && items.length < 1 ? (
            <tr>
              <td colSpan={4}>
                <em>{t('No permissions are set. Will only be accessible by admins.')}</em>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    );
  }
}

export default withTranslation()(PermissionList);
