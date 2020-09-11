import React, { Component } from 'react';
import { AppNotification } from 'app/types';
import { Alert } from '@grafana/ui';
import { useTranslation } from 'react-i18next';

interface Props {
  appNotification: AppNotification;
  onClearNotification: (id: string) => void;
}

export default class AppNotificationItem extends Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.appNotification.id !== nextProps.appNotification.id;
  }

  componentDidMount() {
    const { appNotification, onClearNotification } = this.props;
    setTimeout(() => {
      onClearNotification(appNotification.id);
    }, appNotification.timeout);
  }

  render() {
    const { appNotification, onClearNotification } = this.props;
    const { t } = useTranslation();
    return (
      <Alert
        severity={appNotification.severity}
        title={t(appNotification.title)}
        children={appNotification.component || t(appNotification.text)}
        onRemove={() => onClearNotification(appNotification.id)}
      />
    );
  }
}
