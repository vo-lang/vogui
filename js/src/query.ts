import { decodeBinaryRender } from './decoder';
import type { RenderMessage, VoNode } from './types';

export function findHostWidgetHandlerId(message: RenderMessage): number | null {
    return findInNode(message.tree);
}

export function findHostWidgetHandlerIdInBytes(bytes: Uint8Array): number | null {
    return findHostWidgetHandlerId(decodeBinaryRender(bytes));
}

function findInNode(node: VoNode | null | undefined): number | null {
    if (!node) {
        return null;
    }
    if (node.type === 'vo-host-widget') {
        const handlerId = node.props?.onWidget;
        if (typeof handlerId === 'number') {
            return handlerId;
        }
    }
    const props = node.props ?? {};
    for (const value of Object.values(props)) {
        const handlerId = findInValue(value);
        if (handlerId !== null) {
            return handlerId;
        }
    }
    const children = node.children ?? [];
    for (const child of children) {
        const handlerId = findInNode(child);
        if (handlerId !== null) {
            return handlerId;
        }
    }
    return null;
}

function findInValue(value: unknown): number | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const handlerId = findInValue(item);
            if (handlerId !== null) {
                return handlerId;
            }
        }
        return null;
    }
    if (!value || typeof value !== 'object') {
        return null;
    }
    if (isVoNode(value)) {
        return findInNode(value);
    }
    for (const nested of Object.values(value)) {
        const handlerId = findInValue(nested);
        if (handlerId !== null) {
            return handlerId;
        }
    }
    return null;
}

function isVoNode(value: object): value is VoNode {
    return 'type' in value
        && typeof (value as { type?: unknown }).type === 'string'
        && ('props' in value || 'children' in value);
}
