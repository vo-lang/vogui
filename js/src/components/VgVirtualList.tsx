// VgVirtualList — a Preact component for virtualized scrolling.
//
// Vo provides only the visible window of items as children.
// This component manages the scroll container, a spacer element for
// total scrollable height, and positions children at the correct offset.
// On scroll, it computes the new visible range and emits an event
// so Vo can re-render with the updated item window.
//
// Props from Vo:
//   totalCount   int     — total number of items
//   itemHeight   float64 — estimated/fixed height per item (px)
//   visibleStart int     — index of the first visible item (children[0])
//   overscan     int     — extra items rendered above/below viewport (default 3)
//   onRange      int     — handler ID for visible range change events
//   voChildren   VoNode[] — the rendered items for [visibleStart, visibleStart+len)

import { h } from 'preact';
import { useRef, useEffect, useCallback } from 'preact/hooks';
import { emit } from '../events';
import { voNodeToVNode } from '../renderer';
import { propsToStyle } from '../mapping';
import { refCallback } from '../refs';
import type { VoNode } from '../types';

export function VgVirtualList(props: any) {
    const {
        totalCount = 0,
        itemHeight = 40,
        visibleStart = 0,
        overscan = 3,
        onRange,
        voChildren,
    } = props;

    const children = (voChildren || []) as VoNode[];
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const lastEmittedRef = useRef<string>('');

    const totalHeight = totalCount * itemHeight;
    const offsetTop = visibleStart * itemHeight;

    const userClass = props.class || '';
    const userStyle = propsToStyle(props) || {};

    // Compute visible range from scroll position and emit if changed
    const handleScroll = useCallback(() => {
        const el = viewportRef.current;
        if (!el || onRange == null) return;

        const scrollTop = el.scrollTop;
        const clientHeight = el.clientHeight;
        const oc = overscan;

        let start = Math.floor(scrollTop / itemHeight) - oc;
        if (start < 0) start = 0;
        let end = Math.ceil((scrollTop + clientHeight) / itemHeight) + oc;
        if (end > totalCount) end = totalCount;

        const key = `${start}:${end}`;
        if (key === lastEmittedRef.current) return;
        lastEmittedRef.current = key;

        emit(onRange, JSON.stringify({
            Start: start,
            End: end,
            ScrollTop: scrollTop,
        }));
    }, [totalCount, itemHeight, overscan, onRange]);

    // Attach scroll listener
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll, { passive: true });
        // Emit initial range
        handleScroll();
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Render: viewport > spacer > positioned content
    return h('div', {
        className: userClass || undefined,
        ref: (el: HTMLDivElement | null) => {
            viewportRef.current = el;
            if (props.ref) {
                refCallback(props.ref)(el);
            }
        },
        style: {
            ...userStyle,
            overflowY: 'auto',
            position: 'relative',
        },
    },
        h('div', {
            style: {
                height: `${totalHeight}px`,
                position: 'relative',
            },
        },
            h('div', {
                style: {
                    position: 'absolute',
                    top: `${offsetTop}px`,
                    left: 0,
                    right: 0,
                },
            },
                ...children.map((child, i) =>
                    h('div', {
                        key: `vl-${visibleStart + i}`,
                        'data-vl-index': visibleStart + i,
                    }, voNodeToVNode(child))
                ),
            ),
        ),
    );
}
