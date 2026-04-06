// VoGUI v4 JavaScript Runtime — Public API
// Preact + Radix UI + Tailwind CSS renderer

import './vogui.css';

export type {
    VoNode,
    VoHandler,
    RenderMessage,
    RefAction,
    EventCallback,
    RendererConfig,
    WidgetFactory,
    WidgetInstance,
    CanvasCommand,
    CanvasBatch,
} from './types';

export { render, voNodeToVNode, registerWidget, destroyWidgets } from './renderer';
export { injectStyles, applyTheme, injectDynamicStyles, toggleDarkMode, setDarkMode, isDarkMode } from './styles';
export { executeCanvasBatch } from './canvas';
export { decodeBinaryRender } from './decoder';
export { findExternalWidgetHandlerId, findExternalWidgetHandlerIdInBytes } from './query';
export { executeRefAction, getRef } from './refs';
export { emit, setRenderContext, setupKeyHandler } from './events';
export { installAudioBridge } from './audio';
export { measureText, measureTextLines, fillTextWrap } from './text';
