# Analiza: Generowanie obrazów w Gemini API (Nano Banana)

> **Data analizy:** Grudzień 2025
> **Cel:** Rozszerzenie gemini-mcp-server o funkcje text-to-image i image-to-image

---

## Dostępne modele obrazów

### Gemini "Nano Banana" (Preview)

| Model | Kodowa nazwa | Opis |
|-------|--------------|------|
| `gemini-2.5-flash-image-preview` | **Nano Banana** | Szybkie generowanie obrazów |
| `gemini-3-pro-image-preview` | **Nano Banana Pro** | Reasoning + generowanie + edycja |

### Imagen 4 (Production)

| Model | Opis | Cena |
|-------|------|------|
| `imagen-4.0-generate-001` | Standard | $0.04/obraz |
| `imagen-4.0-ultra-generate-001` | Ultra (lepsza zgodność z promptem) | $0.06/obraz |
| `imagen-4.0-fast-generate-001` | Fast (10x szybszy) | $0.04/obraz |

---

## Porównanie podejść

| Cecha | Imagen 4 | Nano Banana Pro |
|-------|----------|-----------------|
| **Metoda API** | `ai.models.generateImages()` | `ai.interactions.create()` |
| **Podejście** | Czysta jakość obrazu | Reasoning + generowanie |
| **Text-to-image** | ✅ | ✅ |
| **Image-to-image** | ❌ | ✅ |
| **Multi-turn edycja** | ❌ | ✅ Konwersacyjna |
| **Character consistency** | ❌ | ✅ Do 14 obrazów ref. |
| **Google Search grounding** | ❌ | ✅ Weryfikacja faktów |
| **Szybkość** | Fast 10x szybszy | Umiarkowana |

---

## Wybrana strategia: Nano Banana Pro

**Uzasadnienie:**
- Pełne możliwości image-to-image
- Konwersacyjna edycja (iteracyjne poprawki)
- Reasoning przed generowaniem (lepsze zrozumienie promptu)
- Character consistency dla serii obrazów

---

## Planowane narzędzia MCP

### 1. `gemini_image_generate`

**Cel:** Text-to-image generation

**Parametry:**
- `prompt` (string, required) - Opis obrazu do wygenerowania
- `model` (string, optional) - Model do użycia (default: gemini-3-pro-image-preview)
- `aspect_ratio` (string, optional) - Proporcje: "1:1", "16:9", "9:16", "4:3", "3:4"
- `style` (string, optional) - Styl: "photorealistic", "artistic", "anime", etc.

**Przykład użycia:**
```typescript
const result = await ai.interactions.create({
    model: 'gemini-3-pro-image-preview',
    input: 'Futurystyczne miasto o zachodzie słońca, styl cyberpunk',
    response_modalities: ['image']
});
```

### 2. `gemini_image_edit`

**Cel:** Image-to-image transformation i edycja

**Parametry:**
- `prompt` (string, required) - Instrukcja edycji/transformacji
- `image` (string, required) - Base64-encoded obraz źródłowy
- `model` (string, optional) - Model do użycia
- `preserve_style` (boolean, optional) - Zachowaj oryginalny styl

**Przykład użycia:**
```typescript
const result = await ai.interactions.create({
    model: 'gemini-3-pro-image-preview',
    input: [
        { type: 'text', text: 'Przekształć to zdjęcie w styl akwareli' },
        { type: 'image', data: base64Image, mime_type: 'image/png' }
    ],
    response_modalities: ['image']
});
```

---

## Wymagania techniczne

### Aktualizacja SDK

```json
// package.json
"dependencies": {
  "@google/genai": "^1.34.0"  // obecnie: ^1.30.0
}
```

### Format odpowiedzi MCP

Obrazy będą zwracane jako:
- Base64-encoded data w content
- Mime type (image/png lub image/jpeg)
- Opcjonalnie: zapis do pliku lokalnego

---

## Źródła

1. [Google AI - Image generation with Gemini](https://ai.google.dev/gemini-api/docs/image-generation)
2. [Google AI - Generate images using Imagen](https://ai.google.dev/gemini-api/docs/imagen)
3. [Google Developers Blog - Imagen 4](https://developers.googleblog.com/en/imagen-4-now-available-in-the-gemini-api-and-google-ai-studio/)
4. [npm - @google/genai](https://www.npmjs.com/package/@google/genai)

---

## Status

- [x] Analiza możliwości API
- [x] Wybór strategii (Nano Banana Pro)
- [ ] Aktualizacja SDK do 1.34.0
- [ ] Implementacja `gemini_image_generate`
- [ ] Implementacja `gemini_image_edit`
- [ ] Testy
- [ ] Dokumentacja README
