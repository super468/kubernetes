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

const baseHref = 'api/v1';

export enum Resource {
  job = 'job',
  cronJob = 'cronjob',
  daemonSet = 'daemonset',
  deployment = 'deployment',
  pod = 'pod',
  replicaSet = 'replicaset',
  oldReplicaSet = 'oldreplicaset',
  replicationController = 'replicationcontroller',
  statefulSet = 'statefulset',
  node = 'node',
  namespace = 'namespace',
  persistentVolume = 'persistentvolume',
  storageClass = 'storageclass',
  clusterRole = 'clusterrole',
  configMap = 'configmap',
  persistentVolumeClaim = 'persistentvolumeclaim',
  secret = 'secret',
  ingress = 'ingress',
  service = 'service',
  event = 'event',
  container = 'container',
  shell = 'shell',
}

class ResourceEndpoint {
  constructor(private readonly resource_: Resource, private readonly namespaced_ = false) {}

  list(): string {
    return `${baseHref}/${this.resource_}${this.namespaced_ ? '/:namespace' : ''}`;
  }

  detail(): string {
    return `${baseHref}/${this.resource_}${this.namespaced_ ? '/:namespace' : ''}/:name`;
  }

  child(resourceName: string, relatedResource: Resource): string {
    return `${baseHref}/${this.resource_}${this.namespaced_ ? '/:namespace' : ''}/${resourceName}/${
        relatedResource}`;
  }
}

export class EndpointManager {
  static resource(resource: Resource, namespaced?: boolean): ResourceEndpoint {
    return new ResourceEndpoint(resource, namespaced);
  }
}
