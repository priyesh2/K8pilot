const k8s = require('@kubernetes/client-node');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WEBHOOKS_FILE = path.join(__dirname, 'webhooks.json');

let webhooks = []; 
let eventBuffer = []; // In-memory rolling event buffer for the Intelligence Feed
const MAX_BUFFER_SIZE = 1000;

// Initialize: Load from file if exists
try {
  if (fs.existsSync(WEBHOOKS_FILE)) {
    const data = fs.readFileSync(WEBHOOKS_FILE, 'utf8');
    webhooks = JSON.parse(data);
    console.log(`[Watcher] Loaded ${webhooks.length} webhooks from storage.`);
  }
} catch (e) {
  console.error('[Watcher] Failed to load webhooks.json:', e.message);
  webhooks = [];
}

const saveWebhooks = () => {
  try {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
  } catch (e) {
    console.error('[Watcher] Failed to save webhooks.json:', e.message);
  }
};

const getWebhooks = () => webhooks;
const addWebhook = (name, url) => {
  const id = crypto.randomUUID();
  const hook = { id, name, url };
  webhooks.push(hook);
  saveWebhooks();
  return hook;
};
const removeWebhook = (id) => {
  webhooks = webhooks.filter(w => w.id !== id);
  saveWebhooks();
};

// Dispatch a formatted payload to all configured webhooks
const dispatchToWebhooks = async (eventObj) => {
  if (webhooks.length === 0) return;

  const { type, reason, message, involvedObject, count, firstTimestamp, lastTimestamp } = eventObj;
  
  // Format specifically designed to look decent perfectly across Slack/Google Chat
  const payload = {
    text: `🚨 *K8pilot Alert* | [${type}] ${reason}\n\n*Target:* ${involvedObject.kind}/${involvedObject.name} (${involvedObject.namespace})\n*Message:* ${message}\n*Occurrences:* ${count}`
  };

  for (const hook of webhooks) {
    try {
      await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error(`[Watcher] Failed to dispatch to webhook ${hook.name}: ${e.message}`);
    }
  }
};

let watchRequest = null;

const startEventWatcher = (kc) => {
  const watch = new k8s.Watch(kc);
  console.log('[Watcher] Starting cluster-wide event stream watch...');

  const performWatch = () => {
    watchRequest = watch.watch('/api/v1/events',
      // Query params
      {},
      // Callback on event
      async (type, apiObj, watchObj) => {
        // Capture ALL events for the Intelligence Feed buffer
        const eventEntry = {
          id: apiObj.metadata.uid,
          timestamp: apiObj.lastTimestamp || apiObj.firstTimestamp || new Date().toISOString(),
          type: apiObj.type,
          reason: apiObj.reason,
          message: apiObj.message,
          namespace: apiObj.involvedObject.namespace,
          objectName: apiObj.involvedObject.name,
          objectKind: apiObj.involvedObject.kind,
          count: apiObj.count || 1
        };

        // Add to buffer and rotate
        eventBuffer.unshift(eventEntry);
        if (eventBuffer.length > MAX_BUFFER_SIZE) {
          eventBuffer = eventBuffer.slice(0, MAX_BUFFER_SIZE);
        }

        // Skip Normal events for webhooks, we only want anomalies there
        if (apiObj.type === 'Normal') return;
        
        // We only want ADDED or MODIFIED events for warnings
        if (type === 'ADDED' || type === 'MODIFIED') {
          console.log(`[Watcher] Intercepted anomaly: [${apiObj.reason}] on ${apiObj.involvedObject.name}`);
          await dispatchToWebhooks(apiObj);
        }
      },
      // Error/Disconnect callback
      (err) => {
        console.error('[Watcher] Watch disconnected', err ? err.message : '');
        // Auto-reconnect after 5 seconds to maintain resilient connection
        setTimeout(performWatch, 5000);
      }
    );
  };

  performWatch();
};

module.exports = {
  getWebhooks,
  addWebhook,
  removeWebhook,
  getEventBuffer: () => eventBuffer,
  startEventWatcher
};
