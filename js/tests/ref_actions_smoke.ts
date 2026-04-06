import { executeRefAction, getRef, refCallback, refRegistry } from '../src/refs.ts';

function assertEqual(actual: any, expected: any, message: string): void {
    if (actual != expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

class FakeInput {
    public selected = false;

    select(): void {
        this.selected = true;
    }
}

class FakeTextArea {
    public selected = false;

    select(): void {
        this.selected = true;
    }
}

(globalThis as any).HTMLInputElement = FakeInput;
(globalThis as any).HTMLTextAreaElement = FakeTextArea;

function testScrollToUsesExactTop(): void {
    refRegistry.clear();
    const element = {
        scrollTop: 0,
        scrollHeight: 910,
        clientHeight: 210,
        focusCalled: false,
        blurCalled: false,
        scrolledIntoView: false,
        focus(): void {
            this.focusCalled = true;
        },
        blur(): void {
            this.blurCalled = true;
        },
        scrollIntoView(): void {
            this.scrolledIntoView = true;
        },
    };

    refCallback('list')(element as any);
    assertEqual(getRef('list'), element as any, 'ref callback should register the element');

    executeRefAction({ ref: 'list', cmd: 'scrollTo', top: 275 });
    assertEqual(element.scrollTop, 275, 'scrollTo should assign the requested top');

    executeRefAction({ ref: 'list', cmd: 'scrollToBottom' });
    assertEqual(element.scrollTop, 700, 'scrollToBottom should use the element DOM max scrollTop');

    executeRefAction({ ref: 'list', cmd: 'focus' });
    assertEqual(element.focusCalled, true, 'focus should call element.focus()');

    executeRefAction({ ref: 'list', cmd: 'blur' });
    assertEqual(element.blurCalled, true, 'blur should call element.blur()');

    executeRefAction({ ref: 'list', cmd: 'scrollIntoView' });
    assertEqual(element.scrolledIntoView, true, 'scrollIntoView should call the DOM method');

    refCallback('list')(null);
    assertEqual(getRef('list'), undefined, 'ref callback should unregister on null');
}

function testSelectTextTargetsTextInputs(): void {
    refRegistry.clear();
    const input = new FakeInput();
    refCallback('field')(input as any);
    executeRefAction({ ref: 'field', cmd: 'selectText' });
    assertEqual(input.selected, true, 'selectText should select HTMLInputElement refs');

    const textArea = new FakeTextArea();
    refCallback('area')(textArea as any);
    executeRefAction({ ref: 'area', cmd: 'selectText' });
    assertEqual(textArea.selected, true, 'selectText should select HTMLTextAreaElement refs');
}

function testMissingRefIsANoOp(): void {
    refRegistry.clear();
    executeRefAction({ ref: 'missing', cmd: 'scrollTo', top: 99 });
    assertEqual(getRef('missing'), undefined, 'missing ref should stay absent');
}

function main(): void {
    testScrollToUsesExactTop();
    testSelectTextTargetsTextInputs();
    testMissingRefIsANoOp();
}

main();
