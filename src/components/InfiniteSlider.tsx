import { Children, cloneElement, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import useMeasure from 'react-use-measure';

/**
 * Infinite marquee (after motion-primitives' InfiniteSlider).
 * Children are rendered twice and the track is translated by one copy's length, looping seamlessly.
 * Site changes: the duplicate copy is hidden from assistive tech, and with reduced motion the
 * slider becomes a static, swipeable row.
 */
export type InfiniteSliderProps = {
    children: ReactNode;
    gap?: number;
    speed?: number;
    speedOnHover?: number;
    direction?: 'horizontal' | 'vertical';
    reverse?: boolean;
    className?: string;
};

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
    const [currentSpeed, setCurrentSpeed] = useState(speed);
    const [ref, { width, height }] = useMeasure();
    const translation = useMotionValue(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [key, setKey] = useState(0);
    const horizontal = direction === 'horizontal';

    useEffect(() => {
        if (reducedMotion) return;
        const size = horizontal ? width : height;
        if (!size) return;
        const contentSize = size + gap;
        const from = reverse ? -contentSize / 2 : 0;
        const to = reverse ? 0 : -contentSize / 2;

        // a speed change eases out the current lap at the new speed, then restarts the loop
        const controls = isTransitioning
            ? animate(translation, [translation.get(), to], {
                  ease: 'linear',
                  duration: Math.abs(translation.get() - to) / currentSpeed,
                  onComplete: () => {
                      setIsTransitioning(false);
                      setKey((k) => k + 1);
                  }
              })
            : animate(translation, [from, to], {
                  ease: 'linear',
                  duration: Math.abs(to - from) / currentSpeed,
                  repeat: Infinity,
                  repeatType: 'loop',
                  repeatDelay: 0,
                  onRepeat: () => translation.set(from)
              });
        return controls.stop;
    }, [key, translation, currentSpeed, width, height, gap, isTransitioning, horizontal, reverse, reducedMotion]);

    if (reducedMotion) {
        return (
            <div className={`infinite-slider is-static ${className || ''}`} style={{ overflowX: horizontal ? 'auto' : 'hidden' }}>
                <div style={{ display: 'flex', width: 'max-content', gap: `${gap}px`, flexDirection: horizontal ? 'row' : 'column' }}>
                    {children}
                </div>
            </div>
        );
    }

    const hoverProps = speedOnHover
        ? {
              onHoverStart: () => {
                  setIsTransitioning(true);
                  setCurrentSpeed(speedOnHover);
              },
              onHoverEnd: () => {
                  setIsTransitioning(true);
                  setCurrentSpeed(speed);
              }
          }
        : {};

    const duplicate = Children.map(children, (child) =>
        isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, { 'aria-hidden': true }) : child
    );

    return (
        <div className={`infinite-slider ${className || ''}`} style={{ overflow: 'hidden' }}>
            <motion.div
                ref={ref}
                style={{
                    ...(horizontal ? { x: translation } : { y: translation }),
                    display: 'flex',
                    width: 'max-content',
                    gap: `${gap}px`,
                    flexDirection: horizontal ? 'row' : 'column'
                }}
                {...hoverProps}
            >
                {children}
                {duplicate}
            </motion.div>
        </div>
    );
}

export default InfiniteSlider;
