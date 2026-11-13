// Project cards for the Projects slider.
// Sources: Rohan_Kolla_Resume_Billtrust.pdf and Rohan_Kolla_Projects.pdf only; no invented metrics.
// (Write-ups the projects file marks "draft, check before using" are left out.)
// `metric` is optional: leave it out when there is no verified number yet.

export const projects = [
    {
        id: 'huskyswap',
        title: 'HuskySwap Text-to-SQL Agent',
        kind: 'LLM distillation',
        context: 'Independent',
        summary:
            'A Northeastern-only marketplace with 200+ users, plus an AI agent that answers plain-English questions about its data. Distilled a 120B teacher into a 4B model that refuses unsafe requests and asks before guessing, released through CI/CD eval gates with canary routing and drift checks.',
        metric: { value: '56.4% → 75.9%', label: 'held-out accuracy, 2× faster, 54% fewer tokens' },
        tags: ['Qwen3-4B', 'LoRA', 'vLLM', 'Next.js', 'Supabase', 'GitHub Actions']
    },
    {
        id: 'brief-to-blueprint',
        title: 'Brief to Blueprint',
        kind: 'AI agents',
        context: 'CREWASIS',
        summary:
            "The client-facing agent that started the company's shift to agentic AI. It asks clarifying questions, recommends which of 19 analysis models to run and why, and answers follow-ups; A/B tests with users picked the version that shipped.",
        metric: { value: '20+', label: 'briefs from global consumer brands and pharma clients' },
        tags: ['LLM agents', 'A/B testing', 'Structured outputs']
    },
    {
        id: 'srr',
        title: 'Systematic Review Engine',
        kind: 'LLM pipeline',
        context: 'CREWASIS',
        summary:
            'A FastAPI service that turns unstructured scientific papers into a cited, auditable evidence matrix, using hybrid retrieval over 40K+ passages and an LLM relevance classifier at 96% precision. Demoed to pharma client executives.',
        metric: { value: '13×', label: 'more papers captured by a 7-stage full-text fallback' },
        tags: ['FastAPI', 'Hybrid retrieval', 'LLM classifier']
    },
    {
        id: 'football',
        title: 'Football Possession Analytics',
        kind: 'Computer vision',
        context: 'FC Barcelona hackathon',
        summary:
            'Tracks which team has the ball in every frame of a LaLiga match (199K frames) with an HMM that also detects out-of-play, and recovers lost ball positions with YOLOv8 and a Kalman filter, lifting ball coverage from 59% to 85%.',
        metric: { value: '0.24 → 0.57', label: 'possession F1 vs the official baseline' },
        tags: ['PyTorch', 'YOLOv8', 'OpenCV', 'Kalman filter', 'HMMs']
    },
    {
        id: 'transitwise',
        title: 'TransitWise Boston',
        kind: 'Agents + data',
        context: '2026',
        summary:
            'An AI trip planner for wheelchair users. Checked 10,100 trips against live alerts, found 6,242 wrongly marked safe and fixed them; a five-agent planner on a Snowflake warehouse refreshed every 30 minutes passes all 26 evaluation scenarios.',
        metric: { value: '−53%', label: 'false elevator alarms' },
        tags: ['Snowflake', 'networkx', 'Claude API', 'MCP', 'Streamlit']
    },
    {
        id: 'hr-rag',
        title: 'HR Analytics Agentic RAG',
        kind: 'Agentic RAG',
        context: 'Workhuman capstone',
        summary:
            'An AI chatbot for an external HR client that answers people-analytics questions, routing across six routes to five tools over ChromaDB vector search and a Neo4j knowledge graph. Evaluated with RAGAS (faithfulness 0.833).',
        metric: { value: '69% → 96%', label: 'answer accuracy, LLM judge validated against human labels' },
        tags: ['FastAPI', 'React', 'ChromaDB', 'Neo4j', 'RAGAS', 'LangSmith']
    },
    {
        id: 'modcascade',
        title: 'ModCascade',
        kind: 'Content moderation',
        context: '2026',
        summary:
            'Two-tier moderation over 1.53M Quora and Jigsaw posts: DeBERTa-v3 resolves 88% and a policy-citing agent handles the rest. Reported a failed pre-registered test alongside the results.',
        metric: { value: '8×', label: 'lower cost than agent-only, with higher recall (61% vs 57%)' },
        tags: ['DeBERTa-v3', 'LangGraph', 'vLLM', 'Qdrant', 'MLflow']
    },
    {
        id: 'clip-gpt2',
        title: 'Multimodal Image Captioning',
        kind: 'Vision-language',
        context: '2026',
        summary:
            'A CLIP vision encoder paired with a GPT-2 language decoder and LoRA fine-tuned on COCO, outperforming pretrained BLIP.',
        metric: { value: '0.7668', label: 'CIDEr score' },
        tags: ['CLIP', 'GPT-2', 'LoRA', 'COCO']
    },
    {
        id: 'financial-rag',
        title: 'Financial Document RAG',
        kind: 'RAG',
        context: '2025–26',
        summary:
            'Retrieval-augmented generation over 50K+ SEC filings with LangGraph, ChromaDB and GPT-4o, serving real-time queries through FastAPI and deployed on AWS ECS with Docker and CI/CD.',
        metric: { value: '91%', label: 'accuracy on all benchmarks' },
        tags: ['LangGraph', 'ChromaDB', 'GPT-4o', 'AWS ECS', 'Docker']
    },
    {
        id: 'prompt-eval',
        title: 'Prompt Engineering Evaluation Platform',
        kind: 'LLM evaluation',
        context: '2025–26',
        summary:
            'Benchmarks prompt templates across GPT-4 and open-source models on reasoning, summarization and Q&A, with LangGraph multi-agent workflows and reproducible MLflow experiments.',
        metric: { value: '−27%', label: 'hallucination across 500+ evaluation tasks' },
        tags: ['LangGraph', 'MLflow', 'Docker']
    },
    {
        id: 'vlm-pipeline',
        title: 'Vision-Language Pipeline',
        kind: 'GenAI',
        context: 'Random Trees',
        summary:
            'A production vision-language pipeline scoped with stakeholders and reported through dashboards, with LLaVA and TensorFlow Lite models optimized for on-device inference.',
        metric: { value: '60%', label: 'less manual work' },
        tags: ['LLaVA', 'TF Lite', 'TensorFlow']
    },
    {
        id: 'protein',
        title: 'Protein Function Prediction',
        kind: 'Deep learning',
        context: '2025',
        summary:
            'A custom PyTorch CNN classifying 270K+ protein sequences into 7 enzyme classes under class imbalance, served through FastAPI with input validation and batch inference.',
        metric: { value: '96.09%', label: 'accuracy, 1,000+ sequences/min' },
        tags: ['PyTorch', 'CNN', 'FastAPI']
    },
    {
        id: 'restaurant',
        title: 'Restaurant Recommender',
        kind: 'Recommender systems',
        context: '2025',
        summary:
            'Recommendations over 100K+ restaurants and millions of user reviews, benchmarking NeuMF, transformer-based and hybrid models with NLP feature engineering.',
        metric: { value: '+40%', label: 'Precision@10 over baseline' },
        tags: ['NeuMF', 'Transformers', 'NLP']
    },
    {
        id: 'malware',
        title: 'Malware Analysis',
        kind: 'Security ML',
        context: 'Academic',
        summary:
            'A CNN-LSTM over API-call sequences for behavioural malware classification, benchmarked against KNN, decision tree, naive Bayes and MLP classifiers.',
        metric: { value: '98.91%', label: 'accuracy (CNN-LSTM)' },
        tags: ['CNN-LSTM', 'KNN', 'Naive Bayes']
    },
    {
        id: 'nas',
        title: 'Neural Architecture Search',
        kind: 'AutoML',
        context: 'Academic',
        summary:
            'Automated neural network design with particle swarm optimization, differential evolution and genetic algorithms, finding networks that were both more accurate and smaller.',
        metric: { value: '+25%', label: 'accuracy with 40% fewer parameters' },
        tags: ['PSO', 'Differential evolution', 'Genetic algorithms']
    }
];
