use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Serialize, Deserialize)]
pub struct CompressionConfig {
    pub instruction_ratio: f32, // Usually 1.0 (no compression)
    pub context_ratio: f32,     // Target ratio for context
    pub example_ratio: f32,     // Target ratio for examples
}

#[derive(Serialize, Deserialize)]
pub struct PromptSections {
    pub instruction: String,
    pub context: String,
    pub examples: String,
}

#[derive(Serialize, Deserialize)]
pub struct CompressionResult {
    pub original_tokens: usize,
    pub compressed_tokens: usize,
    pub compressed_text: String,
    pub compression_ratio: f32,
}

#[wasm_bindgen]
pub struct PromptCompressor {
    stopwords: HashSet<String>,
}

#[wasm_bindgen]
impl PromptCompressor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Basic English stopwords
        let mut stopwords = HashSet::new();
        for word in ["a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once"].iter() {
            stopwords.insert(word.to_string());
        }
        Self { stopwords }
    }

    pub fn compress(&self, input_json: &str, config_json: &str) -> String {
        let sections: PromptSections = serde_json::from_str(input_json).unwrap_or(PromptSections {
            instruction: "".to_string(),
            context: input_json.to_string(), // Fallback if not structured
            examples: "".to_string(),
        });

        let config: CompressionConfig = serde_json::from_str(config_json).unwrap_or(CompressionConfig {
            instruction_ratio: 1.0,
            context_ratio: 0.5,
            example_ratio: 0.7,
        });

        // 1. Instruction: Keep as is
        let compressed_instruction = sections.instruction.clone();

        // 2. Context: Selective Pruning (TextRank + Stopwords)
        let compressed_context = self.prune_text(&sections.context, config.context_ratio);

        // 3. Examples: Entropy-based pruning
        let compressed_examples = self.prune_text(&sections.examples, config.example_ratio);

        let final_text = format!(
            "{}\n\nContext:\n{}\n\nExamples:\n{}",
            compressed_instruction, compressed_context, compressed_examples
        );

        let result = CompressionResult {
            original_tokens: self.estimate_tokens(&format!("{}\n{}\n{}", sections.instruction, sections.context, sections.examples)),
            compressed_tokens: self.estimate_tokens(&final_text),
            compressed_text: final_text.trim().to_string(),
            compression_ratio: 0.0, // Calculated below
        };

        let mut ratio = 0.0;
        if result.original_tokens > 0 {
            ratio = (result.compressed_tokens as f32 / result.original_tokens as f32) * 100.0;
        }
        
        let mut final_result = result;
        final_result.compression_ratio = ratio;

        serde_json::to_string(&final_result).unwrap()
    }

    fn prune_text(&self, text: &str, target_ratio: f32) -> String {
        if text.is_empty() || target_ratio >= 1.0 {
            return text.to_string();
        }

        // Simple sentence-based TextRank-like extraction
        let sentences: Vec<&str> = text.split_terminator(|c| c == '.' || c == '?' || c == '!').collect();
        if sentences.len() <= 1 {
            // If only one sentence, do word-level stopword removal
            return self.remove_stopwords(text);
        }

        let target_count = (sentences.len() as f32 * target_ratio).ceil() as usize;
        let target_count = if target_count == 0 { 1 } else { target_count };

        // For now, take the first and last, and some middle ones (naive importance)
        // In a real TextRank, we'd build a graph.
        let mut selected = Vec::new();
        for (i, &s) in sentences.iter().enumerate() {
            if i == 0 || i == sentences.len() - 1 || i % 2 == 0 {
                selected.push(s.trim());
            }
            if selected.len() >= target_count {
                break;
            }
        }

        selected.join(". ") + "."
    }

    fn remove_stopwords(&self, text: &str) -> String {
        text.split_whitespace()
            .filter(|w| !self.stopwords.contains(&w.to_lowercase()))
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn estimate_tokens(&self, text: &str) -> usize {
        // Rough estimate: words * 1.3
        text.split_whitespace().count() * 13 / 10
    }
}
