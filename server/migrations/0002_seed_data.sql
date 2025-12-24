-- Index.ai Seed Data
-- Migration: 0002_seed_data

-- Insert channels
INSERT INTO channels (id, name, slug, description) VALUES
  ('ch-programming-ai', 'Programming & AI', 'programming-ai', 'Model architectures, engineering practices, and toolchains'),
  ('ch-travel', 'Global Travel', 'travel', 'Visa policies, travel guides, and destination insights'),
  ('ch-fitness', 'Hardcore Fitness', 'fitness', 'Training protocols, nutrition science, and biomechanics'),
  ('ch-nutrition', 'Clean Eating', 'nutrition', 'Research reviews, ingredient analysis, and healthy recipes');

-- Insert collections for Programming & AI
INSERT INTO collections (id, channel_id, title, slug, by, type, visibility, source_count, vector_namespace, summary) VALUES
  ('col-deepseek', 'ch-programming-ai', 'DeepSeek Technical Papers', 'deepseek-papers', 'Index.ai', 'official', 'public', 14, 'prog-ai_deepseek', 'Complete collection of DeepSeek technical papers including DeepSeek-V3, MoE architecture, and training methodologies.'),
  ('col-claude', 'ch-programming-ai', 'Claude Technical Archive', 'claude-archive', 'Index.ai', 'official', 'public', 23, 'prog-ai_claude', 'Official Anthropic publications on Claude, constitutional AI, and safety research.'),
  ('col-rag', 'ch-programming-ai', 'RAG Implementation Guide', 'rag-guide', 'Index.ai', 'official', 'public', 31, 'prog-ai_rag', 'Comprehensive guide to building production RAG systems with best practices.'),
  ('col-prompt', 'ch-programming-ai', 'Prompt Engineering Patterns', 'prompt-patterns', 'Index.ai', 'official', 'public', 18, 'prog-ai_prompt', 'Effective prompting techniques and patterns for LLM applications.');

-- Insert collections for Travel
INSERT INTO collections (id, channel_id, title, slug, by, type, visibility, source_count, vector_namespace, summary) VALUES
  ('col-sea-nomad', 'ch-travel', 'Southeast Asia Digital Nomad Guide', 'sea-nomad', 'Index.ai', 'official', 'public', 42, 'travel_sea-nomad', 'Visa policies, co-working spaces, and living costs across Thailand, Vietnam, Indonesia, and more.'),
  ('col-schengen', 'ch-travel', 'Schengen Visa Archive', 'schengen-visa', 'Index.ai', 'official', 'public', 28, 'travel_schengen', 'Complete guide to Schengen visa applications and requirements.'),
  ('col-japan', 'ch-travel', 'Japan Long-term Visa Guide', 'japan-visa', 'Index.ai', 'official', 'public', 19, 'travel_japan', 'Work visas, digital nomad visas, and long-term stay options in Japan.');

-- Insert collections for Fitness
INSERT INTO collections (id, channel_id, title, slug, by, type, visibility, source_count, vector_namespace, summary) VALUES
  ('col-strength', 'ch-fitness', 'Strength Training Science', 'strength-science', 'Index.ai', 'official', 'public', 36, 'fitness_strength', 'Evidence-based strength training principles from PubMed and NSCA.'),
  ('col-hypertrophy', 'ch-fitness', 'Hypertrophy Research Review', 'hypertrophy-research', 'Index.ai', 'official', 'public', 24, 'fitness_hypertrophy', 'Latest research on muscle growth and training optimization.'),
  ('col-recovery', 'ch-fitness', 'Nutrition & Recovery', 'nutrition-recovery', 'Index.ai', 'official', 'public', 21, 'fitness_recovery', 'Sleep, nutrition, and recovery protocols for athletes.');

-- Insert collections for Nutrition
INSERT INTO collections (id, channel_id, title, slug, by, type, visibility, source_count, vector_namespace, summary) VALUES
  ('col-additives', 'ch-nutrition', 'Food Additives Archive', 'food-additives', 'Index.ai', 'official', 'public', 45, 'nutrition_additives', 'FDA and EFSA evaluations of common food additives and their safety profiles.'),
  ('col-ingredients', 'ch-nutrition', 'Ingredient Analysis', 'ingredient-analysis', 'Index.ai', 'official', 'public', 32, 'nutrition_ingredients', 'Deep dives into common ingredients and their health effects.'),
  ('col-recipes', 'ch-nutrition', 'Healthy Recipe Collection', 'healthy-recipes', 'Index.ai', 'official', 'public', 58, 'nutrition_recipes', 'Nutritionist-approved recipes with detailed macro breakdowns.');

-- Insert sample documents for DeepSeek collection
INSERT INTO documents (id, collection_id, title, source_type, source_url, summary, chunk_count, token_count, status) VALUES
  ('doc-deepseek-v3', 'col-deepseek', 'DeepSeek-V3 Technical Report', 'pdf', 'https://arxiv.org/abs/2412.19437', 'Technical report on DeepSeek-V3, a Mixture-of-Experts model with 671B total parameters.', 45, 28000, 'completed'),
  ('doc-deepseek-moe', 'col-deepseek', 'DeepSeek MoE Architecture', 'pdf', 'https://arxiv.org/abs/2401.02954', 'Detailed analysis of the DeepSeek MoE architecture and training methodology.', 32, 19500, 'completed'),
  ('doc-deepseek-coder', 'col-deepseek', 'DeepSeek Coder v2', 'pdf', 'https://arxiv.org/abs/2406.11931', 'Code-focused model with improved performance on programming tasks.', 28, 16800, 'completed');
