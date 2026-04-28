export interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: string;
  reason?: string;
  ownerName?: string;
  containers?: string[];
  restarts: number;
  age: string;
}

export interface Deployment {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  status: 'Healthy' | 'Degraded';
  images: string[];
  age: string;
}

export interface ClusterHealth {
  namespaces: number;
  totalPods: number;
  running: number;
  failing: number;
  degraded: number;
  totalDeployments: number;
  totalRestarts: number;
}

const getToken = (): string | null => localStorage.getItem('k8s_token');

const headers = (): HeadersInit => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

const authFetch = async (url: string, opts?: RequestInit): Promise<Response> => {
  const resp = await fetch(url, { ...opts, headers: { ...headers(), ...(opts?.headers || {}) } });
  if (resp.status === 401 || resp.status === 403) {
    localStorage.removeItem('k8s_token');
    window.location.reload();
  }
  return resp;
};

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const K8sService = {
  async getPods(namespace: string = 'default'): Promise<Pod[]> {
    const resp = await authFetch(`/api/pods/${namespace}`);
    if (!resp.ok) throw new Error(`Pods failed: ${resp.status}`);
    const data = await resp.json();
    return data.map((p: any) => ({ ...p, age: formatAge(p.age) }));
  },

  async getDeployments(namespace: string = 'default'): Promise<Deployment[]> {
    try {
      const resp = await authFetch(`/api/deployments/${namespace}`);
      if (!resp.ok) throw new Error(`Deployments failed: ${resp.status}`);
      const data = await resp.json();
      return data.map((d: any) => ({ ...d, age: formatAge(d.age) }));
    } catch { return []; }
  },

  async getNamespaces(): Promise<string[]> {
    try {
      const resp = await authFetch('/api/namespaces');
      if (!resp.ok) throw new Error('NS failed');
      return await resp.json();
    } catch { return []; }
  },

  async createNamespace(name: string): Promise<boolean> {
    try {
      const resp = await authFetch('/api/namespaces', {
        method: 'POST', body: JSON.stringify({ name })
      });
      return resp.ok;
    } catch { return false; }
  },

  async deleteNamespace(name: string): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/namespaces/${name}`, {
        method: 'DELETE'
      });
      return resp.ok;
    } catch { return false; }
  },

  async getEvents(namespace: string = 'default'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/events/${namespace}`);
      if (!resp.ok) throw new Error('Events failed');
      return await resp.json();
    } catch { return []; }
  },

  async getLogs(podName: string, namespace: string, tail: number = 200, previous = false, container?: string): Promise<string> {
    try {
      let url = `/api/logs/${namespace}/${podName}?tail=${tail}&previous=${previous}`;
      if (container) url += `&container=${container}`;
      const resp = await authFetch(url);
      return await resp.text();
    } catch { return 'Failed to fetch logs.'; }
  },

  async getClusterHealth(): Promise<ClusterHealth | null> {
    try {
      const resp = await authFetch('/api/cluster-health');
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async scaleDeployment(namespace: string, deployment: string, replicas: number): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/scale/${namespace}/${deployment}`, {
        method: 'POST', body: JSON.stringify({ replicas })
      });
      return resp.ok;
    } catch { return false; }
  },

  async quickDeploy(data: { name: string; namespace: string; image: string; replicas: number; port?: number }): Promise<boolean> {
    try {
      const resp = await authFetch('/api/deploy', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return resp.ok;
    } catch { return false; }
  },

  async restartService(name: string, namespace: string = 'default'): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/restart/${namespace}/${name}`, { method: 'POST' });
      return resp.ok;
    } catch { return false; }
  },

  async getNodes(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/nodes');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async describePod(podName: string, namespace: string): Promise<any> {
    try {
      const resp = await authFetch(`/api/describe/${namespace}/${podName}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async getTopPods(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/top-pods');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async rollbackDeployment(name: string, namespace: string): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/rollback/${namespace}/${name}`, { method: 'POST' });
      return resp.ok;
    } catch { return false; }
  },

  async getServices(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/services/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getConfigMaps(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/configmaps/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async analyzePodFailure(podName: string, namespace: string): Promise<string> {
    try {
      const [logs, pods, events] = await Promise.all([
        this.getLogs(podName, namespace, 30),
        this.getPods(namespace).catch(() => []),
        this.getEvents(namespace).catch(() => [])
      ]);
      const pod = pods.find(p => p.name === podName);
      const podEvents = events.filter(e => e.object === podName);
      let report = `## Diagnostic: \`${podName}\`\n`;
      report += `**Status:** ${pod?.status || 'Unknown'}\n`;
      report += `**Restarts:** ${pod?.restarts || 0}\n`;
      if (pod?.reason) report += `**Reason:** ${pod.reason}\n`;
      if (podEvents.length > 0) {
        report += `\n**Recent Events:**\n`;
        podEvents.slice(-3).forEach(e => { report += `- [${e.type}] ${e.reason}: ${e.message}\n`; });
      }
      if (logs && logs.length > 10) {
        const lastLines = logs.split('\n').filter(l => l.trim()).slice(-5).join('\n');
        report += `\n**Last Log Lines:**\n\`\`\`\n${lastLines}\n\`\`\`\n`;
      }
      // AI suggestions
      if (pod?.status === 'OOMKilled') report += '\n💡 **Suggestion:** Increase memory limits in the deployment spec.';
      else if (pod?.status === 'CrashLoopBackOff') report += '\n💡 **Suggestion:** Check application startup — likely a config or dependency issue.';
      else if (pod?.status === 'ImagePullBackOff') report += '\n💡 **Suggestion:** Verify image name/tag and registry credentials.';
      else if ((pod?.restarts || 0) > 5) report += '\n💡 **Suggestion:** High restart count indicates a flaky liveness probe or intermittent crash.';
      return report;
    } catch { return `Failed to analyze ${podName}.`; }
  },

  async getPodMetrics(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/metrics/pods/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getNodeMetrics(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/metrics/nodes');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getSecurityAudit(): Promise<any> {
    try {
      const resp = await authFetch('/api/security-audit');
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async getResourceSummary(): Promise<any> {
    try {
      const resp = await authFetch('/api/resource-summary');
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  // --- NEW v3.0 APIs ---

  async getIngresses(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/ingresses/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getSecrets(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/secrets/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async deletePod(podName: string, namespace: string): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/pods/${namespace}/${podName}`, { method: 'DELETE' });
      return resp.ok;
    } catch { return false; }
  },

  async getHPAs(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/hpa/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getPVCs(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/pvcs/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getNamespaceBreakdown(): Promise<any> {
    try {
      const resp = await authFetch('/api/namespace-breakdown');
      if (!resp.ok) return {};
      return await resp.json();
    } catch { return {}; }
  },

  // --- GALAXY BRAIN APIs ---

  async getStatefulSets(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/statefulsets/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getDaemonSets(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/daemonsets/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getJobs(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/jobs/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getCronJobs(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/cronjobs/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getHistory(namespace: string, deployment: string): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/history/${namespace}/${deployment}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getRbac(namespace: string = 'all'): Promise<any> {
    try {
      const resp = await authFetch(`/api/rbac/${namespace}`);
      if (!resp.ok) return { roles: [], bindings: [] };
      return await resp.json();
    } catch { return { roles: [], bindings: [] }; }
  },

  async getNetworkPolicies(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/network-policies/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getCrds(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/crds');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getYaml(namespace: string, kind: string, name: string): Promise<any> {
    try {
      const resp = await authFetch(`/api/yaml/${namespace}/${kind}/${name}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async patchYaml(namespace: string, kind: string, name: string, yamlObj: any): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/yaml/${namespace}/${kind}/${name}`, {
        method: 'PATCH',
        body: JSON.stringify(yamlObj)
      });
      return resp.ok;
    } catch { return false; }
  },

  async getCostProfile(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/cost-profile');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getWebhooks(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/webhooks');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async addWebhook(name: string, url: string): Promise<boolean> {
    try {
      const resp = await authFetch('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({ name, url })
      });
      return resp.ok;
    } catch { return false; }
  },

  async removeWebhook(id: string): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      return resp.ok;
    } catch { return false; }
  },

  // --- v3.1 NEW APIs ---

  async getQuotas(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/quotas/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getLimitRanges(namespace: string = 'all'): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/limitranges/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getMetricHeatmap(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/metrics/heatmap');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async injectDebugContainer(podName: string, namespace: string, image: string = 'busybox'): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/debug/${namespace}/${podName}`, {
        method: 'POST',
        body: JSON.stringify({ image })
      });
      return resp.ok;
    } catch { return false; }
  },

  // --- v3.2 K8PILOT APIs ---

  async getMetricHistory(namespace: string, podName: string): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/metrics/history/${namespace}/${podName}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getOptimizerRecommendations(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/metrics/optimizer');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getTlsAudit(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/tls/audit');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async diagnosePod(namespace: string, podName: string): Promise<any> {
    try {
      const resp = await authFetch(`/api/pod/diagnose/${namespace}/${podName}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  // --- v3.5 ORION APIs ---
  async getUnifiedFeed(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/intelligence/unified-feed');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getRemediationProposal(namespace: string, podName: string): Promise<any> {
    try {
      const resp = await authFetch(`/api/intelligence/propose-fix/${namespace}/${podName}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async getIntelligenceHeatmap(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/intelligence/heatmap');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getNetworkFlows(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/network/listen');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getZombies(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/cleanup/zombies');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async deleteZombies(items: any[]): Promise<any[]> {
    try {
      const resp = await authFetch('/api/cleanup/zombies/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getCrdInstances(group: string, version: string, plural: string): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/crds/instances/${group}/${version}/${plural}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getTopology(namespace: string): Promise<any[]> {
    try {
      const resp = await authFetch(`/api/topology/${namespace}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getRbacAudit(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/rbac/audit');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getCostAudit(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/cost/audit');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async restartDeployment(namespace: string, name: string): Promise<boolean> {
    try {
      const resp = await authFetch(`/api/deployments/restart/${namespace}/${name}`, { method: 'POST' });
      return resp.ok;
    } catch { return false; }
  },

  async getUnusedResources(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/audit/unused');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  // --- v4.0 NOVA APIs ---

  async getRollouts(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/rollouts');
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.map((r: any) => ({ ...r, age: formatAge(r.age) }));
    } catch { return []; }
  },

  async getCapacityPlan(): Promise<any> {
    try {
      const resp = await authFetch('/api/capacity-plan');
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  },

  async getPodHealthMatrix(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/pod-health-matrix');
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.map((p: any) => ({ ...p, age: formatAge(p.age) }));
    } catch { return []; }
  },

  async getIncidents(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/incidents');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  // --- v4.1 NOVA Expansion APIs ---

  async getCronJobsMonitor(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/cronjobs');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getConfigDrift(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/config-drift');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getResourceRecommendations(): Promise<any[]> {
    try {
      const resp = await authFetch('/api/resource-recommendations');
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  },

  async getNetworkDiagnostics(): Promise<any> {
    try {
      const resp = await authFetch('/api/network-diagnostics');
      if (!resp.ok) return { dns: [], connectivity: [] };
      return await resp.json();
    } catch { return { dns: [], connectivity: [] }; }
  },

  async getClusterBenchmark(): Promise<any> {
    try {
      const resp = await authFetch('/api/cluster-benchmark');
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }
};
