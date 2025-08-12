# Plan a detail excute according to $ARGUMENTS

## Target
- Provide a complete, actionable, and rollback-ready plan according to $ARGUMENTS, ensuring all path, dependency, and system impacts are identified and controlled.
- Ask user if required to write a detail planning base on $ARGUMENTS (ask for saving path)

## Scope
- Covers frontend/backend code, configs, SQL/migrations, RLS/permissions, Edge Functions, GraphQL/REST, CI/CD, monitoring, and rollback

## Must use agent for analysising

### Development Specialists
- Backend
   - [backend-architect](.claude/agents/backend-architect.md)
   - [golang-pro](.claude/agents/golang-pro.md)
   - [python-pro](.claude/agents/python-pro.md)
   - [java-pro](.claude/agents/java-pro.md)

- Frontend
   - [frontend-developer](frontend-developer.md)
   - [ui-ux-designer](ui-ux-designer.md)
   - [typescript-pro](typescript-pro.md)

- Mobile
   - [mobile-developer](mobile-developer.md)
   - [ios-developer](ios-developer.md)
   - [unity-developer](unity-developer.md)

- Database
   - [database-optimizer](database-optimizer.md)
   - [database-admin](database-admin.md)
   - [sql-pro](sql-pro.md)

### Infrastructure & Operations
- Cloud
   - [cloud-architect](cloud-architect.md)
   - [terraform-specialist](terraform-specialist.md)
   - [deployment-engineer](deployment-engineer.md)
- DevOps
   - [devops-troubleshooter](devops-troubleshooter.md)
   - [incident-responder](incident-responder.md)
   - [network-engineer](network-engineer.md)
- Performance
   - [performance-engineer](performance-engineer.md)
   - [dx-optimizer](dx-optimizer.md)

### Quality & Security
- Review
   - [code-reviewer](code-reviewer.md)
   - [architect-reviewer](architect-review.md)
   - [security-auditor](security-auditor.md)
- Testing
   - [test-automator](test-automator.md)
   - [debugger](debugger.md)
   - [error-detective](error-detective.md)
- Documentation
   - [docs-architect](docs-architect.md)
   - [reference-builder](reference-builder.md)
   - [tutorial-engineer](tutorial-engineer.md)

### Specialized Domains
- AI/ML
   - [ai-engineer](ai-engineer.md)
   - [ml-engineer](ml-engineer.md)
   - [mlops-engineer](mlops-engineer.md)
   - [prompt-engineer](prompt-engineer.md)
- Business
   - [business-analyst](business-analyst.md)
   - [content-marketer](content-marketer.md)
   - [sales-automator](sales-automator.md)
- Finance
   - [quant-analyst](quant-analyst.md)
   - [risk-manager](risk-manager.md)
   - [payment-integration](payment-integration.md)

### 🎯 核心規劃團隊
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| [Architecg-Review](.claude/agents/architect-review.md) | 架構一致性檢查 | 整體架構評估、SOLID原則審查、依賴關係分析 |
| [Context Manager](.claude/agents/context-manager.md) | 跨agent協調 | 管理多agent工作流程、保存關鍵決策、維護項目context |
| **backend-architect** | 後端架構設計 | API設計、微服務邊界、數據庫schema規劃 |

### 📊 Impact Analysis 階段
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| **error-detective** | 日誌分析 | 搜尋現有error patterns、識別潛在問題區域 |
| **database-optimizer** | 數據層分析 | 分析table/index/view依賴、評估查詢影響 |
| **frontend-developer** | 前端影響分析 | 識別受影響嘅React components、cache層評估 |
| **graphql-architect** | API影響分析 | GraphQL schema依賴、resolver影響評估 |
| **security-auditor** | 安全風險評估 | RLS/Policies審查、權限影響分析、OWASP合規檢查 |

### 🔧 Solution Design 階段
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| **sql-pro** | 數據庫設計 | 撰寫migration scripts、設計indexes、優化查詢 |
| **database-admin** | 數據庫運維 | Backup策略、replication設置、災難恢復計劃 |
| **api-documenter** | API文檔 | OpenAPI規格更新、breaking changes文檔 |
| **terraform-specialist** | 基礎設施 | IaC配置更新、環境變數管理 |
| **cloud-architect** | 雲端架構 | Auto-scaling策略、multi-region部署規劃 |

### 📝 Implementation Support
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| **deployment-engineer** | 部署策略 | CI/CD pipeline更新、rollback程序設計 |
| **test-automator** | 測試計劃 | Unit/integration/e2e測試設計、test coverage分析 |
| **performance-engineer** | 性能評估 | Load testing計劃、性能基準測試、bottleneck分析 |
| **legacy-modernizer** | 遺留系統處理 | 向後兼容策略、漸進式遷移計劃 |

### 🚨 Risk Management
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| **incident-responder** | 應急響應 | Rollback程序設計、incident runbook準備 |
| **devops-troubleshooter** | 故障排查 | Monitoring設置、alert配置、log aggregation |
| **network-engineer** | 網絡層面 | DNS/CDN影響、load balancer配置更新 |
| **code-reviewer** | 配置安全審查 | Configuration changes審查、magic numbers檢測 |

### 📚 Documentation & Communication
| Agent | 職責範圍 | 負責部份 |
|-------|---------|----------|
| **docs-architect** | 技術文檔 | 詳細技術文檔撰寫、架構決策記錄 |
| **tutorial-engineer** | 教學文檔 | Migration guide、team onboarding材料 |
| **business-analyst** | 業務影響 | KPI影響分析、stakeholder報告準備 |

### 🔄 Agent協作流程
1. **Impact Analysis**: `error-detective` → `database-optimizer` → `security-auditor` → `architect-reviewer`
2. **Solution Design**: `backend-architect` → `sql-pro` → `api-documenter` → `cloud-architect`
3. **Implementation**: `deployment-engineer` → `test-automator` → `performance-engineer`
4. **Review & Validation**: `code-reviewer` → `security-auditor` → `incident-responder`


## Workflow
0. Assign sub-agents and ultrathink
1. Impact Analysis
    - Dependencies (Direct & Indirect)
        - Inbound (who depends on $ARGUMENTS): Components / Routes / APIs / Jobs / Edge Functions
        - Outbound (what $ARGUMENTS depends on): Libraries / env variables / secrets / external services (S3, Payments, SMTP…)
        - Data Layer: Tables / Indexes / Views / Functions / Triggers / RLS / Policies (read/write/delete)
        - Frontend: Pages, client hooks, GraphQL/REST queries, cache layers (React Query / Redis)
        - Configuration: .env, build flags, feature flags
    - Risk & Impact Matrix
        - `Description`
        - `Potential Impact`
        - `Mitigation`
        - `Rollback Trigger`

2. Solution Design
    - Change Strategy
        - Approach: Replace / Refactor / Decommission / Split / Migrate
        - Principles: KISS, minimal intrusion, rollback-capable, backward compatibility (if needed)
        - Fallback: Adaptor layer, deprecation notice, compatible API
    - Database & Security
        - SQL/Migrations: New tables/columns/indexes/constraints (attach migration file paths)
        - RLS/Policies: Added/modified/removed (include test cases)
        - Seeding/Batch Jobs: Backfill or data fixes, scripts, validation steps
        - Transactions & Locks: Large table ops batched/off-peak, avoid lock contention
    - Interface & Compatibility
        - REST/GraphQL Contract Changes: Type/field/error code/non-breaking change list
        - Frontend Impact: UI behavior, loading/error states, cache invalidation
        - Edge Functions / Webhooks: Payload changes, signature verification

3. File/Path Change List
    - Must list all affected files/paths, with reason and relation.

    ‘‘‘(example)
    /app/(app)/admin/cards/...                # Add: New Card System component
    /src/lib/$ARGUMENTS.ts                    # Remove: Legacy util replaced by /src/lib/new-...
    /supabase/migrations/20250809_xxx.sql     # Add: Index + column migration
    /supabase/policies/order_read_rls.sql     # Modify: Adjust RLS
    .env.example                              # Add: FEATURE_FLAG_$ARGUMENTS
    ‘‘‘(etc)

4. Checklists
    - [ ] Dependency & impact analysis reviewed
    - [ ] Risk matrix & rollback plan
    - [ ] File/path change list complete
    - [ ] Test plan & monitoring plan ready