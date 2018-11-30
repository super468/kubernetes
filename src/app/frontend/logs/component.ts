// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpParams} from '@angular/common/http';
import {Component, OnDestroy} from '@angular/core';
import {MatDialog} from '@angular/material';
import {LogDetails, LogLine, LogSelection, LogSources} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {GlobalSettingsService} from 'common/services/global/globalsettings';
import {LogService} from 'common/services/global/logs';
import {NotificationSeverity, NotificationsService} from 'common/services/global/notifications';
import {Observable, Subscription} from 'rxjs';
import {LogsDownloadDialog} from '../common/dialogs/download/dialog';

const logsPerView = 100;
const maxLogSize = 2e9;
// Load logs from the beginning of the log file. This matters only if the log file is too large to
// be loaded completely.
const beginningOfLogFile = 'beginning';
// Load logs from the end of the log file. This matters only if the log file is too large to be
// loaded completely.
const endOfLogFile = 'end';
const oldestTimestamp = 'oldest';
const newestTimestamp = 'newest';

const i18n = {
  MSG_LOGS_ZEROSTATE_TEXT: 'The selected container has not logged any messages yet.',
  MSG_LOGS_TRUNCATED_WARNING:
      'The middle part of the log file cannot be loaded, because it is too big.'
};

@Component({selector: 'kd-logs', templateUrl: './template.html', styleUrls: ['./style.scss']})
export class LogsComponent implements OnDestroy {
  podLogs: LogDetails;
  logsSet: string[];
  logSources: LogSources;
  pod: string;
  container: string;
  logService: LogService;
  totalItems = 0;
  itemsPerPage = 10;
  currentSelection: LogSelection;
  refreshInterval = 5000;
  intervalSubscription: Subscription;
  sourceSubscription: Subscription;
  logsSubscription: Subscription;
  isLoading: boolean;

  constructor(
      logService: LogService, private readonly state_: StateService,
      private readonly settingsService_: GlobalSettingsService, private readonly dialog_: MatDialog,
      private readonly notifications_: NotificationsService) {
    this.logService = logService;
    this.refreshInterval = this.settingsService_.getAutoRefreshTimeInterval() * 1000;
    this.isLoading = true;

    const namespace = this.state_.params.resourceNamespace;
    const resourceType = this.state_.params.resourceType;
    let podName = this.state_.params.podName;

    this.sourceSubscription =
        logService.getResource(`source/${namespace}/${podName}/${resourceType}`)
            .subscribe((data: LogSources) => {
              this.logSources = data;
              console.log(namespace);
              console.log(podName);
              console.log(resourceType);
              console.log(this.logSources);
              if (resourceType !== 'Pod') {
                podName = data.podNames[0];
              }
              this.logsSubscription = logService.getResource(`${namespace}/${podName}`)
                                          .subscribe((data: LogDetails) => {
                                            console.log(data);
                                            this.updateUiModel(data);
                                            this.pod = data.info.podName;
                                            this.container = data.info.containerName;
                                            this.isLoading = false;
                                          });
            });
  }

  ngOnDestroy(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    if (this.sourceSubscription) {
      this.sourceSubscription.unsubscribe();
    }
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
  }

  /**
   * Updates all state parameters and sets the current log view with the data returned from the
   * backend If logs are not available sets logs to no logs available message.
   */
  updateUiModel(podLogs: LogDetails): void {
    this.podLogs = podLogs;
    this.currentSelection = podLogs.selection;
    this.logsSet = this.formatAllLogs(podLogs.logs);
    if (podLogs.info.truncated) {
      this.notifications_.push(i18n.MSG_LOGS_TRUNCATED_WARNING, NotificationSeverity.error);
    }
  }

  formatAllLogs(logs: LogLine[]): string[] {
    if (logs.length === 0) {
      logs = [{timestamp: '0', content: i18n.MSG_LOGS_ZEROSTATE_TEXT}];
    }
    return logs.map((line) => this.formatLine(line));
  }

  formatLine(line: LogLine): string {
    // add timestamp if needed
    const showTimestamp = this.logService.getShowTimestamp();
    return showTimestamp ? `${line.timestamp}  ${line.content}` : line.content;
  }

  /**
   * Loads maxLogSize oldest lines of logs.
   */
  loadOldest(): void {
    this.loadView(beginningOfLogFile, oldestTimestamp, 0, -maxLogSize - logsPerView, -maxLogSize);
  }

  /**
   * Loads maxLogSize newest lines of logs.
   */
  loadNewest(): void {
    this.loadView(endOfLogFile, newestTimestamp, 0, maxLogSize, maxLogSize + logsPerView);
  }

  /**
   * Shifts view by maxLogSize lines to the past.
   */
  loadOlder(): void {
    this.loadView(
        this.currentSelection.logFilePosition, this.currentSelection.referencePoint.timestamp,
        this.currentSelection.referencePoint.lineNum,
        this.currentSelection.offsetFrom - logsPerView, this.currentSelection.offsetFrom);
  }

  /**
   * Shifts view by maxLogSize lines to the future.
   */
  loadNewer(): void {
    this.loadView(
        this.currentSelection.logFilePosition, this.currentSelection.referencePoint.timestamp,
        this.currentSelection.referencePoint.lineNum, this.currentSelection.offsetTo,
        this.currentSelection.offsetTo + logsPerView);
  }

  /**
   * Downloads and loads slice of logs as specified by offsetFrom and offsetTo.
   * It works just like normal slicing, but indices are referenced relatively to certain reference
   * line.
   * So for example if reference line has index n and we want to download first 10 elements in array
   * we have to use
   * from -n to -n+10.
   */
  loadView(
      logFilePosition: string, referenceTimestamp: string, referenceLinenum: number,
      offsetFrom: number, offsetTo: number): void {
    const namespace = this.state_.params.resourceNamespace;
    const params = new HttpParams()
                       .set('logFilePosition', logFilePosition)
                       .set('referenceTimestamp', referenceTimestamp)
                       .set('referenceLineNum', `${referenceLinenum}`)
                       .set('offsetFrom', `${offsetFrom}`)
                       .set('offsetTo', `${offsetTo}`)
                       .set('previous', `${this.logService.getPrevious()}`);
    this.logsSubscription =
        this.logService.getResource(`${namespace}/${this.pod}/${this.container}`, params)
            .subscribe((podLogs: LogDetails) => {
              this.updateUiModel(podLogs);
            });
  }

  onTextColorChange(): void {
    this.logService.setInverted();
  }

  onFontSizeChange(): void {
    this.logService.setCompact();
  }

  onShowTimestamp(): void {
    this.logService.setShowTimestamp();
    this.logsSet = this.formatAllLogs(this.podLogs.logs);
  }

  /**
   * Execute when a user changes the selected option for show previous container logs.
   * @export
   */
  onPreviousChange(): void {
    this.logService.setPrevious();
    this.loadNewest();
  }

  /**
   * Toggles log follow mechanism.
   */
  toggleLogFollow(): void {
    this.logService.setFollowing();
    this.toggleIntervalFunction();
  }

  /**
   * Starts and stops interval function used to automatically refresh logs.
   */
  toggleIntervalFunction(): void {
    if (this.intervalSubscription && !this.intervalSubscription.closed) {
      this.intervalSubscription.unsubscribe();
    } else {
      const intervalObservable = Observable.interval(this.refreshInterval);
      this.intervalSubscription = intervalObservable.subscribe(() => this.loadNewest());
    }
  }

  downloadLog(): void {
    const dialogData = {data: {pod: this.pod, container: this.container}};
    this.dialog_.open(LogsDownloadDialog, dialogData);
  }
}
