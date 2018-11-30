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

import {Component, Input} from '@angular/core';
import {ObjectMeta, TypeMeta} from '@api/backendapi';
import {StateService} from '@uirouter/core';
import {Subscription} from 'rxjs/Subscription';

import {overviewState} from '../../../../../overview/state';
import {VerberService} from '../../../../services/global/verber';

@Component({
  selector: 'kd-actionbar-detail-edit',
  templateUrl: './template.html',
})
export class ActionbarDetailEditComponent {
  @Input() objectMeta: ObjectMeta;
  @Input() typeMeta: TypeMeta;
  @Input() displayName: string;
  verberSubscription_: Subscription;

  constructor(private readonly verber_: VerberService, private readonly state_: StateService) {}

  ngOnInit(): void {
    this.verberSubscription_ = this.verber_.onEdit.subscribe(() => {
      this.state_.reload().catch();
    });
  }

  ngOnDestroy(): void {
    this.verberSubscription_.unsubscribe();
  }

  onClick(): void {
    this.verber_.showEditDialog(this.displayName, this.typeMeta, this.objectMeta);
  }
}
