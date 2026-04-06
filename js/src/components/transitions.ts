// Shared transition definitions for VgTransition and VgTransitionGroup.
//
// Single source of truth for enter/leave CSS states, duration, and easing.
// Both VgTransition (conditional child) and VgTransitionGroup (keyed list)
// import from here to stay consistent.

export interface TransitionDef {
    enterFrom: Record<string, string>;
    enterTo: Record<string, string>;
    leaveFrom: Record<string, string>;
    leaveTo: Record<string, string>;
    duration: number;
    easing: string;
}

const TRANSITIONS: Record<string, TransitionDef> = {
    'fade': {
        enterFrom: { opacity: '0' },
        enterTo: { opacity: '1' },
        leaveFrom: { opacity: '1' },
        leaveTo: { opacity: '0' },
        duration: 200,
        easing: 'ease',
    },
    'scale': {
        enterFrom: { opacity: '0', transform: 'scale(0.95)' },
        enterTo: { opacity: '1', transform: 'scale(1)' },
        leaveFrom: { opacity: '1', transform: 'scale(1)' },
        leaveTo: { opacity: '0', transform: 'scale(0.95)' },
        duration: 250,
        easing: 'ease',
    },
    'slide-down': {
        enterFrom: { opacity: '0', transform: 'translateY(-10px)' },
        enterTo: { opacity: '1', transform: 'translateY(0)' },
        leaveFrom: { opacity: '1', transform: 'translateY(0)' },
        leaveTo: { opacity: '0', transform: 'translateY(-10px)' },
        duration: 250,
        easing: 'ease-out',
    },
    'slide-up': {
        enterFrom: { opacity: '0', transform: 'translateY(10px)' },
        enterTo: { opacity: '1', transform: 'translateY(0)' },
        leaveFrom: { opacity: '1', transform: 'translateY(0)' },
        leaveTo: { opacity: '0', transform: 'translateY(10px)' },
        duration: 250,
        easing: 'ease-out',
    },
    'slide-left': {
        enterFrom: { opacity: '0', transform: 'translateX(10px)' },
        enterTo: { opacity: '1', transform: 'translateX(0)' },
        leaveFrom: { opacity: '1', transform: 'translateX(0)' },
        leaveTo: { opacity: '0', transform: 'translateX(10px)' },
        duration: 250,
        easing: 'ease-out',
    },
    'slide-right': {
        enterFrom: { opacity: '0', transform: 'translateX(-10px)' },
        enterTo: { opacity: '1', transform: 'translateX(0)' },
        leaveFrom: { opacity: '1', transform: 'translateX(0)' },
        leaveTo: { opacity: '0', transform: 'translateX(-10px)' },
        duration: 250,
        easing: 'ease-out',
    },
};

const DEFAULT_TRANSITION = TRANSITIONS['fade'];

/** Get a full transition definition by name. Falls back to 'fade'. */
export function getTransition(name: string): TransitionDef {
    return TRANSITIONS[name] || DEFAULT_TRANSITION;
}

/** Build a CSS transition string for the given property names. */
export function buildTransitionString(properties: string[], duration: number, easing: string): string {
    return properties.map(p => `${p} ${duration}ms ${easing}`).join(', ');
}
