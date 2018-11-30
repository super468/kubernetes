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
import {Component, Input} from '@angular/core';
import {CronJob, CronJobList} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {Observable} from 'rxjs/Observable';
import {cronJobState} from '../../../../resource/workloads/cronjob/state';
import {ResourceListWithStatuses} from '../../../resources/list';
import {NamespaceService} from '../../../services/global/namespace';
import {NotificationsService} from '../../../services/global/notifications';
import {EndpointManager, Resource} from '../../../services/resource/endpoint';
import {NamespacedResourceService} from '../../../services/resource/resource';
import {MenuComponent} from '../../list/column/menu/component';
import {ListGroupIdentifiers, ListIdentifiers} from '../groupids';

@Component({
  selector: 'kd-cron-job-list',
  templateUrl: './template.html',
})
export class CronJobListComponent extends ResourceListWithStatuses<CronJobList, CronJob> {
  @Input() endpoint = EndpointManager.resource(Resource.cronJob, true).list();
  constructor(
      state: StateService, private readonly cronJob_: NamespacedResourceService<CronJobList>,
      notifications: NotificationsService, private readonly namespaceService_: NamespaceService) {
    super(cronJobState.name, state, notifications);
    this.id = ListIdentifiers.cronJob;
    this.groupId = ListGroupIdentifiers.workloads;

    // Register status icon handlers
    this.registerBinding(this.icon.checkCircle, 'kd-success', this.isInSuccessState);
    this.registerBinding(this.icon.error, 'kd-error', this.isInErrorState);

    // Register action columns.
    this.registerActionColumn<MenuComponent>('menu', MenuComponent);

    // Register dynamic columns.
    this.registerDynamicColumn('namespace', 'name', this.shouldShowNamespaceColumn_.bind(this));
  }

  getResourceObservable(params?: HttpParams): Observable<CronJobList> {
    return this.cronJob_.get(this.endpoint, undefined, params);
  }

  map(cronJobList: CronJobList): CronJob[] {
    return cronJobList.items;
  }

  isInErrorState(resource: CronJob): boolean {
    return resource.suspend;
  }

  isInSuccessState(resource: CronJob): boolean {
    return !resource.suspend;
  }

  getDisplayColumns(): string[] {
    return ['statusicon', 'name', 'labels', 'schedule', 'suspend', 'active', 'lastschedule', 'age'];
  }

  private shouldShowNamespaceColumn_(): boolean {
    return this.namespaceService_.areMultipleNamespacesSelected();
  }
}
