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
import {MatTableDataSource} from '@angular/material';
import {CapacityItem, PersistentVolumeDetail} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {Subscription} from 'rxjs/Subscription';

import {ActionbarService, ResourceMeta} from '../../../../common/services/global/actionbar';
import {NotificationsService} from '../../../../common/services/global/notifications';
import {EndpointManager, Resource} from '../../../../common/services/resource/endpoint';
import {ResourceService} from '../../../../common/services/resource/resource';

@Component({
  selector: 'kd-persistent-volume-detail',
  templateUrl: './template.html',
})
export class PersistentVolumeDetailComponent implements OnInit, OnDestroy {
  private persistentVolumeSubscription_: Subscription;
  private persistentVolumeName_: string;
  persistentVolume: PersistentVolumeDetail;
  isInitialized = false;

  constructor(
      private readonly persistentVolume_: ResourceService<PersistentVolumeDetail>,
      private readonly actionbar_: ActionbarService, private readonly state_: StateService,
      private readonly notifications_: NotificationsService) {}

  ngOnInit(): void {
    this.persistentVolumeName_ = this.state_.params.resourceName;
    this.persistentVolumeSubscription_ =
        this.persistentVolume_
            .get(
                EndpointManager.resource(Resource.persistentVolume).detail(),
                this.persistentVolumeName_)
            .subscribe((d: PersistentVolumeDetail) => {
              this.persistentVolume = d;
              this.notifications_.pushErrors(d.errors);
              this.actionbar_.onInit.emit(
                  new ResourceMeta('Persistent Volume', d.objectMeta, d.typeMeta));
              this.isInitialized = true;
            });
  }

  ngOnDestroy(): void {
    this.persistentVolumeSubscription_.unsubscribe();
  }

  getCapacityColumns(): string[] {
    return ['resourceName', 'quantity'];
  }

  getCapacityDataSource(): MatTableDataSource<CapacityItem> {
    const data: CapacityItem[] = [];

    if (this.isInitialized) {
      for (const rName of Array.from<string>(Object.keys(this.persistentVolume.capacity))) {
        data.push({resourceName: rName, quantity: this.persistentVolume.capacity[rName]});
      }
    }

    const tableData = new MatTableDataSource<CapacityItem>();
    tableData.data = data;

    return tableData;
  }
}
