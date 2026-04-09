import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import { K8sService } from '../services/k8s';

interface Message { id: string; type: 'user' | 'ai'; content: string; }
interface AssistantProps { activeNamespace: string; }

// Intent classification engine — scores each intent by keyword matches
const classifyIntent = (query: string): string => {
  const intents: Record<string, string[]> = {
    health: ['health', 'status', 'how', 'cluster', 'overview', 'summary', 'report'],
    crash: ['crash', 'fail', 'error', 'down', 'broken', 'issue', 'problem', 'wrong', 'oom', 'killed'],
    restart: ['restart', 'reboot', 'bounce'],
    rollback: ['rollback', 'undo', 'revert', 'previous'],
    logs: ['log', 'logs', 'output', 'stdout', 'stderr', 'trace'],
    scale: ['scale', 'replica', 'replicas', 'increase', 'decrease'],
    describe: ['describe', 'detail', 'details', 'inspect', 'info'],
    top_pods: ['top', 'heavy', 'most', 'restarts', 'problematic', 'unstable'],
    nodes: ['node', 'nodes', 'machine', 'machines', 'worker', 'workers'],
    services: ['service', 'services', 'svc', 'endpoint', 'endpoints'],
    configmaps: ['configmap', 'configmaps', 'config', 'configs', 'cm'],
    metrics: ['metric', 'metrics', 'cpu', 'memory', 'usage', 'resource', 'resources', 'capacity', 'utilization'],
    security: ['security', 'audit', 'scan', 'vulnerability', 'privileged', 'root', 'compliance', 'cve'],
    images: ['image', 'images', 'version', 'versions', 'tag', 'tags', 'registry', 'digest'],
    compare_ns: ['compare', 'comparison', 'versus', 'vs', 'diff'],
    events: ['event', 'events', 'warning', 'warnings', 'recent', 'timeline', 'alerts'],
    list_pods: ['pod', 'pods', 'workload', 'workloads', 'show', 'list'],
    list_deps: ['deployment', 'deployments', 'deploy', 'deploys', 'degraded'],
    namespaces: ['namespace', 'namespaces', 'ns', 'context'],
    help: ['help', 'what', 'can', 'commands', 'abilities'],
  };
  let best = 'unknown', bestScore = 0;
  const words = query.toLowerCase().split(/\s+/);
  for (const [intent, keywords] of Object.entries(intents)) {
    const score = words.filter(w => keywords.some(k => w.includes(k))).length;
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  return best;
};

// Extract a service/pod name from user input by matching against known deployments
const extractTarget = (query: string, names: string[]): string | null => {
  const q = query.toLowerCase();
  // Exact match first
  const exact = names.find(n => q.includes(n.toLowerCase()));
  if (exact) return exact;
  // Fuzzy: check if any word in query is a substring of a deployment name
  const words = q.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const match = names.find(n => n.toLowerCase().includes(word));
    if (match && !['restart', 'scale', 'show', 'the', 'pod', 'service', 'deployment', 'logs', 'for', 'in', 'prod', 'all'].includes(word)) {
      return match;
    }
  }
  return null;
};

export const Assistant: React.FC<AssistantProps> = ({ activeNamespace }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'ai', content: "👋 Hello! I'm k8pilot AI. I can monitor your cluster, diagnose crashes, restart services, view logs, and more. Try asking me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState<{ type: string; data?: any } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [lastScannedNS, setLastScannedNS] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Proactive scan — only fires on REAL namespace changes (not 'all', not initial)
  useEffect(() => {
    if (!activeNamespace || activeNamespace === 'all' || activeNamespace === lastScannedNS) return;
    setLastScannedNS(activeNamespace);

    const scan = async () => {
      try {
        const pods = await K8sService.getPods(activeNamespace).catch(() => []);
        const failing = pods.filter(p => !['Running', 'Succeeded', 'Completed'].includes(p.status));
        if (failing.length > 0) {
          setIsOpen(true);
          const lines = failing.slice(0, 3).map(p => `• \`${p.name}\` → ${p.status}${p.reason ? ` (${p.reason})` : ''}`).join('\n');
          const msg: Message = {
            id: `alert-${Date.now()}`, type: 'ai',
            content: `⚠️ **Namespace Alert: \`${activeNamespace}\`**\n\nI found ${failing.length} problem(s):\n${lines}\n\nSay "diagnose" to investigate, or "restart [name]" to fix.`
          };
          setMessages(prev => [...prev, msg]);
        }
      } catch { }
    };
    scan();
  }, [activeNamespace]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const addAIMessage = (content: string) => {
    setMessages(prev => [...prev, { id: `ai-${Date.now()}`, type: 'ai', content }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: currentInput }]);
    setInput('');
    setIsTyping(true);

    try {
      const query = currentInput.toLowerCase();

      // Handle follow-up context
      if (context?.type === 'awaiting_restart_target') {
        const deployments = await K8sService.getDeployments('all');
        const target = extractTarget(query, deployments.map(d => d.name));
        if (target) {
          const dep = deployments.find(d => d.name === target)!;
          const ok = await K8sService.restartService(dep.name, dep.namespace);
          addAIMessage(ok
            ? `✅ Rolling restart initiated for \`${dep.name}\` in \`${dep.namespace}\`.`
            : `❌ Restart failed for \`${dep.name}\`. Check RBAC permissions.`);
        } else {
          addAIMessage(`I couldn't find that deployment. Available:\n${deployments.slice(0, 20).map(d => `• \`${d.name}\``).join('\n')}`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      if (context?.type === 'awaiting_diagnose_target') {
        const pods = await K8sService.getPods('all');
        const target = extractTarget(query, pods.map(p => p.name));
        if (target) {
          const pod = pods.find(p => p.name === target)!;
          const analysis = await K8sService.analyzePodFailure(pod.name, pod.namespace);
          addAIMessage(analysis);
        } else {
          addAIMessage(`Pod not found. Try a more specific name.`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      // Follow-up: user gave a pod name for logs
      if (context?.type === 'awaiting_logs_target') {
        const pods = context.data?.pods || await K8sService.getPods('all');
        const target = extractTarget(query, pods.map((p: any) => p.name));
        if (target) {
          const pod = pods.find((p: any) => p.name === target)!;
          const logs = await K8sService.getLogs(pod.name, pod.namespace, 50);
          addAIMessage(`📜 **Logs for \`${pod.name}\`** (\`${pod.namespace}\`):\n\`\`\`\n${logs.slice(-2000)}\n\`\`\``);
        } else {
          addAIMessage(`Pod not found. Try copying the full pod name.`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      // Follow-up: user gave a pod name for describe
      if (context?.type === 'awaiting_describe_target') {
        const pods = context.data?.pods || await K8sService.getPods('all');
        const target = extractTarget(query, pods.map((p: any) => p.name));
        if (target) {
          const pod = pods.find((p: any) => p.name === target)!;
          const desc = await K8sService.describePod(pod.name, pod.namespace);
          if (desc) {
            const containers = (desc.containers || []).map((c: any) => `  • \`${c.name}\` → \`${c.image}\``).join('\n');
            addAIMessage(
              `## 🔎 Pod: \`${desc.name}\`\n\n` +
              `**Namespace:** ${desc.namespace}\n**Phase:** ${desc.phase}\n**Node:** ${desc.nodeName}\n**IP:** ${desc.ip}\n**Restarts:** ${desc.restarts}\n\n` +
              `**Containers:**\n${containers}`
            );
          } else {
            addAIMessage(`Failed to describe pod.`);
          }
        } else {
          addAIMessage(`Pod not found. Try the full name.`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      // Follow-up: user gave a deployment for scale
      if (context?.type === 'awaiting_scale_target') {
        const deps = await K8sService.getDeployments('all');
        const target = extractTarget(query, deps.map(d => d.name));
        const num = query.match(/\d+/);
        if (target) {
          if (num) {
            const dep = deps.find(d => d.name === target)!;
            const ok = await K8sService.scaleDeployment(dep.namespace, dep.name, parseInt(num[0]));
            addAIMessage(ok ? `📈 Scaled \`${dep.name}\` to **${num[0]}** replicas.` : `❌ Scale failed.`);
          } else {
            addAIMessage(`How many replicas? Say: \`scale ${target} to 3\``);
          }
        } else {
          addAIMessage(`Deployment not found. Try the exact name.`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      // Follow-up: user gave a deployment for rollback
      if (context?.type === 'awaiting_rollback_target') {
        const deps = await K8sService.getDeployments('all');
        const target = extractTarget(query, deps.map(d => d.name));
        if (target) {
          const dep = deps.find(d => d.name === target)!;
          const ok = await K8sService.rollbackDeployment(dep.name, dep.namespace);
          addAIMessage(ok ? `⏪ Rollback initiated for \`${dep.name}\`.` : `❌ Rollback failed.`);
        } else {
          addAIMessage(`Deployment not found. Try the exact name.`);
        }
        setContext(null);
        setIsTyping(false);
        return;
      }

      const intent = classifyIntent(query);

      switch (intent) {
        case 'health': {
          const health = await K8sService.getClusterHealth();
          if (health) {
            addAIMessage(
              `## 🏥 Cluster Health Report\n\n` +
              `| Metric | Value |\n|--------|-------|\n` +
              `| Namespaces | ${health.namespaces} |\n` +
              `| Total Pods | ${health.totalPods} |\n` +
              `| Running | ✅ ${health.running} |\n` +
              `| Failing | ❌ ${health.failing} |\n` +
              `| Deployments | ${health.totalDeployments} |\n` +
              `| Degraded | ⚠️ ${health.degraded} |\n` +
              `| Total Restarts | 🔄 ${health.totalRestarts} |\n\n` +
              (health.failing > 0 ? `Say "diagnose" to investigate failing pods.` : `Everything looks healthy! 🎉`)
            );
          } else {
            addAIMessage('Unable to fetch cluster health. Check backend connectivity.');
          }
          break;
        }

        case 'crash': {
          const pods = await K8sService.getPods('all');
          const failing = pods.filter(p => !['Running', 'Succeeded', 'Completed'].includes(p.status));
          if (failing.length > 0) {
            const target = failing[0];
            const analysis = await K8sService.analyzePodFailure(target.name, target.namespace);
            addAIMessage(`Found **${failing.length}** failing pod(s). Analyzing the worst one:\n\n${analysis}`);
          } else {
            addAIMessage('✅ All pods across all namespaces are healthy. No crashes detected.');
          }
          break;
        }

        case 'restart': {
          const deployments = await K8sService.getDeployments('all');
          const target = extractTarget(query, deployments.map(d => d.name));
          if (target) {
            const dep = deployments.find(d => d.name === target)!;
            const ok = await K8sService.restartService(dep.name, dep.namespace);
            addAIMessage(ok
              ? `✅ Rolling restart initiated for \`${dep.name}\` in \`${dep.namespace}\`.`
              : `❌ Restart failed for \`${dep.name}\`. Check RBAC.`);
          } else {
            const list = deployments.slice(0, 15).map(d => `• \`${d.name}\` (${d.namespace})`).join('\n');
            addAIMessage(`Which deployment should I restart?\n\n${list}${deployments.length > 15 ? `\n...and ${deployments.length - 15} more.` : ''}`);
            setContext({ type: 'awaiting_restart_target' });
          }
          break;
        }

        case 'logs': {
          const pods = await K8sService.getPods(activeNamespace === 'all' ? 'all' : activeNamespace);
          const target = extractTarget(query, pods.map(p => p.name));
          if (target) {
            const pod = pods.find(p => p.name === target)!;
            const logs = await K8sService.getLogs(pod.name, pod.namespace, 50);
            addAIMessage(`📜 **Logs for \`${pod.name}\`** (\`${pod.namespace}\`):\n\`\`\`\n${logs.slice(-2000)}\n\`\`\``);
          } else {
            addAIMessage(`Which pod's logs? Available:\n${pods.slice(0, 15).map(p => `• \`${p.name}\``).join('\n')}${pods.length > 15 ? `\n...and ${pods.length - 15} more.` : ''}`);
            setContext({ type: 'awaiting_logs_target', data: { pods } });
          }
          break;
        }

        case 'scale': {
          const parts = query.split(/\s+/);
          const num = parts.find(p => /^\d+$/.test(p));
          const deps = await K8sService.getDeployments('all');
          const target = extractTarget(query, deps.map(d => d.name));
          if (target && num) {
            const dep = deps.find(d => d.name === target)!;
            const ok = await K8sService.scaleDeployment(dep.namespace, dep.name, parseInt(num));
            addAIMessage(ok
              ? `📈 Scaled \`${dep.name}\` to **${num}** replicas.`
              : `❌ Scale failed. Check permissions.`);
          } else {
            addAIMessage('Please specify: `scale [deployment-name] to [number]`. Example: `scale auth to 3`');
          }
          break;
        }

        case 'list_pods': {
          const ns = activeNamespace || 'all';
          const pods = await K8sService.getPods(ns);
          const lines = pods.slice(0, 20).map(p => {
            const icon = p.status === 'Running' ? '🟢' : p.status === 'Succeeded' ? '🔵' : '🔴';
            return `${icon} \`${p.name}\` — ${p.status} (${p.namespace})`;
          }).join('\n');
          addAIMessage(`## Pods in \`${ns}\` (${pods.length} total)\n\n${lines}${pods.length > 20 ? `\n...and ${pods.length - 20} more.` : ''}`);
          break;
        }

        case 'list_deps': {
          const deps = await K8sService.getDeployments('all');
          const lines = deps.slice(0, 20).map(d => {
            const icon = d.status === 'Healthy' ? '✅' : '⚠️';
            return `${icon} \`${d.name}\` — ${d.replicas} (${d.namespace})`;
          }).join('\n');
          addAIMessage(`## Deployments (${deps.length} total)\n\n${lines}${deps.length > 20 ? `\n...and ${deps.length - 20} more.` : ''}`);
          break;
        }

        case 'namespaces': {
          const nsList = await K8sService.getNamespaces();
          addAIMessage(`## 🌍 Namespaces (${nsList.length})\n\n${nsList.map(ns => `• \`${ns}\``).join('\n')}`);
          break;
        }

        case 'nodes': {
          const nodes = await K8sService.getNodes();
          if (nodes.length > 0) {
            const lines = nodes.map(n => {
              const icon = n.status === 'Ready' ? '🟢' : '🔴';
              return `${icon} **${n.name}** — ${n.status} | ${n.roles} | CPU: ${n.cpu} | Mem: ${n.memory} | k8s ${n.version}`;
            }).join('\n');
            addAIMessage(`## 🖥️ Cluster Nodes (${nodes.length})\n\n${lines}`);
          } else {
            addAIMessage('Unable to fetch node info. Check RBAC permissions.');
          }
          break;
        }

        case 'describe': {
          const pods = await K8sService.getPods(activeNamespace === 'all' ? 'all' : activeNamespace);
          const target = extractTarget(query, pods.map(p => p.name));
          if (target) {
            const pod = pods.find(p => p.name === target)!;
            const info = await K8sService.describePod(pod.name, pod.namespace);
            if (info) {
              const containers = info.containers.map((c: any) => `• \`${c.name}\` → ${c.image} (CPU: ${c.requests?.cpu || '?'}, Mem: ${c.requests?.memory || '?'})`).join('\n');
              const conds = info.conditions.map((c: any) => `• ${c.type}: ${c.status}${c.reason ? ` (${c.reason})` : ''}`).join('\n');
              addAIMessage(
                `## 🔎 Pod: \`${info.name}\`\n\n` +
                `**Namespace:** ${info.namespace}\n` +
                `**Node:** ${info.nodeName}\n` +
                `**IP:** ${info.ip}\n` +
                `**Phase:** ${info.phase}\n` +
                `**Restarts:** ${info.restarts}\n` +
                `**Service Account:** ${info.serviceAccount}\n\n` +
                `### Containers\n${containers}\n\n` +
                `### Conditions\n${conds}`
              );
            } else {
              addAIMessage(`Could not describe \`${target}\`. It may have been evicted.`);
            }
          } else {
            addAIMessage(`Which pod should I describe?\n\n${pods.slice(0, 15).map(p => `• \`${p.name}\``).join('\n')}${pods.length > 15 ? `\n...and ${pods.length - 15} more.` : ''}`);
            setContext({ type: 'awaiting_describe_target', data: { pods } });
          }
          break;
        }

        case 'top_pods': {
          const top = await K8sService.getTopPods();
          if (top.length > 0) {
            const lines = top.slice(0, 15).map((p, i) => {
              const icon = p.restarts > 10 ? '🔴' : p.restarts > 0 ? '🟡' : '🟢';
              return `${i + 1}. ${icon} \`${p.name}\` — **${p.restarts}** restarts (${p.namespace})`;
            }).join('\n');
            addAIMessage(`## 🏆 Top Pods by Restarts\n\n${lines}`);
          } else {
            addAIMessage('No pod data available.');
          }
          break;
        }

        case 'rollback': {
          const deps = await K8sService.getDeployments('all');
          const target = extractTarget(query, deps.map(d => d.name));
          if (target) {
            const dep = deps.find(d => d.name === target)!;
            const ok = await K8sService.rollbackDeployment(dep.name, dep.namespace);
            addAIMessage(ok
              ? `⏪ Rollback initiated for \`${dep.name}\` in \`${dep.namespace}\`.`
              : `❌ Rollback failed for \`${dep.name}\`. Check permissions.`);
          } else {
            const list = deps.slice(0, 15).map(d => `• \`${d.name}\` (${d.namespace})`).join('\n');
            addAIMessage(`Which deployment should I roll back?\n\n${list}`);
            setContext({ type: 'awaiting_rollback_target' });
          }
          break;
        }

        case 'services': {
          const svcs = await K8sService.getServices(activeNamespace);
          const lines = svcs.slice(0, 20).map(s => `• \`${s.name}\` — ${s.type} | ${s.clusterIP} | Ports: ${s.ports.join(', ')} (${s.namespace})`).join('\n');
          addAIMessage(`## 🔌 Services (${svcs.length})\n\n${lines || 'No services found.'}`);
          break;
        }

        case 'configmaps': {
          const cms = await K8sService.getConfigMaps(activeNamespace);
          const lines = cms.slice(0, 20).map(cm => `• \`${cm.name}\` — Keys: ${cm.keys.join(', ') || 'empty'} (${cm.namespace})`).join('\n');
          addAIMessage(`## ⚙️ ConfigMaps (${cms.length})\n\n${lines || 'No configmaps found.'}`);
          break;
        }

        case 'metrics': {
          const res = await K8sService.getResourceSummary();
          if (res) {
            const cpuBar = '█'.repeat(Math.round(res.utilization.cpuPercent / 5)) + '░'.repeat(20 - Math.round(res.utilization.cpuPercent / 5));
            const memBar = '█'.repeat(Math.round(res.utilization.memPercent / 5)) + '░'.repeat(20 - Math.round(res.utilization.memPercent / 5));
            addAIMessage(
              `## 📊 Resource Utilization\n\n` +
              `**Nodes:** ${res.nodes} | **Pods:** ${res.pods}\n\n` +
              `**CPU:** ${cpuBar} ${res.utilization.cpuPercent}%\n` +
              `Requested: ${res.requests.cpu} / Capacity: ${res.capacity.cpu} cores\n\n` +
              `**Memory:** ${memBar} ${res.utilization.memPercent}%\n` +
              `Requested: ${res.requests.memoryMi}Mi / Capacity: ${res.capacity.memoryMi}Mi\n\n` +
              (res.utilization.cpuPercent > 80 ? '⚠️ **Warning:** CPU utilization is high. Consider scaling out.\n' : '') +
              (res.utilization.memPercent > 80 ? '⚠️ **Warning:** Memory utilization is high. Risk of OOM kills.\n' : '')
            );
          } else {
            addAIMessage('Unable to fetch resource metrics. Check backend connectivity.');
          }
          break;
        }

        case 'security': {
          const audit = await K8sService.getSecurityAudit();
          if (audit) {
            let msg = `## 🛡️ Security Audit Report\n\n`;
            msg += `**Scanned:** ${audit.scannedPods} pods\n`;
            msg += `**Findings:** 🔴 ${audit.high} HIGH | 🟡 ${audit.medium} MEDIUM | 🔵 ${audit.low} LOW\n\n`;
            if (audit.findings.length > 0) {
              msg += `### Top Findings:\n`;
              audit.findings.slice(0, 8).forEach((f: any) => {
                const icon = f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🔵';
                msg += `${icon} **${f.pod}** (${f.namespace}): ${f.issue}\n`;
                msg += `   💡 ${f.recommendation}\n\n`;
              });
            } else {
              msg += '✅ All pods pass security checks!';
            }
            addAIMessage(msg);
          } else {
            addAIMessage('Security audit failed. Check backend.');
          }
          break;
        }

        case 'images': {
          const deps = await K8sService.getDeployments('all');
          const imageMap: Record<string, string[]> = {};
          deps.forEach(d => {
            d.images.forEach(img => {
              if (!imageMap[img]) imageMap[img] = [];
              imageMap[img].push(d.name);
            });
          });
          const entries = Object.entries(imageMap);
          const latestCount = entries.filter(([img]) => img.endsWith(':latest') || !img.includes(':')).length;
          let msg = `## 🐳 Image Registry (${entries.length} unique images)\n\n`;
          if (latestCount > 0) msg += `⚠️ **${latestCount} images use :latest tag** — pin versions for production!\n\n`;
          entries.slice(0, 15).forEach(([img, deployments]) => {
            const flag = (img.endsWith(':latest') || !img.includes(':')) ? ' ⚠️' : '';
            msg += `• \`${img}\`${flag} → ${deployments.join(', ')}\n`;
          });
          addAIMessage(msg);
          break;
        }

        case 'compare_ns': {
          const nsList = await K8sService.getNamespaces();
          let msg = `## 📊 Namespace Comparison\n\n| Namespace | Pods | Failing | Health |\n|-----------|------|---------|--------|\n`;
          const results = await Promise.all(nsList.slice(0, 12).map(async ns => {
            const pods = await K8sService.getPods(ns).catch(() => []);
            const failing = pods.filter(p => !['Running', 'Succeeded', 'Completed'].includes(p.status)).length;
            return { ns, total: pods.length, failing };
          }));
          results.filter(r => r.total > 0).sort((a, b) => b.total - a.total).forEach(r => {
            const health = r.failing === 0 ? '✅ Healthy' : `🔴 ${r.failing} issue(s)`;
            msg += `| ${r.ns} | ${r.total} | ${r.failing} | ${health} |\n`;
          });
          addAIMessage(msg);
          break;
        }

        case 'events': {
          const events = await K8sService.getEvents('all');
          const warnings = events.filter(e => e.type === 'Warning').slice(-15);
          if (warnings.length > 0) {
            const lines = warnings.map(e => `⚠️ **${e.reason}** on \`${e.object}\` (${e.namespace})\n   ${e.message}`).join('\n\n');
            addAIMessage(`## 🚨 Recent Warning Events\n\n${lines}`);
          } else {
            addAIMessage('✅ No warning events found across the cluster. All clear!');
          }
          break;
        }

        case 'help': {
          addAIMessage(
            `## 🧠 k8pilot AI — 20 Commands\n\n` +
            `| Command | Example |\n|---------|----------|\n` +
            `| 🏥 Health | "how's the cluster?" |\n` +
            `| 🔍 Diagnose | "why is pod crashing?" |\n` +
            `| 🔄 Restart | "restart authapi" |\n` +
            `| ⏪ Rollback | "rollback authapi" |\n` +
            `| 📜 Logs | "logs for gateway" |\n` +
            `| 📈 Scale | "scale authapi to 3" |\n` +
            `| 🔎 Describe | "describe auth-pod" |\n` +
            `| 🏆 Top Pods | "top pods" |\n` +
            `| 🖥️ Nodes | "show nodes" |\n` +
            `| 📋 Pods | "show pods" |\n` +
            `| 📊 Deployments | "show deployments" |\n` +
            `| 🔌 Services | "show services" |\n` +
            `| ⚙️ ConfigMaps | "show configmaps" |\n` +
            `| 🌍 Namespaces | "list namespaces" |\n` +
            `| 📊 Metrics | "show cpu usage" |\n` +
            `| 🛡️ Security | "security audit" |\n` +
            `| 🐳 Images | "show images" |\n` +
            `| 📊 Compare | "compare namespaces" |\n` +
            `| 🚨 Events | "show warnings" |\n` +
            `| ⚠️ Alerts | Automatic on switch |\n\n` +
            `I **proactively alert** you when you switch to a namespace with failing pods!`
          );
          break;
        }

        default:
          addAIMessage("I didn't catch that. Try:\n• \"how's the cluster?\"\n• \"security audit\"\n• \"show images\"\n• \"compare namespaces\"\n• \"show warnings\"\n• \"help\" for all 20 commands");
      }
    } catch (err) {
      console.error('AI error:', err);
      addAIMessage('⚠️ Error communicating with the cluster. Try refreshing.');
    }

    setIsTyping(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)}
      style={{ position: 'fixed', right: '32px', bottom: '32px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white', border: 'none', padding: '16px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', zIndex: 100 }}>
      <Sparkles size={24} />
    </button>
  );

  return (
    <div className="assistant-panel">
      <div style={{ padding: '16px 20px', borderBottom: 'var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: '6px', borderRadius: '8px' }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>k8pilot AI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>● Connected</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      <div className="chat-history">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.type}`}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {msg.type === 'ai' ? <Bot size={11} /> : <User size={11} />}
              {msg.type === 'ai' ? 'k8pilot' : 'You'}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: '1.5' }}>{msg.content}</div>
          </div>
        ))}
        {isTyping && (
          <div className="message ai" style={{ display: 'flex', gap: '6px', padding: '16px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent-blue)', borderRadius: '50%', animation: 'pulse 1s infinite 0.0s' }}></div>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent-purple)', borderRadius: '50%', animation: 'pulse 1s infinite 0.15s' }}></div>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', animation: 'pulse 1s infinite 0.3s' }}></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {[
          { text: '🏥 Health', q: "How's the cluster?" },
          { text: '🔍 Diagnose', q: 'Why is pod crashing?' },
          { text: '🔄 Restart', q: 'Restart service' },
          { text: '📜 Logs', q: 'Show logs' },
          { text: '❓ Help', q: 'help' },
        ].map(chip => (
          <button key={chip.text} onClick={() => { setInput(chip.q); }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '5px 12px', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            {chip.text}
          </button>
        ))}
      </div>

      <div className="chat-input-area">
        <input className="chat-input" placeholder="Ask k8pilot..." value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()} />
        <button className="btn-primary" style={{ padding: '12px' }} onClick={handleSend}><Send size={18} /></button>
      </div>
    </div>
  );
};
