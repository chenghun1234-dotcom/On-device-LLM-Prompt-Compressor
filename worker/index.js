import init, { PromptCompressor } from './pkg/prompt_compressor.js';
import wasm from './pkg/prompt_compressor_bg.wasm';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/compress' && request.method === 'POST') {
      return handleCompress(request, env);
    }

    // Serve documentation/landing page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveLandingPage();
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleCompress(request, env) {
  try {
    const body = await request.json();
    const { instruction, context, examples, config } = body;

    // Load Wasm
    await init(wasm);
    const compressor = new PromptCompressor();

    const input = JSON.stringify({ instruction, context, examples });
    const configStr = JSON.stringify(config || {
      instruction_ratio: 1.0,
      context_ratio: 0.5,
      example_ratio: 0.7
    });

    const resultStr = compressor.compress(input, configStr);
    const result = JSON.parse(resultStr);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function serveLandingPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Compressor | On-device LLM Optimizer</title>
    <style>
        :root {
            --primary: #6366f1;
            --bg: #0f172a;
            --glass: rgba(30, 41, 59, 0.7);
            --border: rgba(255, 255, 255, 0.1);
        }
        body {
            background: var(--bg);
            color: #f8fafc;
            font-family: 'Inter', sans-serif;
            margin: 0;
            overflow-x: hidden;
        }
        .hero {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top right, #1e293b, #0f172a);
        }
        .glass-panel {
            background: var(--glass);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 3rem;
            max-width: 800px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            font-size: 1.25rem;
            color: #94a3b8;
            line-height: 1.6;
        }
        .cta {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
        }
        .btn {
            padding: 0.75rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
        }
        .btn-primary {
            background: var(--primary);
            color: white;
            border: none;
        }
        .btn-outline {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
        }
        .features {
            padding: 5rem 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .feature-card {
            background: var(--glass);
            padding: 2rem;
            border-radius: 20px;
            border: 1px solid var(--border);
        }
        .feature-card h3 {
            color: #818cf8;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="glass-panel">
            <h1>On-device LLM Prompt Compressor</h1>
            <p>Optimize your prompts for mobile LLMs. Reduce tokens by 30-50% while preserving semantic core. Zero-cost edge processing via Wasm.</p>
            <div class="cta">
                <a href="#demo" class="btn btn-primary">Try Demo</a>
                <a href="https://rapidapi.com" class="btn btn-outline">RapidAPI Docs</a>
            </div>
        </div>
    </div>
    
    <div class="features">
        <div class="feature-card">
            <h3>Budget Control</h3>
            <p>Separate instruction, context, and examples. Apply precise compression ratios to non-critical sections.</p>
        </div>
        <div class="feature-card">
            <h3>Semantic Pruning</h3>
            <p>TextRank and Entropy-based algorithms identify and retain the most informative content.</p>
        </div>
        <div class="feature-card">
            <h3>Zero Latency</h3>
            <p>Processed at the edge via Cloudflare Workers. 10x faster than traditional LLM-based compression.</p>
        </div>
    </div>

    <section id="demo" style="padding: 5rem 2rem; max-width: 1000px; margin: 0 auto;">
        <h2 style="text-align: center; margin-bottom: 3rem;">Live Compressor Demo</h2>
        <div class="glass-panel" style="max-width: 100%;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <label>Original Prompt</label>
                    <textarea id="input" style="width: 100%; height: 300px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 12px; padding: 1rem; margin-top: 0.5rem;"></textarea>
                </div>
                <div>
                    <label>Compressed Output</label>
                    <div id="output" style="width: 100%; height: 300px; background: #1e293b; border: 1px solid #334155; color: #818cf8; border-radius: 12px; padding: 1rem; margin-top: 0.5rem; overflow-y: auto; white-space: pre-wrap;"></div>
                </div>
            </div>
            <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center;">
                <div id="stats" style="color: #94a3b8;">
                    Original: 0 tokens | Compressed: 0 tokens (0%)
                </div>
                <button onclick="compress()" class="btn btn-primary">Compress Now</button>
            </div>
        </div>
    </section>

    <script>
        async function compress() {
            const text = document.getElementById('input').value;
            const output = document.getElementById('output');
            const stats = document.getElementById('stats');
            
            if(!text) return;

            output.innerText = "Processing...";
            
            try {
                const response = await fetch('/api/compress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instruction: "Summarize the following:",
                        context: text,
                        examples: "",
                        config: { context_ratio: 0.5 }
                    })
                });
                
                const data = await response.json();
                if(data.success) {
                    output.innerText = data.compressed_text;
                    stats.innerText = \`Original: \${data.original_tokens} tokens | Compressed: \${data.compressed_tokens} tokens (\${data.compression_ratio.toFixed(1)}%)\`;
                } else {
                    output.innerText = "Error: " + data.error;
                }
            } catch (e) {
                output.innerText = "Error: " + e.message;
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
