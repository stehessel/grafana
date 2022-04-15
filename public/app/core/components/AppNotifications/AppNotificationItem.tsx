import React, { Component } from 'react';

import { Alert } from '@grafana/ui';
import { AppNotification } from 'app/types';

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

    return (
      <Alert
        severity={appNotification.severity}
        title={appNotification.title}
        onRemove={() => onClearNotification(appNotification.id)}
        elevated
      >
        {appNotification.component || appNotification.text}
      </Alert>
    );
  }
}
