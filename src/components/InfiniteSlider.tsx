import { Children, cloneElement, isValidElement, useEffect, useRef, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'framer-motion';
import useMeasure from 'react-use-measure';

/**
 * Infinite marquee (after motion-primitives' InfiniteSlider).
 * Children are rendered twice and the track is moved by up to one copy's length, looping seamlessly.
 * Site changes:
 *  - it can be dragged: pressing a row holds it still, dragging moves it, and letting go flings it,
 *    after which it eases back to its normal speed;
 *  - it only runs while on screen;
 *  - the duplicate copy is hidden from assistive tech;
 *  - with reduced motion it becomes a static, swipeable row.
 */
export type InfiniteSliderProps = {
    children: ReactNode;
    gap?: number;
    /** px per second */
    speed?: number;
    speedOnHover?: number;
    direction?: 'horizontal' | 'vertical';
    reverse?: boolean;
    className?: string;
};

type Drag = { id: number; last: number; time: number; vel: number; before: number };

const EASE_RATE = 2.5; // how quickly the speed returns to normal after a fling or hover (1/s)
const MAX_FLING = 3000; // px per second

export function InfiniteSlider({
    children,
    gap = 16,
    speed = 100,
    speedOnHover,
    direction = 'horizontal',
    reverse = false,
    className
}: InfiniteSliderProps) {
    const reducedMotion = useReducedMotion();
    const [measureRef, { width, height }] = useMeasure();
    const boxRef = useRef<HTMLDivElement | null>(null);
    const translation = useMotionValue(0);
    const horizontal = direction === 'horizontal';
    // per-frame state lives in a ref so dragging doesn't re-render React
    const s = useRef({ pos: 0, vel: NaN, hover: false, drag: null as Drag | null, loop: 0 }).current;
    const dir = reverse ? 1 : -1;

    // keeps the position within one copy's length, so the loop is seamless
    const wrap = (p: number) => {
        if (!s.loop) return p;
        p %= s.loop;
        return p > 0 ? p - s.loop : p;
    };

    useEffect(() => {
        if (reducedMotion) return;
        const size = horizontal ? width : height;
        const box = boxRef.current;
        if (!size || !box) return;
        s.loop = (size + gap) / 2;
        if (Number.isNaN(s.vel)) {
            s.vel = dir * speed;
            s.pos = reverse ? -s.loop : 0;
        }
        s.pos = wrap(s.pos);

        let raf = 0;
        let last = 0;
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
            last = now;
            if (!s.drag) {
                const target = dir * (s.hover && speedOnHover != null ? speedOnHover : speed);
                s.vel += (target - s.vel) * (1 - Math.exp(-dt * EASE_RATE));
                s.pos = wrap(s.pos + s.vel * dt);
            }
            translation.set(s.pos);
        };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };
        // only run while the row is (nearly) on screen
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !raf) { last = 0; raf = requestAnimationFrame(frame); }
            else if (!e.isIntersecting) stop();
        }, { rootMargin: '200px 0px' });
        io.observe(box);
        return () => { io.disconnect(); stop(); };
    }, [width, height, gap, speed, speedOnHover, horizontal, reverse, reducedMotion]);

    if (reducedMotion) {
        return (
            <div className={`infinite-slider is-static ${className || ''}`} style={{ overflowX: horizontal ? 'auto' : 'hidden' }}>
                <div style={{ display: 'flex', width: 'max-content', gap: `${gap}px`, flexDirection: horizontal ? 'row' : 'column' }}>
                    {children}
                </div>
            </div>
        );
    }

    const point = (e: PointerEvent) => (horizontal ? e.clientX : e.clientY);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 || s.drag) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        s.drag = { id: e.pointerId, last: point(e), time: e.timeStamp, vel: 0, before: s.vel };
        e.currentTarget.classList.add('is-dragging');
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const d = s.drag;
        if (!d || d.id !== e.pointerId) return;
        const p = point(e);
        const delta = p - d.last;
        const dt = (e.timeStamp - d.time) / 1000;
        s.pos = wrap(s.pos + delta);
        if (dt > 0) d.vel = 0.7 * (delta / dt) + 0.3 * d.vel; // smoothed, for the fling
        d.last = p;
        d.time = e.timeStamp;
    };
    const release = (e: PointerEvent<HTMLDivElement>, fling: boolean) => {
        const d = s.drag;
        if (!d || d.id !== e.pointerId) return;
        s.drag = null;
        e.currentTarget.classList.remove('is-dragging');
        // no fling if the pointer was held still before letting go
        const held = e.timeStamp - d.time > 80;
        if (fling) s.vel = held ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, d.vel));
        // cancelled (e.g. a touch that turned into a page scroll): carry on as before
        else s.vel = d.before;
    };

    const duplicate = Children.map(children, (child) =>
        isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, { 'aria-hidden': true }) : child
    );

    return (
        <div
            ref={boxRef}
            className={`infinite-slider is-draggable ${className || ''}`}
            // touch: the browser keeps scrolling the page the other way; drags along the row come here
            style={{ overflow: 'hidden', touchAction: horizontal ? 'pan-y' : 'pan-x' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => release(e, true)}
            onPointerCancel={(e) => release(e, false)}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') s.hover = true; }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') s.hover = false; }}
        >
            <motion.div
                ref={measureRef}
                style={{
                    ...(horizontal ? { x: translation } : { y: translation }),
                    display: 'flex',
                    width: 'max-content',
                    gap: `${gap}px`,
                    flexDirection: horizontal ? 'row' : 'column'
                }}
            >
                {children}
                {duplicate}
            </motion.div>
        </div>
    );
}

export default InfiniteSlider;
