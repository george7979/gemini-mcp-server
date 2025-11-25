# PRD: Gemini MCP Server

## Project Overview
**Name:** gemini-mcp-server
**Type:** MCP (Model Context Protocol) Server
**Status:** Development
**Repository:** https://github.com/george7979/gemini-mcp-server (private)

## Problem Statement
Potrzebujemy profesjonalnego, łatwego do instalacji serwera MCP, który integruje Google Gemini AI z Claude Code. Obecna implementacja:
- Używa przestarzałego API MCP SDK
- Brak walidacji inputów (Zod)
- Hardkodowane ścieżki w dokumentacji
- Wymaga ręcznego buildu po klonowaniu

## Goals
1. **Profesjonalny projekt** gotowy do instalacji na dowolnej maszynie
2. **Zgodność z oficjalnymi wytycznymi** Anthropic (skill mcp-builder)
3. **Łatwa instalacja**: `git clone` → `npm install` → skonfiguruj → działa
4. **Nowoczesne API**: `McpServer` + `registerTool()` zamiast przestarzałych metod

## Features

### Core Tools
| Tool | Opis | Status |
|------|------|--------|
| `gemini_generate` | Proste generowanie tekstu z promptem | Do przebudowy |
| `gemini_messages` | Konwersacje strukturalne | Do przebudowy |
| `gemini_search` | Web search z Google Search grounding | Do przebudowy |
| `gemini_youtube` | Analiza wideo YouTube | Do przebudowy |

### Non-Functional Requirements
- TypeScript z nowoczesnym MCP SDK
- Zod schemas do walidacji inputów
- Profesjonalny README z instrukcją instalacji
- Obsługa błędów z actionable messages
- Development workflow z `tsx watch`

## Success Criteria
- [ ] Projekt zgodny z oficjalnymi wytycznymi MCP (skill mcp-builder)
- [ ] `npm run build` kompiluje bez błędów
- [ ] Wszystkie 4 toole działają poprawnie
- [ ] README zawiera kompletną instrukcję instalacji (bez hardkodowanych ścieżek)
- [ ] Projekt można zainstalować na czystej maszynie w <5 minut

## Out of Scope
- Publikacja na npm (może w przyszłości)
- HTTP transport (na razie tylko stdio)
- Automatyczne testy (może w przyszłości)

## Stakeholders
- **Owner:** jerzy
- **Users:** Użytkownicy Claude Code chcący integracji z Gemini

---
*Last Updated: 2025-11-25*
