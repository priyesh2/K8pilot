const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, 'metrics_db.json');
const MAX_HISTORY_POINTS = 60; // 60 minutes if scraped every minute

// In-memory cache: { "namespace/podname": [ {ts, cpu, mem}, ... ] }
let metricHistory = {};

// Load existing history
try {
    if (fs.existsSync(METRICS_FILE)) {
        metricHistory = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
        console.log(`[Metrics] Loaded history for ${Object.keys(metricHistory).length} pods.`);
    }
} catch (e) {
    console.warn('[Metrics] No valid metrics_db.json found, starting fresh.');
}

const saveMetrics = () => {
    try {
        fs.writeFileSync(METRICS_FILE, JSON.stringify(metricHistory));
    } catch (e) {
        console.error('[Metrics] Save failed:', e.message);
    }
};

const startCollector = (kc) => {
    const k8s = require('@kubernetes/client-node');
    const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

    console.log('[Metrics] Starting background collector (interval: 60s)...');
    
    setInterval(async () => {
        try {
            const r = await customApi.listClusterCustomObject('metrics.k8s.io', 'v1beta1', 'pods');
            const items = (r.body && r.body.items) || [];
            const timestamp = Date.now();

            items.forEach(m => {
                const key = `${m.metadata.namespace}/${m.metadata.name}`;
                if (!metricHistory[key]) metricHistory[key] = [];

                // Aggregate container metrics for the pod
                let totalCPU = 0;
                let totalMem = 0;

                (m.containers || []).forEach(c => {
                    // CPU comes in nanocores (e.g. 1000000n = 1m) or plain string
                    let cpuStr = c.usage.cpu || '0';
                    let cpu = 0;
                    if (cpuStr.endsWith('n')) cpu = parseInt(cpuStr) / 1000000;
                    else if (cpuStr.endsWith('u')) cpu = parseInt(cpuStr) / 1000;
                    else cpu = parseInt(cpuStr);

                    // Memory comes in Ki, Mi, Gi
                    let memStr = c.usage.memory || '0';
                    let mem = 0;
                    if (memStr.endsWith('Ki')) mem = parseInt(memStr) / 1024;
                    else if (memStr.endsWith('Mi')) mem = parseInt(memStr);
                    else if (memStr.endsWith('Gi')) mem = parseInt(memStr) * 1024;
                    else mem = parseInt(memStr) / 1024 / 1024; // assume bytes

                    totalCPU += cpu;
                    totalMem += mem;
                });

                metricHistory[key].push({
                    t: timestamp,
                    c: Math.round(totalCPU),
                    m: Math.round(totalMem)
                });

                // Prune old data
                if (metricHistory[key].length > MAX_HISTORY_POINTS) {
                    metricHistory[key].shift();
                }
            });

            // Cleanup pods that no longer exist (optional, for memory efficiency)
            // For now, simple save
            saveMetrics();
        } catch (err) {
            // Silently fail if metrics-server is missing, common in some dev setups
        }
    }, 60000); // Every 60 seconds
};

const getHistory = (namespace, podName) => {
    return metricHistory[`${namespace}/${podName}`] || [];
};

module.exports = { startCollector, getHistory };
