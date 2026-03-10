# Virtual Service Passport - Infrastructure Design

**High-Level Architecture for Decision-Making**

---

## 1. Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                SITE A (Primary)                              │
│                              [UK/EU Datacenter]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Frontend  │     │   Frontend  │     │   Frontend  │  (K3s Workers)    │
│  │  (React/    │     │  (React/    │     │  (React/    │                   │
│  │   Nginx)    │     │   Nginx)    │     │   Nginx)    │                   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                  │                  │                            │
│         └──────────────────┼──────────────────┘                            │
│                            │                                                │
│                     ┌──────▼──────┐                                         │
│                     │   Ingress   │                                         │
│                     │  (Traefik)  │                                         │
│                     └──────┬──────┘                                         │
│                            │                                                │
│         ┌──────────────────┼──────────────────┐                             │
│         │                  │                  │                             │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐                      │
│  │  Backend    │    │  Backend    │    │  Backend    │   (K3s Workers)     │
│  │  API (Go/   │    │  API (Go/   │    │  API (Go/   │                     │
│  │   Node.js)  │    │   Node.js)  │    │   Node.js)  │                     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                      │
│         │                  │                  │                             │
│         └──────────────────┼──────────────────┘                             │
│                            │                                                │
│                     ┌──────▼──────┐                                         │
│                     │  Message    │                                         │
│                     │   Queue     │                                         │
│                     │ (RabbitMQ)  │                                         │
│                     └──────┬──────┘                                         │
│                            │                                                │
│         ┌──────────────────┼──────────────────┐                             │
│         │                  │                  │                             │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐                      │
│  │  AI Worker │    │  AI Worker │    │  AI Worker │   (K3s Workers)      │
│  │ (Ollama/   │    │ (Ollama/   │    │ (Ollama/   │                       │
│  │  LLMs)     │    │  LLMs)     │    │  LLMs)     │                       │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SITE A STORAGE                                  │
│  ┌─────────────┐    ┌─────────────┐                                        │
│  │  PostgreSQL │    │   MinIO /   │    (S3-compatible object storage)       │
│  │  Primary    │    │   Rook CEPH │                                        │
│  └─────────────┘    └─────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Wireguard VPN Tunnel
                                      │ (encrypted site-to-site)
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SITE B (Secondary)                            │
│                              [EU Datacenter]                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Frontend  │     │   Frontend  │     │   Frontend  │  (K3s Workers)    │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                  │                  │                            │
│         └──────────────────┼──────────────────┘                            │
│                            │                                                │
│                     ┌──────▼──────┐                                         │
│                     │   Ingress   │                                         │
│                     │  (Traefik)  │                                         │
│                     └──────┬──────┘                                         │
│                            │                                                │
│         ┌──────────────────┼──────────────────┐                             │
│         │                  │                  │                             │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐                      │
│  │  Backend    │    │  Backend    │    │  Backend    │   (K3s Workers)     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                      │
│         │                  │                  │                             │
│         └──────────────────┼──────────────────┘                             │
│                            │                                                │
│                     ┌──────▼──────┐                                         │
│                     │  Message    │                                         │
│                     │   Queue     │                                         │
│                     │ (RabbitMQ)  │                                         │
│                     └──────┬──────┘                                         │
│                            │                                                │
│         ┌──────────────────┼──────────────────┐                             │
│         │                  │                  │                             │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐                      │
│  │  AI Worker │    │  AI Worker │    │  AI Worker │   (K3s Workers)       │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SITE B STORAGE                                  │
│  ┌─────────────┐    ┌─────────────┐                                        │
│  │  PostgreSQL │    │   MinIO /   │    (S3-compatible object storage)      │
│  │  Replica    │    │   Rook CEPH │                                        │
│  └─────────────┘    └─────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

External Connections:
- Users → CDN (Cloudflare) → Site A or Site B (GeoDNS/GLB)
- Backup/Admin → VPN → Management node
```

---

## 2. Server/VM Specifications Per Site

### Site A (Primary - UK)

| Component | VM/Physical | Count | Spec per Node | Notes |
|-----------|-------------|-------|---------------|-------|
| K3s Master | VM | 3 | 4 vCPU, 8GB RAM, 100GB SSD | Embedded etcd (or external) |
| K3s Worker (App) | VM | 3-6 | 8 vCPU, 16GB RAM, 200GB SSD | Frontend + Backend API |
| K3s Worker (AI) | GPU VM | 2-4 | 8 vCPU, 32GB RAM, 200GB SSD + 1x NVIDIA T4/L4 | Ollama/LLM inference |
| Database (PostgreSQL) | VM | 1-2 | 8 vCPU, 16GB RAM, 500GB NVMe | Primary with async replica |
| Object Storage | VM | 3 | 4 vCPU, 16GB RAM, 2TB HDD | MinIO or Rook CEPH |
| Message Queue | VM | 2 | 4 vCPU, 8GB RAM, 100GB SSD | RabbitMQ cluster |

### Site B (Secondary - EU)

| Component | VM/Physical | Count | Spec per Node | Notes |
|-----------|-------------|-------|---------------|-------|
| K3s Master | VM | 3 | 4 vCPU, 8GB RAM, 100GB SSD | Wait-for-API |
| K3 quorums Worker (App) | VM | 2-4 | 8 vCPU, 16GB RAM, 200GB SSD | Reduced count (scale on failover) |
| K3s Worker (AI) | GPU VM | 1-2 | 8 vCPU, 32GB RAM, 200GB SSD + 1x NVIDIA T4/L4 | Reduced inference capacity |
| Database (PostgreSQL) | VM | 1 | 8 vCPU, 16GB RAM, 500GB NVMe | Async replica |
| Object Storage | VM | 3 | 4 vCPU, 16GB RAM, 2TB HDD | MinIO or Rook CEPH |
| Message Queue | VM | 1 | 4 vCPU, 8GB RAM, 100GB SSD | Mirror of Site A |

---

## 3. Data Flow (User Message → AI → Logged)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│ Frontend│────▶│  API    │────▶│  Queue  │────▶│ AI      │
│ Browser │     │ (React) │     │ Gateway │     │(RabbitMQ│     │ Worker  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └────┬─────┘
                                                                       │
      ┌───────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI Model   │────▶│   Response  │────▶│     API     │────▶│  Frontend   │
│ (Ollama)    │     │  Generated  │     │  Gateway    │     │   (WebSocket│
└─────────────┘     └─────────────┘     └──────┬──────┘     └──────┬──────┘
                                               │                    │
                                               ▼                    │
                                      ┌─────────────┐              │
                                      │ PostgreSQL  │◀─────────────┘
                                      │ (logged)    │
                                      └─────────────┘
```

### Step-by-Step:

1. **User submits message** → Frontend (React SPA) sends to API Gateway via HTTPS
2. **API Gateway validates** → Authenticates user, stores message in PostgreSQL (status: "pending")
3. **API publishes to queue** → Message sent to RabbitMQ with correlation ID
4. **AI Worker consumes** → Pulls from queue, sends to Ollama container
5. **Ollama generates response** → Streams back to Worker
6. **Worker streams response** → Via WebSocket back to Frontend
7. **Response logged** → Stored in PostgreSQL (conversation history)
8. **Object storage** → Any attachments/images stored in MinIO (S3-compatible)

---

## 4. Redundancy Approach

### Database
- **PostgreSQL Primary** on Site A
- **Async Streaming Replica** on Site B (replication lag ~100ms acceptable)
- **WAL-G** for continuous archiving to object storage
- Failover: Patroni + etcd for automatic failover; promote replica if primary fails

### Object Storage
- **MinIO Erasure Coding** (data + parity) across 6+ drives
- **Rook CEPH** as alternative (self-healing)
- **Replication** to Site B via RClone or native MinIO replication

### Kubernetes
- **K3s cluster** spans both sites (or two clusters with shared ingress)
- **Traefik** with health checks; remove failed nodes from pool
- **Pod disruption budgets** ensure minimum replicas during maintenance

### Message Queue
- **RabbitMQ Mirrored Queues** across both sites
- Or use **Apache Kafka** with replication factor 2+

### Failover Strategy
| Failure Scenario | Detection | Action |
|------------------|-----------|--------|
| Site A entire failure | Health probes (external) | DNS failover to Site B (60-120s) |
| Database primary down | Patroni/Patroni | Auto-promote replica, update connection strings |
| API pod crash | K3s kubelet | Auto-restart, load balancer removes from pool |
| AI worker down | Health endpoint | Restart pod, queue message requeued |

### Data Sync
- **PostgreSQL**: Streaming async replication (Site A → B)
- **Object Storage**: MinIO replication policy or RClone cron
- **Config**: GitOps via ArgoCD/Flux (declarative, same on both sites)

---

## 5. Technology Choices Per Component

| Layer | Technology | Why |
|-------|------------|-----|
| **Container Orchestration** | K3s (lightweight Kubernetes) | Self-hosted, ARM/x86 support, embedded etcd |
| **Ingress/Load Balancer** | Traefik or MetalLB + Nginx | Automatic TLS, rate limiting, service mesh ready |
| **Database** | PostgreSQL 16+ | ACID, JSON support, excellent replication |
| **Connection Pool** | PgBouncer | Reduce DB connections from many pods |
| **Message Queue** | RabbitMQ or Apache Kafka | Reliability, ordering, large message support |
| **AI Inference** | Ollama (running quantized models) | Self-hosted, llama.cpp based, easy containerization |
| **LLM Models** | Mistral, Llama3, or Qwen (quantized) | Good quality, reasonable VRAM needs |
| **Object Storage** | MinIO | S3-compatible, erasure coding, Kubernetes native |
| **Frontend** | React + Vite + Nginx | SPA, containerized, CDN-ready |
| **Backend API** | Go (Gin/Fiber) or Node.js | High throughput, low latency |
| **Secrets** | Bitnami Sealed Secrets or Vault | GitOps-compatible secret management |
| **CI/CD** | GitHub Actions + ArgoCD | GitOps deployment, both sites from same repo |
| **Monitoring** | Prometheus + Grafana + Loki | Full observability stack |
| **Logging** | Loki + Promtail | Kubernetes native, low storage |
| **Backups** | WAL-G + RClone | Continuous archiving to object storage |

---

## 6. Network Requirements

### Ports Required

**Site A → Site B (VPN Tunnel):**
| Port | Service | Direction |
|------|---------|-----------|
| 51820/UDP | WireGuard | Bidirectional |
| 5432/TCP | PostgreSQL replication | Site A → B (via VPN) |
| 9000-9005 | MinIO replication | Bidirectional |
| 5672/TCP | RabbitMQ | Bidirectional (or use plugin) |

**External (User-Facing):**
| Port | Service | Notes |
|------|---------|-------|
| 443/TCP | HTTPS | Frontend + API (via Traefik) |
| 80/TCP | HTTP | Redirect to HTTPS |
| 8443/TCP | Admin API | Restricted, VPN only |

### VPN/Tunnel Between Sites
- **WireGuard** - Lightweight, fast, simple to configure
- **Or OpenVPN** if WireGuard blocked by datacenter
- Both sites need public IPs (or relay via Tailscale/Cloudflare Tunnel)
- Bandwidth: Minimum 100Mbps between sites (1Gbps recommended for replication)

### Internal Networking
- Use **Cilium** or **Flannel** (K3s defaults) for pod networking
- **NetworkPolicy** to restrict pod-to-pod communication
- Use **ClusterIP** for internal services; **NodePort**/LoadBalancer only for ingress

### Firewall Rules
- Allow 443/80 from Anywhere (0.0.0.0/0)
- Allow SSH (22) from admin VPN only
- Allow all Kubernetes ports from internal VPN subnet only

---

## 7. Estimated Hardware/Cost for 2-Site Setup

### Cloud VM Pricing (UK/EU - Approximate Monthly)

| Item | Site A | Site B | Monthly Cost (EUR) |
|------|--------|--------|-------------------|
| **K3s Master (3x)** | 3 x (4vCPU/8GB) | 3 x (4vCPU/8GB) | ~€180 |
| **K3s Worker App (4x)** | 4 x (8vCPU/16GB) | 2 x (8vCPU/16GB) | ~€480 |
| **K3s Worker GPU (2x)** | 2 x (8vCPU/32GB + T4) | 1 x (8vCPU/32GB + T4) | ~€900 |
| **PostgreSQL (2x)** | 1 x (8vCPU/16GB) | 1 x (8vCPU/16GB) | ~€160 |
| **Object Storage (6x)** | 3 x (4vCPU/16GB) | 3 x (4vCPU/16GB) | ~€240 |
| **RabbitMQ (2x)** | 2 x (4vCPU/8GB) | 1 x (4vCPU/8GB) | ~€100 |
| **Networking/VPN** | Bandwidth | Bandwidth | ~€50 |
| **IP Addresses** | Public IPs | Public IPs | ~€20 |

**Total Monthly Estimate: ~€2,130/month**

### Alternative: Bare Metal / Co-Located

| Item | Spec | Quantity | One-Time Cost |
|------|------|----------|---------------|
| **Server (Site A)** | 2U server, 64GB RAM, 2x E-2300, 4x 2TB NVMe, 1x NVIDIA T4 | 2 | ~€8,000 |
| **Server (Site B)** | 2U server, 64GB RAM, 2x E-2300, 4x 2TB NVMe, 1x NVIDIA T4 | 2 | ~€8,000 |
| **Networking** | Switches, UPS, cabling | 2 sites | ~€2,000 |
| **Colocation** | Rack space, power, connectivity | 2 sites | ~€400/mo |

**Bare Metal One-Time: ~€18,000 + €400/mo** (cheaper long-term if usage is high)

---

## 8. Steps to Deploy and Test

### Phase 1: Foundation (Week 1)

1. **Provision VMs** at both providers (Site A UK, Site B EU)
2. **Install K3s** on masters first, join workers
3. **Configure WireGuard** VPN between sites (test latency <50ms)
4. **Deploy Ingress** (Traefik) with automatic TLS (Let's Encrypt)

### Phase 2: Core Services (Week 2)

5. **Deploy PostgreSQL** (Patroni managed) - primary Site A, replica Site B
6. **Deploy MinIO** with erasure coding on both sites
7. **Deploy RabbitMQ** cluster
8. **Test replication** - verify data flows to Site B

### Phase 3: Application (Week 3)

9. **Build and push** frontend/Backend Docker images
10. **Deploy Backend API** (3 replicas Site A, 2 Site B)
11. **Deploy Frontend** (nginx)
12. **Configure DNS** - Cloudflare with failover (GeoDNS)

### Phase 4: AI Layer (Week 4)

13. **Deploy Ollama** as Kubernetes deployment with GPU support
14. **Pull models** (start with 7B quantized models)
15. **Test inference** - verify GPU allocation and response times

### Phase 5: Testing & Validation

| Test | Method | Success Criteria |
|------|--------|------------------|
| **Smoke Test** | Deploy test pod, curl endpoints | All services respond 200 |
| **Failover (DB)** | Kill primary PostgreSQL | Automatic failover <60s |
| **Failover (Site)** | Shutdown Site A entirely | Site B serves traffic |
| **Load Test** | k6 or Locust, 100 concurrent users | P95 <500ms response |
| **AI Stress Test** | Queue 100 requests | All processed, no OOM |
| **Backup/Restore** | Trigger WAL backup, restore to fresh DB | Data intact |
| **Security Scan** | Trivy/Aquasec on images | No Critical CVEs |

### Phase 6: Production Cutover

16. **Enable monitoring** - Prometheus alerts on failure
17. **Configure backups** - WAL-G to MinIO, test restore
18. **DNS cutover** - Switch production traffic
19. **Run for 48h** - Monitor logs, latency, error rates

---

## Summary

- **Architecture**: K3s cluster spanning 2 sites (UK + EU), containerized services
- **HA Strategy**: PostgreSQL streaming replica, MinIO erasure coding, RabbitMQ mirrored queues
- **AI Layer**: Self-hosted Ollama with quantized models on GPU nodes
- **Cost**: ~€2,130/mo cloud, or ~€18k + €400/mo bare metal
- **Complexity**: Moderate-high - requires Kubernetes expertise
- **Next Steps**: Validate requirements, choose hosting providers, begin provisioning

This design provides resilience against single-site failure while keeping all data UK/EU hosted and self-controlled.
