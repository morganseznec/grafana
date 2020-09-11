import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';
import { CoreEvents } from 'app/types';
import { Branding } from 'app/core/components/Branding/Branding';
import { Icon } from '@grafana/ui';
import { withTranslation, WithTranslation } from 'react-i18next';

const homeUrl = config.appSubUrl || '/';

export interface Props extends WithTranslation {}

class SideMenu extends PureComponent<Props> {
  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit(CoreEvents.toggleSidemenuMobile);
  };

  render() {
    return [
      <a href={homeUrl} className="sidemenu__logo" key="logo">
        <Branding.MenuLogo />
      </a>,
      <div className="sidemenu__logo_small_breakpoint" onClick={this.toggleSideMenuSmallBreakpoint} key="hamburger">
        <Icon name="bars" size="xl" />
        <span className="sidemenu__close">
          <Icon name="times" />
          &nbsp;{this.props.t('Close')}
        </span>
      </div>,
      <TopSection key="topsection" />,
      <BottomSection key="bottomsection" />,
    ];
  }
}

export default withTranslation()(SideMenu);
