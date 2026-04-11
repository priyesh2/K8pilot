# 🚀 k8pilot: Enterprise Kubernetes Control Plane

**k8pilot** is a next-generation, AI-powered Kubernetes dashboard designed for DevOps engineers who need more than just a list of pods. It combines real-time observability, security auditing, and an intelligent assistant into a stunning, themeable interface.

![k8pilot Interface](assets/k8pilot.png)

---

## 😫 The Pain: Why we built this
Traditional Kubernetes management is painful. We've all been there:
- **Terminal Blindness**: Staring at `kubectl get pods` across 20+ namespaces and missing the one pod that's quietly OOMKilled.
- **Troubleshooting Hell**: The endless cycle of `logs` → `describe` → `google` → `repeat`.
- **Sidecar Nightmares**: Trying to fetch logs and getting the "choose your container" error from Istio/Envoy sidecars.
- **Information Overload**: Dashboards that are just dry tables of data without any intelligent analysis.
- **Security Gaps**: Deploying images with `:latest` tags or privileged containers because "it just needs to work" for now.

**k8pilot** was built to turn this chaos into a clean, intelligent, and visually stunning control center.

---

## 🎯 Who is this for?
- **DevOps Engineers & SREs**: Who need to diagnose cluster state in seconds, not minutes.
- **Platform Engineers**: Who want to provide a "safety-first" dashboard with built-in security auditing.
- **Full-Stack Developers**: Who want a friendly, AI-assisted way to manage their workloads without being K8s gurus.
- **Security Teams**: Who need instant visibility into container compliance and resource boundaries.

---

## ✨ Key Features (The Galaxy Brain Update)

### 🚀 Peak DevOps & Pro Tooling
- **Proactive Event Webhooks**: A native `Watcher` binds right to the cluster event stream, intercepts Warning/Error anomalies, and dispatches pristine JSON payloads dynamically to Slack, Google Chat, or Microsoft Teams.
- **Rollout History & Rollbacks**: View a GitOps-style timeline of your `ReplicaSets` and instantly revert production to a previous version with one click.
- **Live YAML/JSON Editor**: Directly fetch, edit, and instantly `PATCH` live Kubernetes resources straight from the UI.
- **Infrastructure Cost Profiler**: Automatically calculates your estimated monthly cluster burn rate separated by namespace based on resource requests.
- **Interactive Topology Map**: A smooth, drag-and-drop matrix displaying the traffic flow architecture between your Services, Deployments, and Pods.
- **Animated Registry Stream**: A hacker-style console mimicking asynchronous registry events and OCI artifact digests.

### 📊 Comprehensive Workload Support
- **Advanced Workloads Hub**: Fully manage **StatefulSets** (Databases), **DaemonSets** (Node Agents), **Jobs** (Scripts), and **CronJobs** (Schedules) all from a unified interface.
- **Custom Resource Definitions**: Explore all installed CRDs, operators, and cluster extensions.

### 🛡️ Next-Gen Security & Auditing
- **RBAC Security Explorer**: Audit your cluster access with a clean matrix of `ClusterRoles`, `Roles`, and their bound `RoleBindings`.
- **Network Policies**: Review your active Kubernetes ingress and egress traffic boundaries to guarantee a zero-trust environment.
- **Automated Pod Scanning**: Scans every pod for privileged mode, root execution, and host network exposure with instant badging.

### 📊 Real-Time Observability & Management
- **Pod & Node Metrics**: Live CPU and Memory utilization per-pod, plus intuitive cluster capacity gauges via `metrics.k8s.io`.
- **Services & Networking**: Comprehensive service discovery with type badges and ingress rules visibility.
- **ConfigMaps & Secrets**: Securely explore configuration metadata and secret keys.
- **Cluster Events Timeline**: A live stream of cluster events with automatic warning highlighting and chronological tracking.
- **Interactive Pod Details**: An advanced "Describe" modal offering deep insights into container health, conditions, and resource limits directly from the dashboard.

### 🧠 Intelligent AI Assistant
- **20+ Diagnostic Commands**: "Why is my pod crashing?", "Show CPU usage", "Security audit".
- **Context-Aware Memory**: Remembers which pod you're talking about during multi-step troubleshooting.
- **Proactive Alerts**: Automatically notifies you when you switch to a namespace with failing workloads.



### 📜 Advanced Log Management
- **Multi-Container Aware**: Automatically detects and selects the application container, skipping Istio/Linkerd sidecars.
- **Interactive Logs**: Tail, filter, and export logs directly from the browser.

### 🎨 25 Premium Visual Themes
Tired of the standard Kubernetes dashboard? K8pilot features a robust aesthetic engine loaded with exactly 25 top-tier styling paradigms relying heavily on modern glassmorphism. Highlights include:
- 🌙 **Midnight**: Deep professional indigo and pure dark-modes.
- 💻 **Matrix**: Pure black with stark phosphor hacker `#00ff41` greens.
- 🪨 **Obsidian**: A jet black pure OLED theme with silver accents.
- 🌸 **Sakura**: Beautiful pale cherry blossoms and striking magenta.
- 💿 **Hologram**: Highly iridescent UI featuring airy pastels, lavender, and cyans.
- 🔥 **Solarflare**, ❄️ **Nord**, 🧛 **Dracula**, 🌿 **Forest**, and 16 more!

---

## 🛠️ Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Vanilla CSS (Rich Glassmorphism)
- **Backend**: Node.js (Express)
- **Kubernetes**: `@kubernetes/client-node`
- **Infrastructure**: EKS, GKE, AKS, OKE Compatible

---

## 🚀 Quick Start

### 1. Build and Push
```bash
docker build -t docker.io/cerebro46/k8pilot:latest .
docker push docker.io/cerebro46/k8pilot:latest
```

### 2. Deploy to Kubernetes

**Option A: One-Command Deployment (Recommended)**
```bash
kubectl apply -f deploy/k8pilot-full.yaml
```

**Option B: Manual Granular Deployment**
Apply the specialized RBAC permissions and deployment Manifests manually:
```bash
kubectl apply -f deploy/namespace.yaml
kubectl apply -f deploy/rbac.yaml
kubectl apply -f deploy/deployment.yaml
```

> [!IMPORTANT]
> **Galaxy Brain RBAC Updates**: The new DevOps dashboard endpoints require significantly expanded RBAC permissions. If you are upgrading from an older version, make sure your cluster roles have access to `apps` (Statefulsets, Daemonsets), `batch` (Jobs, CronJobs), `apiextensions.k8s.io` (CRDs), `rbac.authorization.k8s.io` (Roles, RoleBindings), and that you have `patch` and `update` verbs allowed for live YAML editing!

### 3. Access the Dashboard
Expose via LoadBalancer or Port-Forward:
```bash
kubectl port-forward svc/devops-assistant-service 3000:80 -n k8pilot
```
Default Credentials: `admin` / `admin123` (Configurable via Env Vars).

---

## 🔒 Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for session signing | `k8pilot-secret-key-2024` |
| `ADMIN_USER` | Dashboard username | `admin` |
| `ADMIN_PASSWORD` | Dashboard password | `admin123` |
| `PORT` | Backend port | `3001` |

---

## 🤝 Contributing
Built with ❤️ by [Priyesh](https://github.com/priyesh2). Feel free to open issues or submit PRs for new AI intents or themes!
