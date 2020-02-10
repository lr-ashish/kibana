/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Url from 'url';

import React, { Component, createRef } from 'react';
import * as Rx from 'rxjs';

import 'tether';
import 'bootstrap';

import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiHideFor,
  EuiIcon,
  EuiShowFor,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { InjectedIntl, injectI18n } from '@kbn/i18n/react';
import LogRhythmNavbar from '../../../../../netmon/components/navbar';

import {
  ChromeBadge,
  ChromeBreadcrumb,
  ChromeNavControl,
  ChromeNavLink,
  ChromeRecentlyAccessedHistoryItem,
} from '../..';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ChromeHelpExtension } from '../../chrome_service';
import { OnIsLockedUpdate } from './';
import { CollapsibleNav } from './collapsible_nav';
import { HeaderBadge } from './header_badge';
import { HeaderBreadcrumbs } from './header_breadcrumbs';
import { HeaderHelpMenu } from './header_help_menu';
import { HeaderLogo } from './header_logo';
import { HeaderNavControls } from './header_nav_controls';
import { HeaderActionMenu } from './header_action_menu';

export interface HeaderProps {
  kibanaVersion: string;
  application: InternalApplicationStart;
  appTitle$: Observable<string>;
  badge$: Observable<ChromeBadge | undefined>;
  breadcrumbs$: Observable<ChromeBreadcrumb[]>;
  customNavLink$: Observable<ChromeNavLink | undefined>;
  homeHref: string;
  isVisible$: Observable<boolean>;
  kibanaDocLink: string;
  navLinks$: Observable<ChromeNavLink[]>;
  recentlyAccessed$: Observable<ChromeRecentlyAccessedHistoryItem[]>;
  forceAppSwitcherNavigation$: Observable<boolean>;
  helpExtension$: Observable<ChromeHelpExtension | undefined>;
  helpSupportUrl$: Observable<string>;
  navControlsLeft$: Observable<readonly ChromeNavControl[]>;
  navControlsCenter$: Observable<readonly ChromeNavControl[]>;
  navControlsRight$: Observable<readonly ChromeNavControl[]>;
  basePath: HttpStart['basePath'];
  isLocked$: Observable<boolean>;
  loadingCount$: ReturnType<HttpStart['getLoadingCount$']>;
  onIsLockedUpdate: OnIsLockedUpdate;
}

export function Header({
  kibanaVersion,
  kibanaDocLink,
  application,
  basePath,
  onIsLockedUpdate,
  homeHref,
  ...observables
}: HeaderProps) {
  const isVisible = useObservable(observables.isVisible$, false);
  const isLocked = useObservable(observables.isLocked$, false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (!isVisible) {
    return <LoadingIndicator loadingCount$={observables.loadingCount$} showAsBar />;
  }

  public render() {
    const { application, basePath, intl, isLocked, onIsLockedUpdate, legacyMode } = this.props;
    const { currentAppId, isVisible, navLinks, recentlyAccessed } = this.state;

    if (!isVisible) {
      return null;
    }

    const navLinksArray = navLinks
      .filter(navLink => !navLink.hidden)
      .map(navLink => ({
        key: navLink.id,
        label: navLink.title,

        // Use href and onClick to support "open in new tab" and SPA navigation in the same link
        href: navLink.href,
        onClick: (event: MouseEvent) => {
          if (
            !legacyMode && // ignore when in legacy mode
            !navLink.legacy && // ignore links to legacy apps
            !event.defaultPrevented && // onClick prevented default
            event.button === 0 && // ignore everything but left clicks
            !isModifiedEvent(event) // ignore clicks with modifier keys
          ) {
            event.preventDefault();
            application.navigateToApp(navLink.id);
          }
        },

        // Legacy apps use `active` property, NP apps should match the current app
        isActive: navLink.active || currentAppId === navLink.id,
        isDisabled: navLink.disabled,

        iconType: navLink.euiIconType,
        icon:
          !navLink.euiIconType && navLink.icon ? (
            <EuiImage
              size="s"
              alt=""
              aria-hidden={true}
              url={basePath.prepend(`/${navLink.icon}`)}
            />
          ) : (
            undefined
          ),
        'data-test-subj': 'navDrawerAppsMenuLink',
      }));

    const recentLinksArray = [
      {
        label: intl.formatMessage({
          id: 'core.ui.chrome.sideGlobalNav.viewRecentItemsLabel',
          defaultMessage: 'Recently viewed',
        }),
        iconType: 'clock',
        isDisabled: recentlyAccessed.length > 0 ? false : true,
        flyoutMenu: {
          title: intl.formatMessage({
            id: 'core.ui.chrome.sideGlobalNav.viewRecentItemsFlyoutTitle',
            defaultMessage: 'Recent items',
          }),
          listItems: recentlyAccessed.map(item => ({
            label: truncateRecentItemLabel(item.label),
            title: item.title,
            'aria-label': item.title,
            href: item.href,
            iconType: item.euiIconType,
          })),
        },
      },
    ];

    return (
      <header>
        <LogRhythmNavbar />

        {/* <EuiHeader>
          <EuiHeaderSection grow={false}>
            <EuiShowFor sizes={['xs', 's']}>
              <EuiHeaderSectionItem border="right">{this.renderMenuTrigger()}</EuiHeaderSectionItem>
            </EuiShowFor>

            <EuiHeaderSectionItem border="right">{this.renderLogo()}</EuiHeaderSectionItem>

            <HeaderNavControls side="left" navControls={navControlsLeft} />
          </EuiHeaderSection>

          <HeaderBreadcrumbs appTitle={appTitle} breadcrumbs$={breadcrumbs$} />

            <HeaderBadge badge$={observables.badge$} />

            <EuiHeaderSection side="right">
              <EuiHeaderSectionItem border="none">
                <HeaderActionMenu actionMenu$={application.currentActionMenu$} />
              </EuiHeaderSectionItem>
            </EuiHeaderSection>
          </EuiHeader>
        </div>

            <HeaderNavControls side="right" navControls={navControlsRight} />
          </EuiHeaderSection>
        </EuiHeader> */}

        <EuiNavDrawer
          ref={this.navDrawerRef}
          data-test-subj="navDrawer"
          isLocked={isLocked}
          navLinks$={observables.navLinks$}
          recentlyAccessed$={observables.recentlyAccessed$}
          isNavOpen={isNavOpen}
          homeHref={homeHref}
          basePath={basePath}
          navigateToApp={application.navigateToApp}
          navigateToUrl={application.navigateToUrl}
          onIsLockedUpdate={onIsLockedUpdate}
          closeNav={() => {
            setIsNavOpen(false);
            if (toggleCollapsibleNavRef.current) {
              toggleCollapsibleNavRef.current.focus();
            }
          }}
          customNavLink$={observables.customNavLink$}
        />
      </header>
    </>
  );
}
