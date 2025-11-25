# PLAN: Gemini MCP Server Refactoring

## Current State
- Podstawowa implementacja w `/home/jerzy/mcp/gemini-mcp-server/`
- Kopia w `/home/jerzy/cursor/gemini-mcp-server/` (GitHub repo)
- Przestarzałe API MCP SDK
- Brak Zod validation
- Folder `build/` (nie `dist/`)

## Target State
- Nowoczesna implementacja zgodna z oficjalnymi wytycznymi Anthropic
- `McpServer` + `registerTool()` API
- Zod schemas dla wszystkich inputów
- Struktura `src/` → `dist/`
- Profesjonalny README

## Implementation Phases

### Phase 1: Project Structure Setup
- [ ] Zaktualizować `package.json` (nowoczesne zależności, scripts)
- [ ] Zaktualizować `tsconfig.json` (outDir: dist/)
- [ ] Zaktualizować `.gitignore` (dist/, node_modules/, .env)
- [ ] Usunąć stary folder `build/`

### Phase 2: Core Implementation
- [ ] Przebudować `src/index.ts` z nowoczesnym API:
  - `McpServer` zamiast `Server`
  - `registerTool()` zamiast `setRequestHandler`
- [ ] Dodać Zod schemas dla wszystkich tools
- [ ] Dodać proper error handling
- [ ] Dodać annotations (readOnlyHint, etc.)

### Phase 3: Tools Refactoring
- [ ] `gemini_generate` - podstawowe generowanie
- [ ] `gemini_messages` - konwersacje strukturalne
- [ ] `gemini_search` - web search z grounding
- [ ] `gemini_youtube` - analiza YouTube

### Phase 4: Documentation
- [ ] Napisać profesjonalny README.md
  - Bez hardkodowanych ścieżek
  - Z przykładami konfiguracji
  - Z troubleshooting
- [ ] Dodać CLAUDE.md (project-specific instructions)

### Phase 5: Testing & Deployment
- [ ] `npm run build` - weryfikacja kompilacji
- [ ] Test każdego toola w Claude Code
- [ ] Commit i push do GitHub
- [ ] Aktualizacja konfiguracji w `/home/jerzy/mcp/` (opcjonalnie)

## Dependencies
- `@modelcontextprotocol/sdk` ^1.6.1+
- `zod` ^3.23.8
- `axios` (dla API calls)
- `tsx` (dev dependency)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking changes w MCP SDK | Użyć dokładnie wersji z oficjalnych wytycznych |
| Gemini API changes | Izolować API client w osobnym module |
| Stary kod w /mcp/ przestanie działać | Pozostawić jako fallback do czasu pełnego testu |

## Timeline
- **Estimated:** 1-2 sesje robocze
- **Priority:** High (backup system zależy od tego)

---
*Last Updated: 2025-11-25*
