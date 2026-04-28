# 🛰️ K8pilot v4.1 Nova — AI-Powered Kubernetes Command Center

**K8pilot** is a production-grade, AI-powered Kubernetes dashboard built for DevOps engineers who demand more than `kubectl`. It combines real-time observability, security auditing, cost intelligence, and a proactive AI engine into a stunning, code-split, themeable interface with **54 views** and **75+ API endpoints**.

![K8pilot Interface](assets/k8pilot.png)

> **Docker Image**: `cerebro46/k8pilot:beta`

---

## 😫 The Pain: Why We Built This

Traditional Kubernetes management is painful. We've all been there:
- **Terminal Blindness**: Staring at `kubectl get pods` across 20+ namespaces and missing the one pod that's quietly OOMKilled.
- **Troubleshooting Hell**: The endless cycle of `logs` → `describe` → `google` → `repeat`.
- **Reactive Ops**: Waiting for a Slack alert after a pod has already been down for 5 minutes.
- **Security Gaps**: Deploying images with `:latest` tags or privileged containers because "it just needs to work" for now.
- **Cost Blindsides**: No visibility into resource waste until the monthly cloud bill arrives.

**K8pilot** turns this chaos into a clean, intelligent, and visually stunning control center — shifting from reactive monitoring to **proactive intelligence**.

---

## ✨ Feature Suite (v4.1 Nova)

### 🛰️ Cluster Intelligence & AI
| Feature | Description |
|---------|-------------|
| **Aura Hub** | Unified application dashboard with namespace grouping and health overview |
| **Cluster Pulse** | Real-time CPU/Memory heatmap showing workload pressure across the cluster |
| **Intelligence Feed** | Central stream of scaling, restart, deletion, and network events |
| **AI Pod Doctor** | Deep root-cause analysis of pod failures with fix proposals |
| **AI-Assisted Remediation** | One-click YAML patches to resolve CrashLoops or OOMs |
| **Namespace 360** | Namespace-level deep dive with resource topology |

### 📊 Observability & Diagnostics
| Feature | Description |
|---------|-------------|
| **Pod Health Matrix** | Heuristic 0–100 health scoring for every pod with issue detection |
| **Incident Timeline** | Correlated K8s warning events with severity escalation and status tracking |
| **Rollout Tracker** | Real-time deployment rollout status with animated progress bars |
| **CronJob Monitor** | Scheduled workload tracking with execution history and success/fail rates |
| **Resource Heatmap** | Per-node CPU/memory intensity visualization |
| **Network Diagnostics** | DNS resolution audit, endpoint health, service connectivity mapping |
| **Log Stream** | Real-time pod log streaming with container selection |

### 🛡️ Security & Compliance
| Feature | Description |
|---------|-------------|
| **Cluster Benchmark** | Comprehensive A+ → D grading across Security, Reliability, Resources, Networking, Storage |
| **RBAC Auditor** | Cluster role and binding analysis with permission matrix |
| **Image Scanner** | Detects `:latest` tags, missing digests, public registry usage |
| **Security Scorecard** | Namespace-level GPA compliance grading |
| **TLS Auditor** | Certificate and secret audit with expiry tracking |
| **Network Policies** | Policy coverage and rule visualization |

### 💰 Cost & Resource Optimization
| Feature | Description |
|---------|-------------|
| **Resource Recommender** | Right-sizing analysis with estimated monthly savings |
| **Capacity Planner** | Cluster resource forecasting with optimization recommendations |
| **Cloud Cost Profiler** | Estimated burn rate by namespace based on live resource requests |
| **Config Drift Detector** | Cross-namespace ConfigMap/Secret comparison with per-key diffs |
| **Cost Optimizer** | Identifies over-provisioned and under-utilized workloads |

### 🚀 Infrastructure & Operations
| Feature | Description |
|---------|-------------|
| **Nodes & Clusters** | Node health, capacity, taints, conditions with detail panels |
| **Node HA Spread** | Pod distribution analysis across availability zones |
| **Topology Map** | Interactive cluster resource relationship graph |
| **Aura Tree** | Hierarchical namespace → deployment → pod drill-down |
| **Ghost Inspector** | Automated zombie resource detection (unused ConfigMaps, Secrets, PVCs) |
| **Rollback Engine** | Deployment revision history with one-click rollback |
| **Network Listen** | Live service-to-service traffic flow monitoring |

---

## 🎨 25 Premium Themes

Every theme maintains the premium glassmorphism aesthetic:

| | | | | |
|---|---|---|---|---|
| Midnight | Arctic | Catppuccin | Tokyo Night | Night Owl |
| Everforest | Rosé Pine | Ayu Mirage | Deep Sea | One Dark |
| Palenight | IBM Carbon | Monokai Pro | GitHub Dark | Shades of Purple |
| Vesper | Gruvbox | Dracula | Nord | Obsidian |
| Cobalt | Graphite | Forest | Abyss | Monochrome |

---

## ⚡ Architecture & Performance

### Code-Split Frontend (v4.1 Optimization)
```
BEFORE (v3.5):  965 kB single bundle  ⚠️ Over 500kB limit
AFTER  (v4.1):  104 kB initial load   ✅ 89% reduction
```

- **47 lazy-loaded view chunks** — each view loads on-demand (2.8–47 kB each)
- **4 vendor bundles** — React, Framer Motion, Lucide Icons, xterm cached independently
- **Suspense fallback** — skeleton loader while chunks load
- **Categorized sidebar** — 9 collapsible groups instead of 46 flat items

### Backend
- **Node.js/Express** with 75+ REST API endpoints
- **Shared utility modules** — `parseCpu`, `parseMem`, `safeGet` extracted into `server/utils.js`
- **TTL cache layer** — `server/cache.js` for K8s API response deduplication (10s TTL)
- **JWT authentication** with 24h session tokens
- **WebSocket** streaming for logs and terminal

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Vanilla CSS (Glassmorphism Design System) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js, Express |
| Kubernetes | `@kubernetes/client-node` (CoreV1, AppsV1, BatchV1, RBAC, Networking) |
| Terminal | xterm.js with WebSocket |
| Auth | JWT + bcrypt |

---

## 🚀 Quick Start

### 1. Build and Push
```bash
docker build -t cerebro46/k8pilot:latest .
docker push cerebro46/k8pilot:latest
```

### 2. Deploy to Kubernetes
```bash
kubectl apply -f deploy/k8pilot-full.yaml
```

> [!IMPORTANT]
> The deployment manifest includes RBAC with full cluster-read permissions. Review `deploy/k8pilot-full.yaml` before applying to production clusters.

### 3. Access the Dashboard
```bash
kubectl port-forward svc/k8pilot-service 5000:80 -n k8pilot
```
Open `http://localhost:5000` — Default credentials: `admin` / `admin123`

### 4. Local Development
```bash
# Terminal 1: Frontend (hot-reload)
npm install
npm run dev

# Terminal 2: Backend
cd server && npm install && node index.js
```

---

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for session signing | `k8pilot-super-secret-2026` |
| `ADMIN_USER` | Dashboard username | `admin` |
| `ADMIN_PASSWORD` | Dashboard password | `admin123` |

---

## 📁 Project Structure

```
K8pilot/
├── src/
│   ├── App.tsx              # Main router with React.lazy() code-splitting
│   ├── index.css            # Theme system (25 themes) + design tokens
│   ├── services/k8s.ts      # Frontend API service layer
│   └── components/          # 54 view components (lazy-loaded)
├── server/
│   ├── index.js             # Express API server (75+ endpoints)
│   ├── utils.js             # Shared K8s parsing utilities
│   ├── cache.js             # TTL cache with request deduplication
│   └── metrics.js           # Metrics collector
├── deploy/
│   └── k8pilot-full.yaml    # Full K8s deployment manifest
└── Dockerfile               # Multi-stage build (Node 18 Alpine)
```

---

## 📋 Version History

| Version | Codename | Highlights |
|---------|----------|------------|
| **v4.1** | **Nova** | Code-split architecture, 5 new features (CronJob Monitor, Config Drift, Resource Recommender, Network Diagnostics, Cluster Benchmark), categorized sidebar, TTL cache |
| **v4.0** | Nova | Image Scanner, Rollout Tracker, Capacity Planner, Pod Health Matrix, Incident Timeline |
| **v3.5** | Orion | Intelligence Feed, TLS Auditor, Ghost Inspector, Network Listen, 25 themes |
| **v3.0** | Orion | AI Pod Doctor, Security Scorecard, RBAC Explorer, Cost Profiler |

---

## 🤝 Contributing

Built with ❤️ by [Priyesh](https://github.com/priyesh2). Feel free to open issues or submit PRs for new features or themes!
