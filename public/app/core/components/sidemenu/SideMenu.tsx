import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';
import { CoreEvents } from 'app/types';
import { Branding } from 'app/core/components/Branding/Branding';
import { Icon, ConfirmModal } from '@grafana/ui';
import { Translation } from 'react-i18next';
import IdleTimer, { IdleTimerProps } from 'react-idle-timer';
import { refreshToken } from './state/actions';

const homeUrl = config.appSubUrl || '/';

export interface Props extends IdleTimerProps {
  refreshToken: typeof refreshToken;
}

export interface State {
  timeout: number;
  confirmModal: boolean;
  isTimedOut: boolean;
  timeRemainingInSeconds: number;
}

class SideMenu extends PureComponent<Props, State> {
  idleTimer: IdleTimer | null;
  private timer: any;
  state: State = {
    timeout: 1000 * 270,
    confirmModal: false,
    isTimedOut: false,
    timeRemainingInSeconds: 30,
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

  decrementTimeRemaining = () => {
    if (this.state.timeRemainingInSeconds > 0) {
      this.setState({
        timeRemainingInSeconds: this.state.timeRemainingInSeconds - 1,
      });
    } else {
      clearInterval(this.timer!);
      this.handleLogout();
    }
  };

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

  onAction(e: any) {
    this.setState({ isTimedOut: false });
    if (window.location.pathname !== '/login' && window.location.pathname !== '/user/password/send-reset-email') {
      if (this.needRefresh()) {
        refreshToken();
        window.sessionStorage.setItem('refreshed_at', new Date().toISOString());
      }
    }
  }

  onActive(e: any) {
    this.setState({ isTimedOut: false });
  }

  onIdle(e: any) {
    const isTimedOut = this.state.isTimedOut;
    if (isTimedOut) {
      console.log('isTimedOut: ', isTimedOut);
      //this.props.history.push('/login');
    } else {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/user/password/send-reset-email') {
        this.setState({ confirmModal: true });
        this.timer = setInterval(() => {
          this.decrementTimeRemaining();
        }, 1000);
      }
      if (this.idleTimer) {
        this.idleTimer.reset();
      }
      this.setState({ isTimedOut: true });
    }
  }

  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit(CoreEvents.toggleSidemenuMobile);
  };

  handleClose() {
    this.setState({ confirmModal: false });
    clearInterval(this.timer!);
    this.setState({
      timeRemainingInSeconds: 30,
    });
  }

  handleLogout() {
    this.setState({ confirmModal: false });
    window.location.assign('/logout');
  }

  render() {
    let modalBody = `You will be logged out automatically in ${this.state.timeRemainingInSeconds}s. You want to stay?`;

    return [
      <a href={homeUrl} className="sidemenu__logo" key="logo">
        <Branding.MenuLogo />
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
      </a>,
      <div className="sidemenu__logo_small_breakpoint" onClick={this.toggleSideMenuSmallBreakpoint} key="hamburger">
        <Icon name="bars" size="xl" />
        <span className="sidemenu__close">
          <Icon name="times" />
          &nbsp;<Translation>{t => t('Close')}</Translation>
        </span>
      </div>,
      <TopSection key="topsection" />,
      <BottomSection key="bottomsection" />,
    ];
  }
}

export default SideMenu;
