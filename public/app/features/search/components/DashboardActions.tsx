import React, { FC } from 'react';
import { HorizontalGroup, LinkButton } from '@grafana/ui';
import { useTranslation } from 'react-i18next';

export interface Props {
  folderId?: number;
  isEditor: boolean;
  canEdit?: boolean;
}

export const DashboardActions: FC<Props> = ({ folderId, isEditor, canEdit }) => {
  const actionUrl = (type: string) => {
    let url = `dashboard/${type}`;

    if (folderId) {
      url += `?folderId=${folderId}`;
    }

    return url;
  };

  const { t } = useTranslation();

  return (
    <HorizontalGroup spacing="md" align="center">
      {canEdit && <LinkButton href={actionUrl('new')}>{t('New Dashboard')}</LinkButton>}
      {!folderId && isEditor && <LinkButton href="dashboards/folder/new">{t('New Folder')}</LinkButton>}
      {canEdit && <LinkButton href={actionUrl('import')}>{t('Import')}</LinkButton>}
    </HorizontalGroup>
  );
};
