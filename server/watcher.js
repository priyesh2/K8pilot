const k8s = require('@kubernetes/client-node');
const crypto = require('crypto');

let webhooks = []; // In-memory webhooks: { id: string, name: string, url: string }

const getWebhooks = () => webhooks;
const addWebhook = (name, url) => {
  const id = crypto.randomUUID();
  webhooks.push({ id, name, url });
  return { id, name, url };
};
const removeWebhook = (id) => {
  webhooks = webhooks.filter(w => w.id !== id);
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
        // Skip Normal events, we only want anomalies
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
  startEventWatcher
};
