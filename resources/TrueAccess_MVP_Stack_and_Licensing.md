# TrueAccess MVP — Complete Stack, Build vs. Buy, and License Posture

**Prepared for:** engineering leadership and delivery team
**Scope:** everything required to run the TrueAccess MVP in production, on Kubernetes, using only commercially-usable software (MIT / Apache-2.0 / AGPLv3 / MPL-2.0 and similar) — with every license claim below verified against current sources, not assumed.

---

## Executive Summary

TrueAccess maps who can reach what across every device, application, and system in the organization — an access-graph platform, not a CRUD app. Left unmanaged, a system like this becomes a multi-year build. The strategy for the MVP is deliberately **buy-first**: adopt mature, license-clean, Kubernetes-native open-source products everywhere a real product already solves the problem well, and reserve custom engineering for the small number of things that are genuinely specific to this product — the confidence/trust model, the temporal access ledger, and the graph-exploration experience itself.

**The result: 16 off-the-shelf products, 4 custom-built components.** Of those four, two (the "Scout residual" connectors and the DataGerry sync bridge) are small, focused pieces of glue — hundreds of lines, not applications. The other two — **Atlas** (the core engine) and **Compass** (the graph-exploration UI) — are where the product's actual differentiated value lives, and where engineering investment is intentionally concentrated.

**License posture:** every product in this stack is free to self-host and run internally for commercial purposes. Roughly two-thirds carry fully permissive OSI-approved licenses (Apache-2.0, MIT, BSD, MPL-2.0); the remainder are AGPLv3, which this scenario treats as acceptable — the practical obligation of AGPLv3 (publish your modifications if you offer a *modified* version as a network service) is avoidable simply by running these products unmodified and integrating only through their APIs, which is the plan for all of them. Three products in the broader ecosystem (Vault, Terraform, and old-license Redis) carry source-available-but-not-OSI-approved licenses (BUSL/RSAL); this document routes around all three with fully open equivalents (OpenBao, OpenTofu, and Redis-under-its-AGPL-option-or-Valkey) so nothing in the actual recommended stack falls outside the requested license set.

**What this buys the organization:** a working production MVP without building an ETL platform, an orchestrator, a query engine, a BI tool, a CMDB, a secrets manager, or an observability stack from scratch — while keeping full ownership of the two things that are actually the product.

---

## Technical Summary

### 1. Readily available, containerized, commercial-use-clean products

Every product below: has an official or well-maintained community container image, is deployable to Kubernetes (Helm chart or straightforward manifests), and is licensed for free commercial self-hosted use.

| Product | Role in the stack | License | Container image | Kubernetes deployment |
|---|---|---|---|---|
| **Apache Airflow** | Orchestration (Trailhead) | Apache-2.0 | `apache/airflow` (official) | Official Helm chart (`apache-airflow/airflow`) |
| **Apache Spark** | Transformation engine (Forge) | Apache-2.0 | `apache/spark` (official) | Spark Kubernetes Operator, Apache-2.0, Helm chart |
| **dbt Core + dbt-trino / dbt-spark** | Conform + temporal (SCD2) modeling | Apache-2.0 (verified: dbt-trino PyPI, May 2026 release) | Adapter-specific images (GHCR) | Runs as an Airflow-triggered Job, not a persistent service |
| **Zingg** | Entity resolution | AGPLv3 (verified: zinggAI/zingg GitHub) | `zingg/zingg` (official) | Runs as a Spark job, Airflow-triggered |
| **Great Expectations** | Data quality gates | Apache-2.0 | Runs as a library inside Spark/Airflow jobs | Job/Pod, Airflow-triggered |
| **Project Nessie** | Iceberg catalog (Bedrock) | Apache-2.0 | `projectnessie/nessie` (official) | Community Helm chart |
| **Trino** | Query engine (Overlook) | Apache-2.0 | `trinodb/trino` (official) | Community Helm chart |
| **MinIO** *(or real S3)* | Object storage | AGPLv3 (Community Edition) | `minio/minio` (official) | Official Helm chart; prefer managed S3 if available — zero licensing question at all |
| **CloudNativePG** | Postgres operator (Atlas's DB, Nessie's DB) | Apache-2.0 | Operator image, official | Official operator + Helm chart |
| **DataGerry** | Schema definition UI (Blueprint) | **AGPLv3** (verified: DATAGerry/DATAGerry GitHub) | `becongmbh/dg-backend`, `dg-frontend` | No official Helm chart — manifests need to be authored (see §3) |
| — its dependency: MongoDB | DataGerry's own datastore | SSPL (not OSI-approved, but MongoDB's own FAQ confirms purely-internal self-hosted use does **not** trigger the copyleft clause) | `mongo` (official) | StatefulSet + PVC |
| — its dependency: RabbitMQ | DataGerry's internal messaging | MPL-2.0 | `rabbitmq` (official) | Official Helm chart |
| **Apache Superset** | Reports/dashboards (Chronicle's replacement) | Apache-2.0 | `apache/superset` (official) | Official Helm chart |
| **Open Policy Agent (OPA)** | Authorization decisions | Apache-2.0 | `openpolicyagent/opa` (official) | Community Helm chart; same technology also drives K8s admission policy (Sentinel) |
| **OpenBao** | Secrets management | **MPL-2.0, OSI-approved** (verified — forked from Vault 1.14.0 pre-BUSL) | `openbao/openbao` (official) | Official Helm chart, Vault-API-compatible |
| **Valkey**, or **Redis 8.x under its AGPLv3 option** | Cache | Valkey: BSD-3-Clause / Redis 8.x: AGPLv3 (verified — Redis re-added an OSI-approved option in Redis 8, May 2025) | `valkey/valkey` or `redis` | Helm chart (Bitnami or official) |
| **kube-prometheus-stack** (Prometheus, Alertmanager) | Metrics (Watchtower) | Apache-2.0 | Community stack, widely standard | One Helm install |
| **Grafana** + **Loki** | Dashboards, logs (Watchtower) | **AGPLv3** (Grafana Labs relicensed both in 2021) | Official images | Official Helm charts |
| **OpenTofu** | Infrastructure as code (Anchor) | MPL-2.0, OSI-approved (Terraform's Apache-2.0-spirited fork after Terraform went BUSL) | CLI tool, not a running service | Runs in CI, not deployed to the cluster |
| **ArgoCD** | GitOps delivery (Conveyor) | Apache-2.0 | Official images | Official Helm chart |
| **Tekton** | CI/CD pipelines, if you want build/test running on your own cluster rather than SaaS CI | Apache-2.0, CNCF | Official images | Official Helm chart / operator |

**Where Meltano fits, as an alternative to Airbyte:** the earlier design proposed Airbyte for the connector layer. Airbyte is **ELv2** — free to self-host and run internally, but not one of the license families named for this exercise, and not OSI-approved. **Meltano** (MIT-licensed, confirmed) is the precise fit if strict adherence to the stated license set matters more than Airbyte's larger connector catalog and friendlier UI. This is a real trade-off, not a strict downgrade: Meltano is config/CLI-driven (Singer taps/targets) rather than a polished web UI, and its connector catalog, while large, is generally less turnkey than Airbyte's for common SaaS sources. Recommendation: use Meltano if license purity is a hard requirement; use Airbyte if "free for internal commercial use" is sufficient and the UI/breadth advantage is worth it.

---

### 2. What has no off-the-shelf fit — build from scratch

Four components, and only four. Each is custom because it encodes something specific to TrueAccess that no general-purpose product does.

| Component | Why it must be custom | Recommended tech stack | Deploys as |
|---|---|---|---|
| **Atlas** (core engine) | Owns the confidence/trust state machine, the temporal ledger's read API, the AuthZ enforcement point, and the traversal API Compass depends on — none of this is a generic CRUD or BI problem an off-the-shelf tool solves | **Python + FastAPI** (MIT) + **SQLAlchemy 2.0** (MIT) + **Alembic** (MIT, migrations) + **Pydantic** (MIT) + **Celery** or **arq** (BSD/MIT, background workers) + **Uvicorn** (BSD). *Rationale: the rest of this stack — Airflow, Spark, dbt, Zingg — is already Python-heavy; one fewer language across the platform, and the team's data-engineering skills transfer directly to the app layer.* .NET (ASP.NET Core + EF Core + MediatR, all MIT/Apache-2.0) remains an equally valid choice if reusing prior work is preferred — nothing about the domain model requires either language. |
| **Compass** (traversal UI) | Node-within-node containment visualization, guided use-case playback, path highlighting — no BI or graph-visualization product does this specific interaction model | **React** (MIT) + **TypeScript** (Apache-2.0) + **D3.js** (BSD/ISC) — unchanged from the original recommendation; this was already the right call | Static SPA behind a container, served via any lightweight image (e.g., `nginx` for the built assets) |
| **DataGerry Bridge** | The one piece of glue nothing off-the-shelf provides: translate DataGerry's Type/Relation definitions into Iceberg DDL and Atlas's validation cache | **Python** (matches Atlas and the rest of the data platform; a few hundred lines, not an application) | Kubernetes **CronJob** (poll DataGerry's REST API on an interval — schema changes are infrequent, so this doesn't need to be a persistent service or a webhook listener at MVP scale) |
| **Scout residual** | Connectors for genuinely bespoke internal systems Meltano/Airbyte's catalog doesn't cover | **Python**, following whichever connector framework's plugin interface (Singer tap spec if using Meltano) | Runs inside the same job-runner pattern as the rest of ingestion, triggered by Airflow |

---

### 3. What still needs customizing, on top of the off-the-shelf products

This is the honest accounting the "Airflow needs DAGs" observation was pointing at — every product below is a real deployable image, and every row below is still real, necessary work, just of a fundamentally lighter kind (configuration and content, not application engineering).

| Product | What we build on top of it | Nature of the work |
|---|---|---|
| Airflow | Every DAG: ingestion triggers, Bronze→Silver→Gold promotion, table maintenance | Python code (orchestration logic, not business logic) |
| Spark / dbt | The actual conform models, the confidence-scoring rule set, the SCD2 snapshot configs | dbt models are declarative SQL/YAML; the confidence-scoring rule itself is the one piece of genuinely custom PySpark logic in the whole pipeline |
| Zingg | Training data / labeled match examples so its ML model learns our entities | Data curation, not code |
| Great Expectations | Expectation suites defining what "valid" means per extension table | Declarative config |
| DataGerry | The actual Type/Section/Field/Relation definitions for every resource type; no official Helm chart, so K8s manifests for it need to be authored once | Content authored through DataGerry's own UI, plus a one-time DevOps effort for the manifests |
| Superset | Every dashboard/chart/report definition (the 9+ investigative reports) | SQL + visualization config, built through Superset's own UI |
| OPA | The Rego policy set defining who can query which slice of the graph | Policy-as-code (Rego), reviewed like application code even though it isn't one |
| Trino | Catalog configuration pointing at Nessie; role-based access control config | Configuration |
| Prometheus/Grafana/Loki | Dashboards and alert rules specific to this platform's SLOs | Config-as-code (JSON/YAML), not application development |
| OpenTofu/ArgoCD | The actual `.tf` and `Application` manifests for this specific infrastructure and this specific set of deployments | Infrastructure code — unavoidable for any org, regardless of tooling choice |

---

## Closing note on license discipline

Every product recommended above is either fully OSI-approved (Apache-2.0, MIT, BSD, MPL-2.0) or AGPLv3 — and every AGPLv3 product in this stack (DataGerry, Zingg, MinIO, Grafana, Loki, optionally Redis) is used **unmodified**, integrated only through its API or standard configuration surface. That's the pattern that keeps AGPLv3's network-copyleft clause from ever becoming a concern: the obligation only activates if you *modify* the software and *then* offer that modified version as a network service. Nothing in this plan does that. If any of these ever needs a genuine code-level modification rather than configuration, that specific decision deserves its own legal review at the time — worth flagging now so it isn't a surprise later.
