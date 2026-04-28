export interface AuraApp {
  name: string;
  namespace: string;
  status: 'Healthy' | 'Degraded';
  syncStatus: 'Synced' | 'Out of Sync';
  replicas: number;
  readyReplicas: number;
  image: string;
  age: string;
  firstPod?: string;
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: string;
  node: string;
  restarts: number;
  age: string;
}

export interface K8sEvent {
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  object: string;
  age: string;
}
