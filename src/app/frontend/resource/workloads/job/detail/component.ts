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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {JobDetail} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {Subscription} from 'rxjs/Subscription';

import {ActionbarService, ResourceMeta} from '../../../../common/services/global/actionbar';
import {NotificationsService} from '../../../../common/services/global/notifications';
import {EndpointManager, Resource} from '../../../../common/services/resource/endpoint';
import {NamespacedResourceService} from '../../../../common/services/resource/resource';

@Component({
  selector: 'kd-job-detail',
  templateUrl: './template.html',
})
export class JobDetailComponent implements OnInit, OnDestroy {
  private jobSubscription_: Subscription;
  private jobName_: string;
  job: JobDetail;
  isInitialized = false;
  eventListEndpoint: string;
  podListEndpoint: string;

  constructor(
      private readonly job_: NamespacedResourceService<JobDetail>,
      private readonly actionbar_: ActionbarService, private readonly state_: StateService,
      private readonly notifications_: NotificationsService) {}

  ngOnInit(): void {
    this.jobName_ = this.state_.params.resourceName;
    this.eventListEndpoint =
        EndpointManager.resource(Resource.job, true).child(this.jobName_, Resource.event);
    this.podListEndpoint =
        EndpointManager.resource(Resource.job, true).child(this.jobName_, Resource.pod);

    this.jobSubscription_ =
        this.job_.get(EndpointManager.resource(Resource.job, true).detail(), this.jobName_)
            .startWith({})
            .subscribe((d: JobDetail) => {
              this.job = d;
              this.notifications_.pushErrors(d.errors);
              this.actionbar_.onInit.emit(new ResourceMeta('Job', d.objectMeta, d.typeMeta));
              this.isInitialized = true;
            });
  }

  ngOnDestroy(): void {
    this.jobSubscription_.unsubscribe();
  }
}
