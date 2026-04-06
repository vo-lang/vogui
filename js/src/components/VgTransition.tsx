// VgTransition — enter/leave CSS animation for a conditional child.
//
// When the child appears (null → node), plays an enter animation.
// When the child disappears (node → null), keeps it in the DOM for the
// leave animation, then removes it after transitionend.
//
// Props from Vo:
//   transition   string   — animation name (from shared transitions.ts)
//   voChildren   VoNode[] — 0 or 1 child (conditional)

import { h } from 'preact';
import { useState, useRef, useLayoutEffect, useCallback } from 'preact/hooks';
import { voNodeToVNode } from '../renderer';
import { propsToStyle } from '../mapping';
import { getTransition, buildTransitionString } from './transitions';
import type { VoNode } from '../types';

type Phase = 'idle' | 'enter' | 'leave';

export function VgTransition(props: any) {
    const { voChildren, ...rest } = props;
    const children = (voChildren || []) as VoNode[];
    const transitionName: string = rest.transition || 'fade';
    const userClass = rest.class || '';
    const userStyle = propsToStyle(rest) || {};

    const hasChild = children.length > 0 && children[0].type !== '#text';
    const currentChild = hasChild ? children[0] : null;

    // Keep a copy of the last child for leave animation
    const [displayChild, setDisplayChild] = useState<VoNode | null>(currentChild);
    const [phase, setPhase] = useState<Phase>(hasChild ? 'enter' : 'idle');
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const prevHasChildRef = useRef(hasChild);
    const animatingRef = useRef(false);

    // Detect child appear/disappear
    if (hasChild && !prevHasChildRef.current) {
        setDisplayChild(currentChild);
        setPhase('enter');
    } else if (!hasChild && prevHasChildRef.current && !animatingRef.current) {
        setPhase('leave');
    } else if (hasChild && currentChild) {
        if (phase === 'idle' || phase === 'enter') {
            setDisplayChild(currentChild);
        }
    }
    prevHasChildRef.current = hasChild;

    const cleanup = useCallback(() => {
        const el = wrapperRef.current;
        if (el) {
            el.style.transition = '';
            el.style.opacity = '';
            el.style.transform = '';
        }
        animatingRef.current = false;
    }, []);

    useLayoutEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const def = getTransition(transitionName);

        if (phase === 'enter') {
            animatingRef.current = true;
            Object.assign(el.style, def.enterFrom);
            el.style.transition = 'none';

            requestAnimationFrame(() => {
                el.style.transition = buildTransitionString(
                    Object.keys(def.enterFrom), def.duration, def.easing);
                Object.assign(el.style, def.enterTo);

                const onEnd = (e: Event) => {
                    if (e.target !== el) return; // ignore bubbled transitionend from children
                    el.removeEventListener('transitionend', onEnd);
                    cleanup();
                    setPhase('idle');
                };
                el.addEventListener('transitionend', onEnd);

                // Fallback timeout — transitionend may not fire if element is
                // detached, hidden, or a child's transitionend bubbles first
                setTimeout(() => {
                    if (animatingRef.current && phase === 'enter') {
                        el.removeEventListener('transitionend', onEnd);
                        cleanup();
                        setPhase('idle');
                    }
                }, def.duration + 50);
            });
        } else if (phase === 'leave') {
            animatingRef.current = true;
            Object.assign(el.style, def.leaveFrom);
            el.style.transition = 'none';

            requestAnimationFrame(() => {
                el.style.transition = buildTransitionString(
                    Object.keys(def.leaveTo), def.duration, def.easing);
                Object.assign(el.style, def.leaveTo);

                const onEnd = (e: Event) => {
                    if (e.target !== el) return; // ignore bubbled transitionend from children
                    el.removeEventListener('transitionend', onEnd);
                    cleanup();
                    setDisplayChild(null);
                    setPhase('idle');
                };
                el.addEventListener('transitionend', onEnd);

                setTimeout(() => {
                    if (animatingRef.current) {
                        el.removeEventListener('transitionend', onEnd);
                        cleanup();
                        setDisplayChild(null);
                        setPhase('idle');
                    }
                }, def.duration + 50);
            });
        }
    }, [phase, transitionName, cleanup]);

    if (!displayChild) return null;

    return h('div', {
        ref: wrapperRef,
        className: userClass || undefined,
        style: userStyle,
        'data-transition': transitionName,
        'data-transition-phase': phase,
    }, voNodeToVNode(displayChild));
}
