import React from 'react';
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();
  return (
    <div className="">
      <h5>{t('What are Permissions?')}</h5>
      <p>
        {t('An Access Control List (ACL) model is used to limit access to Dashboard Folders. A user or a Team can be')}
        {t('assigned permissions for a folder or for a single dashboard.')}
      </p>
    </div>
  );
};
