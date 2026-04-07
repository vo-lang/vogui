import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { emit } from '../events';
import { propsToStyle } from '../mapping';
import { voNodeToVNode, usePortalContainer } from '../renderer';
import type { VoNode } from '../types';

export function VgDialog(props: any) {
    const { open, onClose, voChildren } = props;
    const children = (voChildren || []) as VoNode[];
    const userClass = props.class || '';
    const userStyle = propsToStyle(props);
    const portalContainer = usePortalContainer();
    const emitClose = () => {
        if (onClose != null) emit(onClose, '{}');
    };

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                emitClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    // Resolve title: prefer props.title, else extract from vo-dialog-title child
    let title: string | undefined = props.title;
    let bodyChildren = children;
    if (!title) {
        const idx = children.findIndex(c => c?.type === 'vo-dialog-title');
        if (idx >= 0) {
            title = children[idx].props?.textContent as string;
            bodyChildren = children.filter((_, i) => i !== idx);
        }
    }

    if (!open) {
        return null;
    }

    const overlay = h('div', {
        style: {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgb(0 0 0 / 0.5)',
            pointerEvents: 'auto',
        },
        className: 'animate-fade-in',
        onClick: emitClose,
    },
        h('div', {
            className: [
                'relative w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg animate-scale-in',
                userClass,
            ].filter(Boolean).join(' '),
            style: {
                ...userStyle,
                pointerEvents: 'auto',
            },
            onClick: (event: MouseEvent) => event.stopPropagation(),
        },
            title ? h('h2', { className: 'text-lg font-semibold leading-none tracking-tight' }, title) : null,
            h('div', { className: 'mt-4' }, ...bodyChildren.map(voNodeToVNode)),
            h('button', {
                type: 'button',
                className: 'absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring',
                onClick: emitClose,
            },
                h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                    h('path', { d: 'M18 6 6 18' }),
                    h('path', { d: 'm6 6 12 12' }),
                ),
            ),
        ),
    );

    if (!portalContainer) {
        return overlay;
    }

    return createPortal(overlay, portalContainer);
}
