# External Business Source Registry — File Tree

```text
docs/
└── external-business-sources/
    ├── README.md                  # Scope, evidence rules, operating flow
    ├── file-tree.md               # Registry file map
    ├── metadata-schema.json       # Canonical metadata contract
    ├── source-catalog.md          # External source categories and providers
    └── runbook.md                 # Discovery, review, onboarding and recovery
src/
└── routes/
    └── external-sources.tsx       # CEO-only source registry UI (Firecrawl discovery and metadata enrichment)
```

The Supabase table is the system of record; files document schema and operations. Do not commit API secrets, session tokens, personal account data, or private contact information.
