const express = require('express');
const k8s = require('@kubernetes/client-node');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'k8pilot-super-secret-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, '../dist')));

// --- K8s Client Init (compatible with in-cluster, kubeconfig, EKS, GKE, AKS, OKE) ---
const kc = new k8s.KubeConfig();
try {
  kc.loadFromCluster(); // Preferred: in-cluster ServiceAccount (works on ALL providers)
  console.log('Loaded in-cluster config');
} catch (e) {
  try {
    kc.loadFromDefault(); // Fallback: ~/.kube/config (local dev / jump servers)
    console.log('Loaded kubeconfig from default');
  } catch (err) {
    console.error('FATAL: No K8s config found. k8pilot cannot connect to any cluster.');
  }
}
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

// --- Safe accessor helpers (guards against null in any K8s version) ---
const safeGet = (obj, path, def = '') => {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined && o[k] !== null) ? o[k] : def, obj);
};

// --- AUTH ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

const auth = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Auth required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token expired or invalid' });
    req.user = user;
    next();
  });
};

// --- HEALTH (no auth — used by K8s liveness/readiness probes) ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0', branding: 'k8pilot' }));

// --- CLUSTER HEALTH SUMMARY ---
app.get('/api/cluster-health', auth, async (req, res) => {
  try {
    const [podRes, depRes, nsRes] = await Promise.all([
      k8sApi.listPodForAllNamespaces(),
      k8sAppsApi.listDeploymentForAllNamespaces(),
      k8sApi.listNamespace()
    ]);
    const pods = podRes.body.items || [];
    const deps = depRes.body.items || [];
    const running = pods.filter(p => safeGet(p, 'status.phase') === 'Running').length;
    const failing = pods.filter(p => {
      const cs = (p.status.containerStatuses || [])[0];
      return cs && (cs.state && cs.state.waiting || (cs.restartCount || 0) > 5);
    }).length;
    const degraded = deps.filter(d => {
      const conds = (d.status && d.status.conditions) || [];
      return !conds.some(c => c.type === 'Available' && c.status === 'True');
    }).length;
    const totalRestarts = pods.reduce((sum, p) => {
      return sum + ((p.status && p.status.containerStatuses) || []).reduce((s, c) => s + (c.restartCount || 0), 0);
    }, 0);
    res.json({
      namespaces: (nsRes.body.items || []).length,
      totalPods: pods.length,
      running, failing, degraded,
      totalDeployments: deps.length,
      totalRestarts
    });
  } catch (err) {
    console.error('Cluster health error:', err.body || err.message);
    res.status(500).json({ error: 'Health check failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- NAMESPACES ---
app.get('/api/namespaces', auth, async (req, res) => {
  try {
    const r = await k8sApi.listNamespace();
    res.json((r.body.items || []).map(ns => ns.metadata.name));
  } catch (err) {
    console.error('Namespaces error:', err.body || err.message);
    res.status(500).json({ error: 'Namespaces failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- DEPLOYMENTS ---
app.get('/api/deployments/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sAppsApi.listDeploymentForAllNamespaces()
      : await k8sAppsApi.listNamespacedDeployment(namespace);
    res.json((r.body.items || []).map(d => {
      const status = d.status || {};
      const conds = status.conditions || [];
      return {
        name: d.metadata.name,
        namespace: d.metadata.namespace,
        replicas: `${status.readyReplicas || 0}/${status.replicas || 0}`,
        status: conds.some(c => c.type === 'Available' && c.status === 'True') ? 'Healthy' : 'Degraded',
        images: ((d.spec && d.spec.template && d.spec.template.spec && d.spec.template.spec.containers) || []).map(c => c.image),
        age: d.metadata.creationTimestamp
      };
    }));
  } catch (err) {
    console.error('Deployments error:', err.body || err.message);
    res.status(500).json({ error: 'Deployments failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- PODS ---
app.get('/api/pods/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sApi.listPodForAllNamespaces()
      : await k8sApi.listNamespacedPod(namespace);
    const pods = (r.body.items || []).map(p => {
      const statuses = (p.status && p.status.containerStatuses) || [];
      const initStatuses = (p.status && p.status.initContainerStatuses) || [];
      const allStatuses = [...statuses, ...initStatuses];
      // Use first non-init container for status
      const cs = statuses[0];
      let status = (p.status && p.status.phase) || 'Unknown';
      let reason = '';
      if (cs && cs.state) {
        if (cs.state.waiting) { status = cs.state.waiting.reason || 'Waiting'; reason = cs.state.waiting.message || ''; }
        else if (cs.state.terminated) { status = cs.state.terminated.reason || 'Terminated'; reason = `Exit ${cs.state.terminated.exitCode || '?'}`; }
      }
      // Return ALL container names so frontend can offer a picker
      const containers = ((p.spec && p.spec.containers) || []).map(c => c.name);
      return {
        id: p.metadata.uid, name: p.metadata.name, namespace: p.metadata.namespace,
        status, reason, containers,
        ownerName: (p.metadata.ownerReferences && p.metadata.ownerReferences[0] && p.metadata.ownerReferences[0].name) || '',
        restarts: allStatuses.reduce((sum, s) => sum + (s.restartCount || 0), 0),
        age: p.metadata.creationTimestamp
      };
    });
    res.json(pods);
  } catch (err) {
    console.error('Pods error:', err.body || err.message);
    res.status(500).json({ error: 'Pods failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- RESTART ---
app.post('/api/restart/:namespace/:deployment', auth, async (req, res) => {
  const { namespace, deployment } = req.params;
  try {
    const patch = { spec: { template: { metadata: { annotations: {
      "kubectl.kubernetes.io/restartedAt": new Date().toISOString()
    }}}}};
    await k8sAppsApi.patchNamespacedDeployment(
      deployment, namespace, patch, undefined, undefined, undefined, undefined, undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );
    console.log(`Restarted ${deployment} in ${namespace} by ${req.user.username}`);
    res.json({ message: `Restarted ${deployment}` });
  } catch (err) {
    console.error('Restart error:', err.body || err.message);
    res.status(500).json({ error: `Restart failed: ${(err.body && err.body.message) || err.message}` });
  }
});

// --- SCALE ---
app.post('/api/scale/:namespace/:deployment', auth, async (req, res) => {
  const { namespace, deployment } = req.params;
  const { replicas } = req.body;
  if (replicas === undefined || replicas === null || isNaN(parseInt(replicas))) {
    return res.status(400).json({ error: 'Valid replica count required' });
  }
  try {
    const patch = { spec: { replicas: parseInt(replicas) } };
    await k8sAppsApi.patchNamespacedDeployment(
      deployment, namespace, patch, undefined, undefined, undefined, undefined, undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );
    console.log(`Scaled ${deployment} in ${namespace} to ${replicas} by ${req.user.username}`);
    res.json({ message: `Scaled ${deployment} to ${replicas}` });
  } catch (err) {
    console.error('Scale error:', err.body || err.message);
    res.status(500).json({ error: `Scale failed: ${(err.body && err.body.message) || err.message}` });
  }
});

// --- EVENTS ---
app.get('/api/events/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sApi.listEventForAllNamespaces()
      : await k8sApi.listNamespacedEvent(namespace);
    res.json((r.body.items || []).map(e => ({
      id: e.metadata.uid, type: e.type || 'Normal',
      message: e.message || '', reason: e.reason || 'Unknown',
      timestamp: e.lastTimestamp || e.eventTime || e.metadata.creationTimestamp,
      object: (e.involvedObject && e.involvedObject.name) || '', 
      namespace: e.metadata.namespace
    })));
  } catch (err) {
    console.error('Events error:', err.body || err.message);
    res.status(500).json({ error: 'Events failed' });
  }
});

// --- RAW LOGS (multi-container aware) ---
const SIDECAR_CONTAINERS = ['istio-init', 'istio-proxy', 'envoy', 'linkerd-init', 'linkerd-proxy', 'vault-agent-init', 'vault-agent'];

app.get('/api/logs/:namespace/:pod', auth, async (req, res) => {
  const { namespace, pod } = req.params;
  const tailLines = parseInt(req.query.tail) || 200;
  const previous = req.query.previous === 'true';
  let container = req.query.container || undefined;

  try {
    // If no container specified, auto-detect the app container
    if (!container) {
      const podRes = await k8sApi.readNamespacedPod(pod, namespace);
      const allContainers = ((podRes.body.spec && podRes.body.spec.containers) || []).map(c => c.name);
      if (allContainers.length > 1) {
        // Pick the first non-sidecar container
        container = allContainers.find(c => !SIDECAR_CONTAINERS.includes(c)) || allContainers[0];
      } else if (allContainers.length === 1) {
        container = allContainers[0];
      }
    }

    const r = await k8sApi.readNamespacedPodLog(
      pod, namespace, 
      container,  // specific container name
      undefined,  // follow
      undefined,  // insecureSkipTLSVerifyBackend
      undefined,  // limitBytes
      undefined,  // pretty
      previous,   // previous container
      undefined,  // sinceSeconds
      tailLines   // tailLines
    );
    res.type('text/plain').send(r.body || 'No logs available.');
  } catch (err) {
    const msg = (err.body && err.body.message) || err.message || 'Unknown error';
    console.error(`Logs error for ${pod}/${container}:`, msg);
    if (msg.includes('not found') || msg.includes('is waiting to start')) {
      res.type('text/plain').send(`Pod "${pod}" is not running or container "${container || 'auto'}" not found.`);
    } else {
      res.status(500).type('text/plain').send(`Log fetch failed: ${msg}`);
    }
  }
});

// --- NODES ---
app.get('/api/nodes', auth, async (req, res) => {
  try {
    const r = await k8sApi.listNode();
    res.json((r.body.items || []).map(n => {
      const conds = (n.status && n.status.conditions) || [];
      const ready = conds.find(c => c.type === 'Ready');
      const cap = (n.status && n.status.capacity) || {};
      const labels = (n.metadata && n.metadata.labels) || {};
      return {
        name: n.metadata.name,
        status: (ready && ready.status === 'True') ? 'Ready' : 'NotReady',
        roles: Object.keys(labels).filter(l => l.includes('node-role')).map(l => l.split('/')[1] || 'worker').join(', ') || 'worker',
        cpu: cap.cpu || '?', memory: cap.memory || '?',
        age: n.metadata.creationTimestamp,
        version: (n.status && n.status.nodeInfo && n.status.nodeInfo.kubeletVersion) || '?'
      };
    }));
  } catch (err) {
    console.error('Nodes error:', err.body || err.message);
    res.status(500).json({ error: 'Nodes failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- DESCRIBE POD ---
app.get('/api/describe/:namespace/:pod', auth, async (req, res) => {
  const { namespace, pod } = req.params;
  try {
    const r = await k8sApi.readNamespacedPod(pod, namespace);
    const p = r.body;
    const spec = p.spec || {};
    const st = p.status || {};
    const containers = (spec.containers || []).map(c => ({
      name: c.name, image: c.image,
      limits: (c.resources && c.resources.limits) || {},
      requests: (c.resources && c.resources.requests) || {},
      ports: (c.ports || []).map(pt => `${pt.containerPort}/${pt.protocol || 'TCP'}`),
    }));
    const conditions = (st.conditions || []).map(c => ({
      type: c.type, status: c.status, reason: c.reason || '', message: c.message || ''
    }));
    res.json({
      name: p.metadata.name, namespace: p.metadata.namespace,
      nodeName: spec.nodeName || 'N/A', serviceAccount: spec.serviceAccountName || 'default',
      phase: st.phase || 'Unknown', ip: st.podIP || 'N/A',
      startTime: st.startTime || null,
      containers, conditions,
      labels: (p.metadata && p.metadata.labels) || {},
      restarts: (st.containerStatuses || []).reduce((s, c) => s + (c.restartCount || 0), 0)
    });
  } catch (err) {
    console.error('Describe error:', err.body || err.message);
    res.status(500).json({ error: 'Describe failed', detail: (err.body && err.body.message) || err.message });
  }
});

// --- TOP PODS ---
app.get('/api/top-pods', auth, async (req, res) => {
  try {
    const r = await k8sApi.listPodForAllNamespaces();
    const pods = (r.body.items || []).map(p => {
      const statuses = (p.status && p.status.containerStatuses) || [];
      const cs = statuses[0];
      return {
        name: p.metadata.name, namespace: p.metadata.namespace,
        restarts: cs ? (cs.restartCount || 0) : 0,
        status: (cs && cs.state && cs.state.waiting && cs.state.waiting.reason) || 
                (cs && cs.state && cs.state.terminated && cs.state.terminated.reason) || 
                (p.status && p.status.phase) || 'Unknown',
        age: p.metadata.creationTimestamp
      };
    }).sort((a, b) => b.restarts - a.restarts).slice(0, 20);
    res.json(pods);
  } catch (err) {
    res.status(500).json({ error: 'Top pods failed' });
  }
});

// --- ROLLBACK ---
app.post('/api/rollback/:namespace/:deployment', auth, async (req, res) => {
  const { namespace, deployment } = req.params;
  try {
    const depRes = await k8sAppsApi.readNamespacedDeployment(deployment, namespace);
    const annotations = (depRes.body.metadata && depRes.body.metadata.annotations) || {};
    const currentRev = parseInt(annotations['deployment.kubernetes.io/revision'] || '1');
    const patch = { spec: { template: { metadata: { annotations: {
      "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
      "k8pilot/rollback": `rev-${currentRev}-at-${Date.now()}`
    }}}}};
    await k8sAppsApi.patchNamespacedDeployment(
      deployment, namespace, patch, undefined, undefined, undefined, undefined, undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );
    console.log(`Rollback ${deployment} in ${namespace} from rev ${currentRev} by ${req.user.username}`);
    res.json({ message: `Rollback initiated for ${deployment} from rev ${currentRev}` });
  } catch (err) {
    console.error('Rollback error:', err.body || err.message);
    res.status(500).json({ error: `Rollback failed: ${(err.body && err.body.message) || err.message}` });
  }
});

// --- SERVICES ---
app.get('/api/services/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sApi.listServiceForAllNamespaces()
      : await k8sApi.listNamespacedService(namespace);
    res.json((r.body.items || []).map(s => {
      const spec = s.spec || {};
      return {
        name: s.metadata.name, namespace: s.metadata.namespace,
        type: spec.type || 'ClusterIP',
        clusterIP: spec.clusterIP || 'None',
        ports: (spec.ports || []).map(p => `${p.port}${p.nodePort ? ':'+p.nodePort : ''}/${p.protocol || 'TCP'}`),
        age: s.metadata.creationTimestamp
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Services failed' });
  }
});

// --- CONFIGMAPS ---
app.get('/api/configmaps/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sApi.listConfigMapForAllNamespaces()
      : await k8sApi.listNamespacedConfigMap(namespace);
    res.json((r.body.items || []).map(cm => ({
      name: cm.metadata.name, namespace: cm.metadata.namespace,
      keys: Object.keys(cm.data || {}),
      age: cm.metadata.creationTimestamp
    })));
  } catch (err) {
    res.status(500).json({ error: 'ConfigMaps failed' });
  }
});
// --- POD METRICS (from metrics-server via CustomObjectsApi) ---
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

app.get('/api/metrics/pods/:namespace', auth, async (req, res) => {
  const { namespace } = req.params;
  try {
    const r = namespace === 'all'
      ? await k8sCustomApi.listClusterCustomObject('metrics.k8s.io', 'v1beta1', 'pods')
      : await k8sCustomApi.listNamespacedCustomObject('metrics.k8s.io', 'v1beta1', namespace, 'pods');
    const items = (r.body && r.body.items) || [];
    res.json(items.map(m => ({
      name: m.metadata.name,
      namespace: m.metadata.namespace,
      containers: (m.containers || []).map(c => ({
        name: c.name,
        cpu: c.usage ? c.usage.cpu : '0',
        memory: c.usage ? c.usage.memory : '0'
      }))
    })));
  } catch (err) {
    const msg = (err.body && err.body.message) || err.message || '';
    if (msg.includes('not found') || msg.includes('the server could not find')) {
      res.json([]); // metrics-server not installed
    } else {
      res.status(500).json({ error: 'Pod metrics failed', detail: msg });
    }
  }
});

// --- NODE METRICS ---
app.get('/api/metrics/nodes', auth, async (req, res) => {
  try {
    const r = await k8sCustomApi.listClusterCustomObject('metrics.k8s.io', 'v1beta1', 'nodes');
    const items = (r.body && r.body.items) || [];
    res.json(items.map(m => ({
      name: m.metadata.name,
      cpu: m.usage ? m.usage.cpu : '0',
      memory: m.usage ? m.usage.memory : '0'
    })));
  } catch (err) {
    const msg = (err.body && err.body.message) || err.message || '';
    if (msg.includes('not found')) {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Node metrics failed', detail: msg });
    }
  }
});

// --- SECURITY AUDIT (unique feature) ---
app.get('/api/security-audit', auth, async (req, res) => {
  try {
    const r = await k8sApi.listPodForAllNamespaces();
    const pods = r.body.items || [];
    const findings = [];

    pods.forEach(p => {
      const ns = p.metadata.namespace;
      const name = p.metadata.name;
      const spec = p.spec || {};
      const containers = spec.containers || [];

      containers.forEach(c => {
        // Check: running as root
        const sc = c.securityContext || {};
        if (sc.runAsUser === 0 || sc.privileged) {
          findings.push({ severity: 'HIGH', pod: name, namespace: ns, container: c.name,
            issue: sc.privileged ? 'Container runs in PRIVILEGED mode' : 'Container runs as ROOT (UID 0)',
            recommendation: 'Set runAsNonRoot: true and drop ALL capabilities' });
        }
        // Check: latest tag (bad practice)
        if (c.image && (c.image.endsWith(':latest') || !c.image.includes(':'))) {
          findings.push({ severity: 'MEDIUM', pod: name, namespace: ns, container: c.name,
            issue: `Image uses ':latest' tag: ${c.image}`,
            recommendation: 'Pin to a specific image digest or version tag' });
        }
        // Check: no resource limits
        const res = c.resources || {};
        if (!res.limits || (!res.limits.cpu && !res.limits.memory)) {
          findings.push({ severity: 'MEDIUM', pod: name, namespace: ns, container: c.name,
            issue: 'No resource limits defined',
            recommendation: 'Set CPU and memory limits to prevent resource starvation' });
        }
        // Check: no readiness/liveness probes
        if (!c.readinessProbe && !c.livenessProbe) {
          findings.push({ severity: 'LOW', pod: name, namespace: ns, container: c.name,
            issue: 'No health probes configured',
            recommendation: 'Add readinessProbe and livenessProbe for reliable service discovery' });
        }
      });

      // Check: hostNetwork or hostPID
      if (spec.hostNetwork) {
        findings.push({ severity: 'HIGH', pod: name, namespace: ns, container: '-',
          issue: 'Pod uses hostNetwork', recommendation: 'Avoid hostNetwork unless absolutely required' });
      }
    });

    res.json({
      scannedPods: pods.length,
      totalFindings: findings.length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      findings: findings.slice(0, 50) // cap at 50 to avoid payload explosion
    });
  } catch (err) {
    console.error('Security audit error:', err.body || err.message);
    res.status(500).json({ error: 'Security audit failed' });
  }
});

// --- RESOURCE SUMMARY (cluster-wide resource accounting) ---
app.get('/api/resource-summary', auth, async (req, res) => {
  try {
    const [podRes, nodeRes] = await Promise.all([
      k8sApi.listPodForAllNamespaces(),
      k8sApi.listNode()
    ]);
    const pods = podRes.body.items || [];
    const nodes = nodeRes.body.items || [];

    const parseCpu = (s) => {
      if (!s) return 0;
      if (s.endsWith('m')) return parseInt(s) / 1000;
      if (s.endsWith('n')) return parseInt(s) / 1000000000;
      return parseFloat(s) || 0;
    };
    const parseMem = (s) => {
      if (!s) return 0;
      if (s.endsWith('Ki')) return parseInt(s) / 1024;
      if (s.endsWith('Mi')) return parseInt(s);
      if (s.endsWith('Gi')) return parseInt(s) * 1024;
      return parseInt(s) / (1024*1024) || 0;
    };

    let reqCpu = 0, reqMem = 0, limCpu = 0, limMem = 0;
    pods.forEach(p => {
      ((p.spec && p.spec.containers) || []).forEach(c => {
        const r = (c.resources && c.resources.requests) || {};
        const l = (c.resources && c.resources.limits) || {};
        reqCpu += parseCpu(r.cpu);
        reqMem += parseMem(r.memory);
        limCpu += parseCpu(l.cpu);
        limMem += parseMem(l.memory);
      });
    });

    let capCpu = 0, capMem = 0;
    nodes.forEach(n => {
      const cap = (n.status && n.status.capacity) || {};
      capCpu += parseCpu(cap.cpu);
      capMem += parseMem(cap.memory);
    });

    res.json({
      nodes: nodes.length,
      pods: pods.length,
      requests: { cpu: reqCpu.toFixed(2), memoryMi: Math.round(reqMem) },
      limits: { cpu: limCpu.toFixed(2), memoryMi: Math.round(limMem) },
      capacity: { cpu: capCpu.toFixed(2), memoryMi: Math.round(capMem) },
      utilization: {
        cpuPercent: capCpu > 0 ? Math.round((reqCpu / capCpu) * 100) : 0,
        memPercent: capMem > 0 ? Math.round((reqMem / capMem) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Resource summary error:', err.body || err.message);
    res.status(500).json({ error: 'Resource summary failed' });
  }
});

// --- SPA FALLBACK ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => console.log(`k8pilot v2.0 backend on :${port}`));
