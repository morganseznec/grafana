import React, { PureComponent } from 'react';
import { ConfirmModal } from '@grafana/ui';
import IdleTimer, { IdleTimerProps } from 'react-idle-timer';
import { getBackendSrv } from '@grafana/runtime';

export interface Props extends IdleTimerProps {
  userId: number;
}

const defaultRemainingSeconds = 30;

export interface State {
  timeout: number;
  confirmModal: boolean;
  isTimedOut: boolean;
  // AnimationFrame
  targetDate: number;
  remainingSeconds: number;
}

class IdleTimeOut extends PureComponent<Props, State> {
  idleTimer: IdleTimer | null;
  idleChannel: BroadcastChannel;
  interval: any;
  _updateGuard: any;

  state: State = {
    timeout: 1000 * 270,
    confirmModal: false,
    isTimedOut: false,
    // AnimationFrame
    targetDate: 0,
    remainingSeconds: defaultRemainingSeconds,
  };

  constructor(props: Readonly<Props>) {
    super(props);

    this.idleChannel = new BroadcastChannel('idleUser');

    this.idleTimer = null;
    this.onAction = this.onAction.bind(this);
    this.onActive = this.onActive.bind(this);
    this.onIdle = this.onIdle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogout = this.handleLogout.bind(this);

    this.interval = setInterval(() => {
      this.idleChannel.onmessage = message => this.updateTimer(message);
      if (
        this.idleTimer &&
        this.state.isTimedOut === true &&
        Date.now() > this.idleTimer.getLastActiveTime() + this.state.timeout + defaultRemainingSeconds * 1000
      ) {
        this.logout();
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  updateTimer(message: any) {
    const userId = message.data.userId;
    if (userId === this.props.userId) {
      if (this.idleTimer) {
        this.idleTimer.reset();
      }
    }
  }

  countItDown = () => {
    requestAnimationFrame(() => {
      if (this.state.confirmModal === true) {
        const diff = Math.floor((Number(this.state.targetDate) - new Date().getTime()) / 1000);
        this.setState({ remainingSeconds: diff });
        if (diff > 0) {
          this.countItDown();
        } else {
          this.handleLogout();
        }
      }
    });
  };

  refresh() {
    getBackendSrv().loginPing();
    localStorage.setItem('next_refresh_at', String(Date.now() + defaultRemainingSeconds * 1000));
  }

  doPing() {
    if (this._updateGuard) {
      clearTimeout(this._updateGuard);
    }
    this._updateGuard = setTimeout(() => {
      const localValue = localStorage.getItem('next_refresh_at');
      if (localValue !== null) {
        const expiredTime = parseInt(localValue, 10);
        const currentTime = Date.now();
        if (expiredTime < currentTime) {
          this.refresh();
          this.idleChannel.postMessage({
            userId: this.props.userId,
          });
        }
      } else {
        this.refresh();
      }
    }, 1000);
  }

  onAction() {
    this.setState({ isTimedOut: false });
    this.doPing();
  }

  onActive() {
    this.setState({ isTimedOut: false });
    this.doPing();
  }

  onIdle() {
    const isTimedOut = this.state.isTimedOut;
    if (!isTimedOut) {
      this.setState({
        isTimedOut: true,
        confirmModal: true,
        targetDate: Date.now() + this.state.remainingSeconds * 1000,
      });
      this.countItDown();
    } else {
      this.setState({ isTimedOut: false });
      if (this.idleTimer) {
        this.idleTimer.reset();
      }
    }
  }

  handleClose() {
    this.setState({ confirmModal: false, remainingSeconds: defaultRemainingSeconds });
  }

  handleLogout() {
    this.setState({ confirmModal: false });
    this.logout();
  }

  logout() {
    clearTimeout(this._updateGuard);
    this.idleChannel.close();
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
          title="Inactive session"
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
