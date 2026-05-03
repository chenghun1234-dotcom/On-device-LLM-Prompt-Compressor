# On-device LLM Prompt Compressor (Zero-Cost Architecture)

**Live Demo:** [https://prompt-compressor-api.chenghun1234.workers.dev](https://prompt-compressor-api.chenghun1234.workers.dev)

Optimizing LLM performance on mobile devices (Gemma, Llama) by reducing token count without losing semantic meaning.

## 🚀 Key Features
- **Budget Controller**: Prioritizes instructions while aggressively compressing context/examples.
- **Selective Pruning**: Uses TextRank and Entropy-based logic to strip redundancy.
- **Edge-Native**: Runs on Cloudflare Workers + Rust Wasm for zero latency and zero privacy risk.
- **Monetization Ready**: Pre-configured for RapidAPI.

## 🛠️ Architecture
- **Language**: Rust (Wasm)
- **Runtime**: Cloudflare Workers
- **Build**: GitHub Actions (CI/CD)

## 📦 Deployment
1. Set up your Cloudflare API Token in GitHub Secrets as `CLOUDFLARE_API_TOKEN`.
2. Push to `main` branch.
3. The GitHub Action will build the Wasm module and deploy to your Worker.

## 💰 Monetization
Register the `openapi.yaml` on [RapidAPI](https://rapidapi.com/hub) and start earning from on-device AI developers.
