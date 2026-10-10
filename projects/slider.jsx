// Projects: two infinite rows of project cards moving in opposite directions.
import { createRoot } from 'react-dom/client';
import { InfiniteSlider } from '../src/components/InfiniteSlider';
import { projects } from '../src/data/projects.js';

function ProjectCard({ project, ...rest }) {
    const { title, kind, context, summary, metric, tags } = project;
    return (
        <article className="pj-card" {...rest}>
            <header className="pj-head">
                <span className="pj-kind">{kind}</span>
                <span className="pj-context">{context}</span>
            </header>
            <h3 className="pj-title">{title}</h3>
            <p className="pj-summary">{summary}</p>
            {metric && (
                <p className="pj-metric">
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                </p>
            )}
            <ul className="pj-tags">
                {tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
        </article>
    );
}

function ProjectSlider() {
    const half = Math.ceil(projects.length / 2);
    const rows = [projects.slice(0, half), projects.slice(half)];
    return (
        <div className="pj-rows">
            {rows.map((row, i) => (
                <InfiniteSlider key={i} gap={24} speed={i ? 32 : 40} speedOnHover={10} reverse={i === 1} className="pj-row">
                    {row.map((p) => <ProjectCard key={p.id} project={p} />)}
                </InfiniteSlider>
            ))}
        </div>
    );
}

export function mountProjectSlider(el) {
    createRoot(el).render(<ProjectSlider />);
}
