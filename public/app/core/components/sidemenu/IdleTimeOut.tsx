import React, { PureComponent } from 'react';
import { ConfirmModal } from '@grafana/ui';
import IdleTimer, { IdleTimerProps } from 'react-idle-timer';
import { refreshToken } from './state/actions';

const unAuthenticatedPaths = ['/login', '/user/password/send-reset-email'];

const documentTitle = document.title;

export interface Props extends IdleTimerProps {
  refreshToken: typeof refreshToken;
}

export interface State {
  timeout: number;
  confirmModal: boolean;
  isTimedOut: boolean;
  // AnimationFrame
  targetDate: Date | null;
  remainingSeconds: Number;
}

class IdleTimeOut extends PureComponent<Props, State> {
  idleTimer: IdleTimer | null;

  state: State = {
    timeout: 1000 * 270,
    confirmModal: false,
    isTimedOut: false,
    // AnimationFrame
    targetDate: null,
    remainingSeconds: 30,
  };

  countItDown = () => {
    requestAnimationFrame(() => {
      if (this.state.confirmModal === true) {
        const diff = Math.floor((Number(this.state.targetDate) - new Date().getTime()) / 1000);
        this.setState({ remainingSeconds: diff });
        if (diff > 0) {
          this.countItDown();
          document.title = `(${this.state.remainingSeconds}) ${document.title}`;
        } else {
          this.handleLogout();
        }
      }
    });
  };

  constructor(props: Readonly<Props>) {
    super(props);
    this.idleTimer = null;
    this.onAction = this.onAction.bind(this);
    this.onActive = this.onActive.bind(this);
    this.onIdle = this.onIdle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  needRefresh = (): boolean => {
    const refreshAt = sessionStorage.getItem('refreshed_at');
    if (refreshAt === null) {
      return true;
    } else {
      const diff = Number(new Date()) - Number(Date.parse(refreshAt));
      if (diff > 60000) {
        return true;
      }
      return false;
    }
  };

  onAction() {
    this.setState({ isTimedOut: false });
    if (!unAuthenticatedPaths.includes(window.location.pathname)) {
      if (this.needRefresh()) {
        refreshToken();
        window.sessionStorage.setItem('refreshed_at', new Date().toISOString());
      }
    }
  }

  onActive() {
    this.setState({ isTimedOut: false });
  }

  onIdle() {
    const isTimedOut = this.state.isTimedOut;
    if (isTimedOut) {
      console.log('isTimedOut: ', isTimedOut);
    } else {
      if (!unAuthenticatedPaths.includes(window.location.pathname)) {
        const d = new Date();
        d.setSeconds(d.getSeconds() + 30);
        this.setState({ confirmModal: true, targetDate: d });
        this.countItDown();
      }
      if (this.idleTimer) {
        this.idleTimer.reset();
      }
      this.setState({ isTimedOut: true });
    }
  }

  handleClose() {
    this.setState({ confirmModal: false, remainingSeconds: 30 });
    refreshToken();
    window.sessionStorage.setItem('refreshed_at', new Date().toISOString());
    document.title = documentTitle;
  }

  handleLogout() {
    this.setState({ confirmModal: false });
    window.location.assign('/logout');
  }

  render() {
    let modalBody = `You will be logged out automatically in ${this.state.remainingSeconds}s. You want to stay?`;

    return (
      <div>
        <IdleTimer
          ref={ref => {
            this.idleTimer = ref;
          }}
          element={document}
          onActive={this.onActive}
          startOnMount={true}
          onIdle={this.onIdle}
          onAction={this.onAction}
          debounce={250}
          timeout={this.state.timeout}
        />
        <ConfirmModal
          isOpen={this.state.confirmModal}
          title="Inactive user"
          body={modalBody}
          confirmText="Logout"
          dismissText="Stay"
          icon="exclamation-triangle"
          onConfirm={this.handleLogout}
          onDismiss={this.handleClose}
        />
      </div>
    );
  }
}

export default IdleTimeOut;
