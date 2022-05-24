import { defineMessage } from '@lingui/macro';

import { PanelMenuItem } from '@grafana/data';
import { AngularComponent, getDataSourceSrv, locationService } from '@grafana/runtime';
import { PanelCtrl } from 'app/angular/panel/panel_ctrl';
import config from 'app/core/config';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import {
  addLibraryPanel,
  copyPanel,
  duplicatePanel,
  removePanel,
  sharePanel,
  unlinkLibraryPanel,
} from 'app/features/dashboard/utils/panel';
import { isPanelModelLibraryPanel } from 'app/features/library-panels/guard';
import { store } from 'app/store/store';

import { contextSrv } from '../../../core/services/context_srv';
import { getExploreUrl } from '../../../core/utils/explore';
import { navigateToExplore } from '../../explore/state/main';
import { getTimeSrv } from '../services/TimeSrv';

export function getPanelMenu(
  dashboard: DashboardModel,
  panel: PanelModel,
  angularComponent?: AngularComponent | null
): PanelMenuItem[] {
  const onViewPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    locationService.partial({
      viewPanel: panel.id,
    });
  };

  const onEditPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    locationService.partial({
      editPanel: panel.id,
    });
  };

  const onSharePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    sharePanel(dashboard, panel);
  };

  const onAddLibraryPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    addLibraryPanel(dashboard, panel);
  };

  const onUnlinkLibraryPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    unlinkLibraryPanel(panel);
  };

  const onInspectPanel = (tab?: string) => {
    locationService.partial({
      inspect: panel.id,
      inspectTab: tab,
    });
  };

  const onMore = (event: React.MouseEvent<any>) => {
    event.preventDefault();
  };

  const onDuplicatePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    duplicatePanel(dashboard, panel);
  };

  const onCopyPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    copyPanel(panel);
  };

  const onRemovePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    removePanel(dashboard, panel, true);
  };

  const onNavigateToExplore = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    const openInNewWindow =
      event.ctrlKey || event.metaKey ? (url: string) => window.open(`${config.appSubUrl}${url}`) : undefined;
    store.dispatch(navigateToExplore(panel, { getDataSourceSrv, getTimeSrv, getExploreUrl, openInNewWindow }) as any);
  };

  const menu: PanelMenuItem[] = [];

  if (!panel.isEditing) {
    menu.push({
      text: 'View',
      definedMessage: defineMessage({ message: 'View' }),
      iconClassName: 'eye',
      id: 'panel-menu.view',
      onClick: onViewPanel,
      shortcut: 'v',
    });
  }

  if (dashboard.canEditPanel(panel) && !panel.isEditing) {
    menu.push({
      text: 'Edit',
      definedMessage: defineMessage({ message: 'Edit' }),
      iconClassName: 'edit',
      id: 'panel-menu.edit',
      onClick: onEditPanel,
      shortcut: 'e',
    });
  }

  menu.push({
    text: 'Share',
    definedMessage: defineMessage({ message: 'Share' }),
    iconClassName: 'share-alt',
    id: 'panel-menu.share',
    onClick: onSharePanel,
    shortcut: 'p s',
  });

  if (contextSrv.hasAccessToExplore() && !(panel.plugin && panel.plugin.meta.skipDataQuery)) {
    menu.push({
      text: 'Explore',
      definedMessage: defineMessage({ message: 'Explore' }),
      iconClassName: 'compass',
      id: 'panel-menu.explore',
      shortcut: 'x',
      onClick: onNavigateToExplore,
    });
  }

  const inspectMenu: PanelMenuItem[] = [];

  // Only show these inspect actions for data plugins
  if (panel.plugin && !panel.plugin.meta.skipDataQuery) {
    inspectMenu.push({
      text: 'Data',
      definedMessage: defineMessage({ message: 'Data' }),
      onClick: (e: React.MouseEvent<any>) => onInspectPanel('data'),
    });

    if (dashboard.meta.canEdit) {
      inspectMenu.push({
        text: 'Query',
        definedMessage: defineMessage({ message: 'Query' }),
        onClick: (e: React.MouseEvent<any>) => onInspectPanel('query'),
      });
    }
  }

  inspectMenu.push({
    text: 'Panel JSON',
    definedMessage: defineMessage({ message: 'Panel JSON' }),
    onClick: (e: React.MouseEvent<any>) => onInspectPanel('json'),
  });

  menu.push({
    type: 'submenu',
    definedMessage: defineMessage({ message: 'Inspect' }),
    text: 'Inspect',
    iconClassName: 'info-circle',
    onClick: (e: React.MouseEvent<any>) => onInspectPanel(),
    shortcut: 'i',
    subMenu: inspectMenu,
  });

  const subMenu: PanelMenuItem[] = [];

  if (dashboard.canEditPanel(panel) && !(panel.isViewing || panel.isEditing)) {
    subMenu.push({
      text: 'Duplicate',
      definedMessage: defineMessage({ message: 'Duplicate' }),
      id: 'panel-menu.duplicate',
      onClick: onDuplicatePanel,
      shortcut: 'p d',
    });

    subMenu.push({
      text: 'Copy',
      definedMessage: defineMessage({ message: 'Copy' }),
      id: 'panel-menu.copy',
      onClick: onCopyPanel,
    });

    if (isPanelModelLibraryPanel(panel)) {
      subMenu.push({
        text: 'Unlink library panel',
        definedMessage: defineMessage({ message: 'Unlink library panel' }),
        id: 'panel-menu.unlink',
        onClick: onUnlinkLibraryPanel,
      });
    } else {
      subMenu.push({
        text: 'Create library panel',
        definedMessage: defineMessage({ message: 'Create library panel' }),
        id: 'panel-menu.create-library',
        onClick: onAddLibraryPanel,
      });
    }
  }

  // add old angular panel options
  if (angularComponent) {
    const scope = angularComponent.getScope();
    const panelCtrl: PanelCtrl = scope.$$childHead.ctrl;
    const angularMenuItems = panelCtrl.getExtendedMenu();

    for (const item of angularMenuItems) {
      const reactItem: PanelMenuItem = {
        text: item.text,
        href: item.href,
        shortcut: item.shortcut,
      };

      if (item.click) {
        reactItem.onClick = () => {
          scope.$eval(item.click, { ctrl: panelCtrl });
        };
      }

      subMenu.push(reactItem);
    }
  }

  if (!panel.isEditing && subMenu.length) {
    menu.push({
      type: 'submenu',
      text: 'More...',
      definedMessage: defineMessage({ message: 'More...' }),
      id: 'panel-menu.more',
      iconClassName: 'cube',
      subMenu,
      onClick: onMore,
    });
  }

  if (dashboard.canEditPanel(panel) && !panel.isEditing && !panel.isViewing) {
    menu.push({ type: 'divider', text: '' });

    menu.push({
      text: 'Remove',
      definedMessage: defineMessage({ message: 'Remove' }),
      id: 'panel-menu.remove',
      iconClassName: 'trash-alt',
      onClick: onRemovePanel,
      shortcut: 'p r',
    });
  }

  return menu;
}
