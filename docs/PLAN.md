# PLAN: Gemini MCP Server Refactoring

## Current State ✅ COMPLETED
- ~~Podstawowa implementacja w `/home/jerzy/mcp/gemini-mcp-server/`~~
- ~~Kopia w `/home/jerzy/cursor/gemini-mcp-server/` (GitHub repo)~~
- ~~Przestarzałe API MCP SDK~~
- ~~Brak Zod validation~~
- ~~Folder `build/` (nie `dist/`)~~

## Target State ✅ ACHIEVED
- Nowoczesna implementacja zgodna z oficjalnymi wytycznymi Anthropic
- `McpServer` + `registerTool()` API
- Zod schemas dla wszystkich inputów
- Struktura `src/` → `dist/`
- Profesjonalny README

## Implementation Phases

### Phase 1: Project Structure Setup ✅
- [x] Zaktualizować `package.json` (nowoczesne zależności, scripts)
- [x] Zaktualizować `tsconfig.json` (outDir: dist/)
- [x] Zaktualizować `.gitignore` (dist/, node_modules/, .env)
- [x] Usunąć stary folder `build/`

### Phase 2: Core Implementation ✅
- [x] Przebudować `src/index.ts` z nowoczesnym API:
  - `McpServer` zamiast `Server`
  - `registerTool()` zamiast `setRequestHandler`
- [x] Dodać Zod schemas dla wszystkich tools
- [x] Dodać proper error handling
- [x] Dodać annotations (readOnlyHint, etc.)

### Phase 3: Tools Refactoring ✅
- [x] `gemini_generate` - podstawowe generowanie
- [x] `gemini_messages` - konwersacje strukturalne
- [x] `gemini_search` - web search z grounding
- [x] `gemini_youtube` - analiza YouTube

### Phase 4: Documentation ✅
- [x] Napisać profesjonalny README.md
  - Bez hardkodowanych ścieżek
  - Z przykładami konfiguracji
- [x] Dodać CLAUDE.md (project-specific instructions)
- [x] Utworzyć docs/ z CKM (PRD, PLAN, TECH)

### Phase 5: Testing & Deployment ✅
- [x] `npm run build` - weryfikacja kompilacji
- [ ] Test każdego toola w Claude Code (do zrobienia manualnie)
- [x] Commit i push do GitHub
- [ ] Aktualizacja konfiguracji w `/home/jerzy/mcp/` (opcjonalnie)

## Dependencies (Actual)
- `@modelcontextprotocol/sdk` ^1.13.3
- `@google/genai` ^1.30.0
- `zod` ^3.24.1
- `tsx` ^4.19.2 (dev dependency)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking changes w MCP SDK | Użyto wersji 1.13.3 (najnowsza) |
| Gemini API changes | Używamy oficjalnego @google/genai SDK |
| Stary kod w /mcp/ przestanie działać | Pozostawiony jako fallback |

## Timeline
- **Estimated:** 1-2 sesje robocze
- **Actual:** 1 sesja
- **Status:** ✅ COMPLETED

---
*Last Updated: 2025-11-25*
