import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';
import { CoreEvents } from 'app/types';
import { Branding } from 'app/core/components/Branding/Branding';
import { Icon } from '@grafana/ui';
import { Translation } from 'react-i18next';
import IdleTimer, { IdleTimerProps } from 'react-idle-timer';

const homeUrl = config.appSubUrl || '/';

export interface Props extends IdleTimerProps {}

export interface State {
  remaining: number | null;
  lastActive: number | null;
  elapsed: number | null;
  isIdle: boolean;
}

class SideMenu extends PureComponent<Props, State> {
  idleTimer: IdleTimer | null;
  timeout: number;
  state: State = {
    remaining: null,
    lastActive: null,
    elapsed: null,
    isIdle: false,
  };

  constructor(props: Readonly<Props>) {
    super(props);
    this.idleTimer = null;
    this.timeout = 300;
    this.handleAction = this.handleAction.bind(this);
  }

  async componentDidMount() {
    this.setState({
      remaining: this.idleTimer && this.idleTimer.getRemainingTime(),
      lastActive: this.idleTimer && this.idleTimer.getLastActiveTime(),
      elapsed: this.idleTimer && this.idleTimer.getElapsedTime(),
    });
  }

  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit(CoreEvents.toggleSidemenuMobile);
  };

  handleAction(e: any) {
    console.log('user action');
    if (this.idleTimer) {
      this.idleTimer.resume();
    }
  }

  render() {
    return [
      <a href={homeUrl} className="sidemenu__logo" key="logo">
        <Branding.MenuLogo />
        <IdleTimer
          ref={ref => {
            this.idleTimer = ref;
          }}
          element={document}
          onAction={this.handleAction}
          debounce={250}
          timeout={this.timeout}
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
