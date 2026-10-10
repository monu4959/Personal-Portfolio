// Project cards for the Projects slider.
// Sources: Rohan_Resume.pdf and rohan-ai-ml-portfolio.pdf only; no invented metrics.
// `metric` is optional: leave it out when there is no verified number yet.

export const projects = [
    {
        id: 'huskyswap',
        title: 'HuskySwap Text-to-SQL Agent',
        kind: 'LLMOps',
        context: 'Independent',
        summary:
            'Distilled a 120B-parameter teacher into a self-hosted Qwen3-4B agent that answers plain-English analytics questions for a Northeastern student marketplace, with CI release gates, canary rollout and drift-triggered retraining.',
        metric: { value: '87.4%', label: 'execution accuracy at 1/14th the cost' },
        tags: ['Qwen3-4B', 'LoRA', 'vLLM', 'MLflow', 'DVC', 'Next.js', 'Supabase']
    },
    {
        id: 'brief-to-blueprint',
        title: 'Brief to Blueprint',
        kind: 'Agents',
        context: 'CREWASIS',
        summary:
            'Building an agentic recommender that reads client briefs, asks clarifying questions and maps needs to 19 analysis models, using frozen criteria judged at temperature 0 and brief-quoted rationales for auditability.',
        metric: { value: '19', label: 'analysis models mapped per brief' },
        tags: ['LLM agents', 'Structured outputs', 'Deterministic scoring']
    },
    {
        id: 'hr-intelligence',
        title: 'HR Intelligence Platform',
        kind: 'Multi-agent',
        context: '2026',
        summary:
            'End-to-end multi-agent system that turns raw employee data into decision-ready insights: semantic search, succession planning and natural-language analytics, with retrieval separated from response synthesis.',
        metric: { value: '95%', label: 'retrieval accuracy, 85% lower latency' },
        tags: ['LangGraph', 'GPT-4o', 'FastAPI', 'Streamlit']
    },
    {
        id: 'clip-gpt2',
        title: 'Multimodal Image Captioning',
        kind: 'Deep learning',
        context: '2026',
        summary:
            'CLIP vision encoder paired with a GPT-2 language decoder, LoRA fine-tuned on COCO with ablation studies; outperformed pretrained BLIP across evaluation metrics.',
        metric: { value: '0.7668', label: 'CIDEr score' },
        tags: ['CLIP', 'GPT-2', 'LoRA', 'COCO']
    },
    {
        id: 'prompt-eval',
        title: 'Prompt Engineering Evaluation Platform',
        kind: 'LLM evaluation',
        context: '2025–26',
        summary:
            'LangGraph multi-agent workflows that benchmark prompt strategies across models on reasoning, summarization and Q&A, with reproducible experiment pipelines.',
        metric: { value: '−27%', label: 'hallucination across 500+ experiments' },
        tags: ['LangGraph', 'MLflow', 'Docker']
    },
    {
        id: 'realtime-cv',
        title: 'Real-Time Computer Vision Platform',
        kind: 'Computer vision',
        context: '2025',
        summary:
            'YOLOv8 people detection and counting with low-latency HLS streaming and a live React dashboard, running on a hybrid edge (Mac Mini GPU) and AWS EC2 inference pipeline.',
        metric: { value: '<1 s', label: 'camera-to-dashboard latency, multiple streams' },
        tags: ['YOLOv8', 'FFmpeg', 'MediaMTX', 'Flask-SocketIO', 'React', 'AWS EC2']
    },
    {
        id: 'srr',
        title: 'SRR Automation',
        kind: 'LLM pipeline',
        context: 'CREWASIS',
        summary:
            'Running, debugging and extending an automated systematic-review pipeline with LLM-driven synonym expansion and a local inference mode on Ollama; building version 2.',
        tags: ['LLM pipelines', 'Ollama', 'Local inference']
    },
    {
        id: 'doc-extraction',
        title: 'LLM Document Extraction',
        kind: 'GenAI',
        context: 'Random Trees',
        summary:
            'Generative AI pipeline that extracts structured information from industrial equipment documents, plus edge and mobile inference with TensorFlow Lite and LLaVA.',
        metric: { value: '60%', label: 'less manual data processing' },
        tags: ['LLMs', 'Prompt engineering', 'TF Lite', 'LLaVA']
    },
    {
        id: 'protein',
        title: 'Protein Function Prediction',
        kind: 'Deep learning',
        context: 'Academic',
        summary:
            'Custom CNN classifying 270K+ UniProt sequences into 7 enzyme classes under severe class imbalance, served through FastAPI with input validation and batch inference.',
        metric: { value: '96.09%', label: 'accuracy, 1,000+ sequences/min' },
        tags: ['CNN', 'FastAPI', 'UniProt']
    },
    {
        id: 'malware',
        title: 'Malware Analysis',
        kind: 'Security ML',
        context: 'Academic',
        summary:
            'CNN-LSTM over API-call sequences for behavioural malware classification, benchmarked against KNN, decision tree and naive Bayes classifiers and an MLP.',
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
