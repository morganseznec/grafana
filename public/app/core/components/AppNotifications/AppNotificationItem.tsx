import React, { Component } from 'react';
import { AppNotification } from 'app/types';
import { Alert } from '@grafana/ui';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  appNotification: AppNotification;
  onClearNotification: (id: string) => void;
}

class AppNotificationItem extends Component<Props> {
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
    return (
      <Alert
        severity={appNotification.severity}
        title={this.props.t(appNotification.title)}
        children={appNotification.component || this.props.t(appNotification.text)}
        onRemove={() => onClearNotification(appNotification.id)}
      />
    );
  }
}

export default withTranslation()(AppNotificationItem);
