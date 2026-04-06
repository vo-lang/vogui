import type { RefAction } from './types';
import { emit } from './events';

// Measure event ID — matches eventIDMeasure in measure.vo
const EVENT_ID_MEASURE = -6;

// Ref registry: maps Vo ref names to DOM elements.

export const refRegistry = new Map<string, HTMLElement>();

/** Get a DOM element by its Vo ref name. */
export function getRef(name: string): HTMLElement | undefined {
    return refRegistry.get(name);
}

/** Create a Preact ref callback that registers/unregisters in the refRegistry. */
export function refCallback(name: string): (el: HTMLElement | null) => void {
    return (el) => {
        if (el) {
            refRegistry.set(name, el);
        } else {
            refRegistry.delete(name);
        }
    };
}

export function executeRefAction(action: RefAction): void {
    const el = refRegistry.get(action.ref);
    if (!el) {
        return;
    }
    switch (action.cmd) {
        case 'focus':
            el.focus();
            break;
        case 'blur':
            el.blur();
            break;
        case 'scrollTo':
            el.scrollTop = action.top ?? 0;
            break;
        case 'scrollToSmooth':
            el.scrollTo({ top: action.top ?? 0, behavior: 'smooth' });
            break;
        case 'scrollToBottom':
            el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
            break;
        case 'scrollToBottomSmooth':
            el.scrollTo({ top: Math.max(0, el.scrollHeight - el.clientHeight), behavior: 'smooth' });
            break;
        case 'scrollIntoView':
            el.scrollIntoView();
            break;
        case 'scrollIntoViewSmooth':
            el.scrollIntoView({ behavior: 'smooth' });
            break;
        case 'selectText':
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.select();
            }
            break;
        case 'measure': {
            const rect = el.getBoundingClientRect();
            if (action.measureId != null) {
                emit(EVENT_ID_MEASURE, JSON.stringify({
                    ID: action.measureId,
                    Rect: {
                        X: rect.x, Y: rect.y,
                        Width: rect.width, Height: rect.height,
                        Top: rect.top, Right: rect.right,
                        Bottom: rect.bottom, Left: rect.left,
                    },
                }));
            }
            break;
        }
        default: {
            const unreachable: never = action.cmd;
            throw new Error(`unsupported ref action: ${String(unreachable)}`);
        }
    }
}
