// VgTransitionGroup — FLIP-based layout animation for keyed children.
//
// Handles three animation states:
//   ENTER: new children animate in using shared transition definitions
//   MOVE:  repositioned children animate via FLIP (First-Last-Invert-Play)
//   LEAVE: removed children play exit animation, then are removed from DOM
//
// Props from Vo:
//   transition   string   — animation name (from shared transitions.ts)
//   voChildren   VoNode[] — keyed child nodes

import { h } from 'preact';
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import { voNodeToVNode } from '../renderer';
import { propsToStyle } from '../mapping';
import { getTransition, buildTransitionString } from './transitions';
import type { VoNode } from '../types';

interface SavedRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// A leaving child: we keep its last-rendered VNode + key so it stays in the DOM
interface LeavingChild {
    key: string;
    vnode: any; // rendered Preact VNode
}

export function VgTransitionGroup(props: any) {
    const { voChildren, ...rest } = props;
    const children = (voChildren || []) as VoNode[];
    const transitionName = rest.transition || 'fade';
    const userClass = rest.class || '';
    const userStyle = propsToStyle(rest) || {};

    const containerRef = useRef<HTMLDivElement | null>(null);
    const prevRectsRef = useRef(new Map<string, SavedRect>());
    const prevKeysRef = useRef(new Set<string>());
    const prevChildMapRef = useRef(new Map<string, any>()); // key → rendered VNode

    // Leaving children tracked via ref (synchronous) + state (triggers re-render).
    // We use a ref as the authoritative source to avoid the setTimeout hack
    // that caused a one-frame flash where leaving children disappeared.
    const leavingRef = useRef<LeavingChild[]>([]);
    const [leavingChildren, setLeavingChildren] = useState<LeavingChild[]>([]);

    // FIRST phase: snapshot current positions BEFORE Preact commits
    if (containerRef.current) {
        const rects = new Map<string, SavedRect>();
        const els = Array.from(containerRef.current.children) as HTMLElement[];
        for (const el of els) {
            const key = el.dataset.flipKey;
            if (key) {
                const rect = el.getBoundingClientRect();
                rects.set(key, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
            }
        }
        prevRectsRef.current = rects;
    }

    // Build current key set
    const currentKeys = new Set<string>();
    const currentChildMap = new Map<string, any>();
    for (const child of children) {
        const key = child.props?.key;
        if (key != null) {
            const keyStr = String(key);
            currentKeys.add(keyStr);
            currentChildMap.set(keyStr, voNodeToVNode(child));
        }
    }

    // Detect removed keys → add to leaving list synchronously via ref
    const prevKeys = prevKeysRef.current;
    const prevChildMap = prevChildMapRef.current;
    let leavingChanged = false;
    for (const key of prevKeys) {
        if (!currentKeys.has(key)) {
            const vnode = prevChildMap.get(key);
            if (vnode && !leavingRef.current.some(lc => lc.key === key)) {
                leavingRef.current = [...leavingRef.current, { key, vnode }];
                leavingChanged = true;
            }
        }
    }
    // Also prune leaving children that have reappeared in current keys
    const prunedLeaving = leavingRef.current.filter(lc => !currentKeys.has(lc.key));
    if (prunedLeaving.length !== leavingRef.current.length) {
        leavingRef.current = prunedLeaving;
        leavingChanged = true;
    }

    // Save current child map for next render's leave detection
    prevChildMapRef.current = currentChildMap;

    // Sync ref → state to trigger re-render (only when leaving list changed)
    if (leavingChanged) {
        // Preact batches setState during render — this is safe and avoids setTimeout
        setLeavingChildren(leavingRef.current);
    }

    // Helper: remove a leaving child by key
    const removeLeaving = (key: string) => {
        leavingRef.current = leavingRef.current.filter(lc => lc.key !== key);
        setLeavingChildren(leavingRef.current);
    };

    // LAST + INVERT + PLAY + LEAVE: after DOM commit
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prevRects = prevRectsRef.current;
        const def = getTransition(transitionName);

        const els = Array.from(container.children) as HTMLElement[];
        for (const el of els) {
            const key = el.dataset.flipKey;
            if (!key) continue;

            const isLeaving = el.dataset.leaving === 'true';
            if (isLeaving) {
                // LEAVE animation — use shared transition definition
                Object.assign(el.style, def.leaveFrom);
                el.style.transition = 'none';
                requestAnimationFrame(() => {
                    el.style.transition = buildTransitionString(
                        Object.keys(def.leaveTo), def.duration, def.easing);
                    Object.assign(el.style, def.leaveTo);

                    const onEnd = (e: Event) => {
                        if (e.target !== el) return; // ignore bubbled transitionend
                        el.removeEventListener('transitionend', onEnd);
                        removeLeaving(key);
                    };
                    el.addEventListener('transitionend', onEnd);

                    setTimeout(() => {
                        if (leavingRef.current.some(lc => lc.key === key)) {
                            removeLeaving(key);
                        }
                    }, def.duration + 50);
                });
                continue;
            }

            const prev = prevRects.get(key);

            if (!prev || !prevKeys.has(key)) {
                // ENTER animation — use shared transition definition
                Object.assign(el.style, def.enterFrom);
                el.style.transition = 'none';
                requestAnimationFrame(() => {
                    el.style.transition = buildTransitionString(
                        Object.keys(def.enterFrom), def.duration, def.easing);
                    Object.assign(el.style, def.enterTo);

                    const onEnd = (e: Event) => {
                        if (e.target !== el) return;
                        el.removeEventListener('transitionend', onEnd);
                        el.style.transition = '';
                    };
                    el.addEventListener('transitionend', onEnd);

                    setTimeout(() => { el.style.transition = ''; }, def.duration + 50);
                });
                continue;
            }

            // MOVE: FLIP animation
            const curr = el.getBoundingClientRect();
            const dx = prev.x - curr.x;
            const dy = prev.y - curr.y;

            if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.style.transition = 'none';

            requestAnimationFrame(() => {
                el.style.transition = buildTransitionString(
                    ['transform'], def.duration, def.easing);
                el.style.transform = '';

                const onEnd = (e: Event) => {
                    if (e.target !== el) return;
                    el.removeEventListener('transitionend', onEnd);
                    el.style.transition = '';
                };
                el.addEventListener('transitionend', onEnd);

                setTimeout(() => { el.style.transition = ''; }, def.duration + 50);
            });
        }

        // Update key tracking for next render
        prevKeysRef.current = currentKeys;
    });

    // Build the render list: current children + leaving children
    const wrappedChildren: any[] = children.map(child => {
        const key = child.props?.key;
        const keyStr = key != null ? String(key) : undefined;
        return h('div', {
            key: keyStr,
            'data-flip-key': keyStr,
        }, voNodeToVNode(child));
    });

    // Append leaving children (still in DOM for exit animation)
    for (const lc of leavingChildren) {
        wrappedChildren.push(h('div', {
            key: lc.key,
            'data-flip-key': lc.key,
            'data-leaving': 'true',
            style: { pointerEvents: 'none' },
        }, lc.vnode));
    }

    return h('div', {
        ref: containerRef,
        className: userClass || undefined,
        style: userStyle,
        'data-transition-group': transitionName,
    }, ...wrappedChildren);
}
