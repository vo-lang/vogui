import {
  MAX_PACKET_BYTES,
  MessageKind,
  decodeFrameworkPacket,
  encodeFrameworkPacket,
  type FrameworkPacket,
  type GenerationalHandle,
} from "../../protocol/generated/vogui_protocol.js";

interface StudioFrameworkLane {
  readonly binding: {
    readonly session: GenerationalHandle;
    readonly caller: {
      readonly endpointIndex: number;
      readonly endpointGeneration: number;
      readonly endpointEpoch: string;
    };
  };
  poll(): Promise<Uint8Array | null>;
  submit(payload: Uint8Array, requestId?: bigint): Promise<void>;
  submitBatch(
    entries: readonly Readonly<{ payload: Uint8Array; requestId?: bigint }>[],
  ): Promise<void>;
  close(): void;
}

interface StudioLogicHost {
  readonly framework: Readonly<{
    name: string;
    providerRoles: readonly string[];
  }>;
  log(message: string): void;
  reportError(message: string): void;
  getCapability(name: "framework_lane"): {
    open(role?: string): Promise<StudioFrameworkLane>;
  } | null;
}

type ViewKind =
  | { readonly type: "element"; readonly tag: string }
  | { readonly type: "text"; readonly text: string };

interface TargetView {
  readonly sourceIds: number[];
  readonly key: string | null;
  readonly kind: ViewKind;
  readonly properties: ReadonlyMap<string, string>;
  readonly children: TargetView[];
  readonly events: ReadonlyMap<number, number>;
  readonly refs: readonly number[];
  readonly resources: readonly TargetResourceBinding[];
}

interface RetainedNode {
  readonly handle: GenerationalHandle;
  readonly key: string | null;
  readonly kind: ViewKind;
  readonly properties: ReadonlyMap<string, string>;
  readonly children: RetainedNode[];
  readonly resources: readonly TargetResourceBinding[];
}

interface TargetResourceBinding {
  readonly logicalResource: number;
  readonly descriptor: Uint8Array;
}

interface EventBinding {
  readonly node: GenerationalHandle;
  readonly eventKind: number;
  readonly mapperId: number;
  readonly token: GenerationalHandle;
}

interface RefBinding {
  readonly node: GenerationalHandle;
  readonly reference: GenerationalHandle;
  readonly bindingGeneration: number;
}

interface CandidateStateSnapshot {
  readonly retained: RetainedNode | null;
  readonly nodeGenerations: number[];
  readonly freeNodes: number[];
  readonly eventGenerations: number[];
  readonly freeEvents: number[];
  readonly refGenerations: number[];
  readonly freeRefs: number[];
  readonly events: Map<string, EventBinding>;
  readonly eventsByToken: Map<string, EventBinding>;
  readonly refs: Map<number, RefBinding>;
  readonly resourceGenerations: number[];
  readonly freeResources: number[];
  readonly resources: Map<number, BrowserResourceRecord>;
  readonly retiredResources: BrowserRetiredResource[];
}

interface PendingPresentation {
  readonly bytes: Uint8Array;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

interface BrowserRootState extends CandidateStateSnapshot {
  readonly rootHandle: GenerationalHandle;
  readonly revision: bigint;
  readonly surfaceAttached: boolean;
  readonly inflightRevision: bigint | null;
  readonly pendingPresentation: PendingPresentation | null;
}

interface AsyncStateSnapshot {
  readonly subscriptionGenerations: number[];
  readonly freeSubscriptions: number[];
  readonly subscriptions: Map<string, BrowserSubscription>;
  readonly effectMappers: Map<
    bigint,
    readonly [number, number, number, number, number, bigint]
  >;
  readonly commandEffects: Map<bigint, bigint>;
  readonly nextEffectId: bigint;
  readonly resourceFetches: Map<bigint, BrowserResourceFetch>;
  readonly nextResourceRequestId: bigint;
}

interface TargetRootView {
  readonly logicalRoot: bigint;
  readonly target: TargetView;
}

interface TargetEffect {
  readonly kind: string;
  readonly executor: 1 | 2 | 3;
  readonly scope: 1 | 2 | 3;
  readonly logicalRoot: bigint;
  readonly logicalRef: number;
  readonly successMapper: number;
  readonly failureMapper: number;
  readonly deadlineMillis: bigint;
  readonly transferable: boolean;
  readonly payload: Uint8Array;
}

interface TargetSubscription {
  readonly owner: 1 | 2 | 3;
  readonly logicalRoot: bigint;
  readonly ownerRef: number;
  readonly key: string;
  readonly kind: string;
  readonly mapperId: number;
  readonly payload: Uint8Array;
}

interface BrowserSubscription extends TargetSubscription {
  readonly handle: GenerationalHandle;
  readonly logicalRoot: bigint;
}

type TargetSubscriptionUpdate =
  | { readonly mode: "unchanged" }
  | { readonly mode: "replace-all" }
  | { readonly mode: "dirty-owners"; readonly owners: ReadonlySet<string> };

type Mutation =
  | { readonly tag: 1; readonly node: GenerationalHandle; readonly parent: GenerationalHandle | null; readonly index: number }
  | { readonly tag: 2; readonly node: GenerationalHandle }
  | { readonly tag: 3; readonly node: GenerationalHandle; readonly parent: GenerationalHandle | null; readonly index: number }
  | { readonly tag: 4; readonly node: GenerationalHandle; readonly kind: ViewKind }
  | { readonly tag: 5; readonly node: GenerationalHandle; readonly properties: ReadonlyMap<string, string> }
  | { readonly tag: 6; readonly binding: EventBinding }
  | { readonly tag: 7; readonly token: GenerationalHandle }
  | { readonly tag: 8; readonly binding: RefBinding }
  | { readonly tag: 9; readonly reference: GenerationalHandle }
  | { readonly tag: 10; readonly node: GenerationalHandle; readonly resource: GenerationalHandle; readonly sourceRevision: bigint }
  | { readonly tag: 11; readonly node: GenerationalHandle; readonly resource: GenerationalHandle };

interface BrowserResourceDescriptor {
  readonly kind: number;
  readonly locator: string;
  readonly contentHash: Uint8Array;
  readonly options: Uint8Array;
}

interface BrowserResourceLease {
  readonly logicalRoot: bigint;
  readonly root: GenerationalHandle;
  readonly node: GenerationalHandle;
  commitRevision: bigint;
}

interface BrowserResourceRecord {
  readonly logicalResource: number;
  readonly handle: GenerationalHandle;
  descriptorBytes: Uint8Array;
  descriptor: BrowserResourceDescriptor;
  sourceRevision: bigint;
  needsFetch: boolean;
  leases: Map<string, BrowserResourceLease>;
}

interface BrowserRetiredResource {
  readonly root: GenerationalHandle;
  readonly resource: GenerationalHandle;
  readonly sourceRevision: bigint;
  readonly commitRevision: bigint;
}

interface BrowserResourceFetch {
  readonly logicalRoot: bigint;
  readonly resource: GenerationalHandle;
  readonly logicalResource: number;
  readonly sourceRevision: bigint;
  readonly contentHash: Uint8Array;
}

const MAX_TARGET_BYTES = 16 * 1024 * 1024;
const MAX_NODES = 100_000;
const MAX_CHILDREN = 100_000;
const MAX_DEPTH = 256;
const MAX_BINDINGS = 100_000;
const MAX_KEY_BYTES = 4096;
const MAX_PROPERTY_BYTES = 1024 * 1024;
const MAX_PROPERTIES_PER_NODE = 256;
const PROPERTY_MAGIC = "VGP1";
const TURN_PREFIX = new TextEncoder().encode("vogui-target-turn-v1\0");
const QUALIFIED_TURN_PREFIX = new TextEncoder().encode("vogui-target-turn-v2\0");
const SEQUENCED_TURN_PREFIX = new TextEncoder().encode("vogui-target-turn-v3\0");
const EFFECT_PREFIX = new TextEncoder().encode("vogui-host-effect-v1\0");
const EFFECT_CANCEL_PREFIX = new TextEncoder().encode("vogui-host-effect-cancel-v1\0");
const EFFECT_RESULT_PREFIX = new TextEncoder().encode("vogui-host-effect-result-v1\0");
const SUBSCRIPTION_PREFIX = new TextEncoder().encode("vogui-host-subscription-v1\0");
const SUBSCRIPTION_EVENT_PREFIX = new TextEncoder().encode("vogui-host-subscription-event-v1\0");
const TARGET_INIT_PREFIX = new TextEncoder().encode("vogui-target-init-v1\0");
const TARGET_COMMIT_PREFIX = new TextEncoder().encode("vogui-target-commit-v1\0");

class VoguiBrowserLogicProvider {
  #host: StudioLogicHost | null = null;
  #lane: StudioFrameworkLane | null = null;
  #polling = false;
  #rootHandle: GenerationalHandle = { index: 0, generation: 1 };
  #retained: RetainedNode | null = null;
  #nodeGenerations: number[] = [];
  #freeNodes: number[] = [];
  #eventGenerations: number[] = [];
  #freeEvents: number[] = [];
  #refGenerations: number[] = [];
  #freeRefs: number[] = [];
  #resourceGenerations: number[] = [];
  #freeResources: number[] = [];
  #subscriptionGenerations: number[] = [];
  #freeSubscriptions: number[] = [];
  #events = new Map<string, EventBinding>();
  #eventsByToken = new Map<string, EventBinding>();
  #refs = new Map<number, RefBinding>();
  #resources = new Map<number, BrowserResourceRecord>();
  #resourceFetches = new Map<bigint, BrowserResourceFetch>();
  #retiredResources: BrowserRetiredResource[] = [];
  #nextResourceRequestId = 0xffff_ffff_ffff_ffffn;
  #subscriptions = new Map<string, BrowserSubscription>();
  #effectMappers = new Map<
    bigint,
    readonly [number, number, number, number, number, bigint]
  >();
  #commandEffects = new Map<bigint, bigint>();
  #nextEffectId = 1n;
  #revision = 0n;
  #sequence = 1n;
  #surfaceAttached = false;
  #inflightRevision: bigint | null = null;
  #pendingPresentation: PendingPresentation | null = null;
  #activeLogicalRoot = 1n;
  #rootStates = new Map<bigint, BrowserRootState>();
  #logicalRootByHandle = new Map<string, bigint>([["0:1", 1n]]);
  #nextRootIndex = 1;
  #batchEntries: Array<{ payload: Uint8Array; requestId: bigint }> | null = null;
  #appCodeEpoch = 0n;

  async init(host: StudioLogicHost): Promise<void> {
    if (this.#host !== null) throw new Error("Vogui logic provider already initialized");
    if (!host.framework.providerRoles.includes("ui-logic")) {
      throw new Error("Vogui logic provider requires the ui-logic role");
    }
    const capability = host.getCapability("framework_lane");
    if (capability === null) throw new Error("Vogui logic provider requires framework_lane");
    const lane = await capability.open("ui-logic");
    const appCodeEpoch = BigInt(lane.binding.caller.endpointEpoch);
    if (appCodeEpoch === 0n) throw new Error("Vogui logic provider received an invalid app epoch");
    this.#host = host;
    this.#lane = lane;
    this.#appCodeEpoch = appCodeEpoch;
    this.#polling = true;
    void this.#poll(host, lane);
    host.log(`Vogui browser logic provider ready for ${host.framework.name}`);
  }

  async render(_container: HTMLElement, bytes: Uint8Array): Promise<void> {
    if (bytes.byteLength === 0) return;
    if (bytes.byteLength > MAX_TARGET_BYTES) {
      throw new RangeError("Vogui target presentation exceeds browser provider limit");
    }
    return this.#commit(new Uint8Array(bytes));
  }

  stop(): void {
    this.#polling = false;
    this.#lane?.close();
    this.#lane = null;
    this.#host = null;
    this.#storeActiveRoot();
    for (const state of this.#rootStates.values()) {
      state.pendingPresentation?.reject(new Error("Vogui logic provider stopped"));
    }
    this.#rootStates.clear();
    this.#logicalRootByHandle.clear();
    this.#retained = null;
    this.#events.clear();
    this.#eventsByToken.clear();
    this.#refs.clear();
    this.#resources.clear();
    this.#resourceFetches.clear();
    this.#retiredResources = [];
    this.#subscriptions.clear();
    this.#effectMappers.clear();
    this.#commandEffects.clear();
    this.#pendingPresentation = null;
    this.#inflightRevision = null;
    this.#surfaceAttached = false;
    this.#appCodeEpoch = 0n;
  }

  quiesceForCapture(): { stopped: number; revision: string } {
    return { stopped: 1, revision: this.#revision.toString() };
  }

  async #poll(host: StudioLogicHost, lane: StudioFrameworkLane): Promise<void> {
    while (this.#polling && this.#host === host && this.#lane === lane) {
      try {
        const bytes = await lane.poll();
        if (!this.#polling || this.#host !== host || this.#lane !== lane) return;
        if (bytes === null) {
          await delay(8);
          continue;
        }
        const effectResult = stripPrefix(bytes, EFFECT_RESULT_PREFIX);
        if (effectResult !== null) {
          await this.#acceptEffectResult(effectResult);
        } else {
          const subscriptionEvent = stripPrefix(bytes, SUBSCRIPTION_EVENT_PREFIX);
          if (subscriptionEvent !== null) {
            await this.#acceptSubscriptionEvent(subscriptionEvent);
          } else {
            await this.#acceptReturn(decodeFrameworkPacket(bytes));
          }
        }
      } catch (error) {
        if (!this.#polling || this.#host !== host || this.#lane !== lane) return;
        this.#polling = false;
        host.reportError(`Vogui logic return lane failed: ${errorMessage(error)}`);
      }
    }
  }

  async #acceptReturn(packet: FrameworkPacket): Promise<void> {
    this.#activatePacketRoot(packet.header.uiRoot);
    switch (packet.header.kind) {
      case MessageKind.UiApplyAck:
        if (
          packet.payload.byteLength !== 0
          || this.#inflightRevision === null
          || packet.header.revision !== this.#inflightRevision
        ) {
          throw new Error("Vogui renderer acknowledgement revision mismatch");
        }
        this.#inflightRevision = null;
        if (this.#pendingPresentation !== null) {
          const pending = this.#pendingPresentation;
          this.#pendingPresentation = null;
          try {
            await this.#commit(pending.bytes);
            pending.resolve();
          } catch (error) {
            pending.reject(error);
            throw error;
          }
        }
        return;
      case MessageKind.UiEvent:
        await this.#dispatchEvent(packet);
        return;
      case MessageKind.UiCommandResult:
        await this.#acceptCommandResult(packet);
        return;
      default:
        throw new Error(`unsupported Vogui logic return packet ${packet.header.kind}`);
    }
  }

  async #dispatchEvent(packet: FrameworkPacket): Promise<void> {
    if (packet.payload.byteLength < 17) throw new Error("truncated Vogui event return");
    const token = readHandle(packet.payload, 0);
    const node = readHandle(packet.payload, 8);
    const eventKind = packet.payload[16]!;
    const binding = this.#eventsByToken.get(handleKey(token));
    if (
      binding === undefined
      || !sameHandle(binding.node, node)
      || binding.eventKind !== eventKind
      || packet.header.revision > this.#revision
    ) {
      throw new Error("stale or mismatched Vogui event return");
    }
    const eventPayload = packet.payload.subarray(17);
    await this.#submitLane(
      this.#encodeTargetTurn(
        binding.mapperId,
        eventPayload,
        this.#activeLogicalRoot,
        packet.header.sequence,
        packet.header.revision,
      ),
      packet.header.sequence,
    );
  }

  async #acceptEffectResult(bytes: Uint8Array): Promise<void> {
    const reader = new ByteReader(bytes);
    const effectId = reader.u64();
    const appCodeEpoch = reader.u64();
    const outcome = reader.u8();
    const payload = reader.take(reader.u32());
    if (
      effectId === 0n
      || appCodeEpoch !== this.#appCodeEpoch
      || outcome < 1
      || outcome > 4
      || ((outcome === 3 || outcome === 4) && payload.byteLength !== 0)
      || !reader.done()
    ) {
      throw new Error("invalid Vogui effect result");
    }
    const resourceFetch = this.#resourceFetches.get(effectId);
    if (resourceFetch !== undefined) {
      this.#resourceFetches.delete(effectId);
      if (outcome !== 1) return;
      const digestInput = new Uint8Array(payload.byteLength);
      digestInput.set(payload);
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", digestInput.buffer));
      if (!sameBytes(digest, resourceFetch.contentHash)) return;
      const state = resourceFetch.logicalRoot === this.#activeLogicalRoot
        ? null
        : this.#rootStates.get(resourceFetch.logicalRoot);
      const record = (state?.resources ?? this.#resources)
        .get(resourceFetch.logicalResource);
      if (
        record === undefined
        || !sameHandle(record.handle, resourceFetch.resource)
        || record.sourceRevision !== resourceFetch.sourceRevision
      ) {
        return;
      }
      await this.#publishBrowserResource(record, payload);
      return;
    }
    if (effectId >= (1n << 63n)) return;
    const mappers = this.#effectMappers.get(effectId);
    if (mappers === undefined) throw new Error("unknown Vogui effect result");
    this.#effectMappers.delete(effectId);
    const mapper = outcome === 1 ? mappers[0] : mappers[1];
    await this.#submitLane(
      this.#encodeTargetTurn(mapper, payload, mappers[3] === 1 ? null : mappers[5]),
      effectId,
    );
  }

  async #acceptSubscriptionEvent(bytes: Uint8Array): Promise<void> {
    const reader = new ByteReader(bytes);
    const handle = readHandle(reader.take(8), 0);
    const payload = reader.take(reader.u32());
    if (!reader.done()) throw new Error("trailing Vogui subscription event bytes");
    const subscription = [...this.#subscriptions.values()]
      .find((candidate) => sameHandle(candidate.handle, handle));
    if (subscription === undefined) throw new Error("stale Vogui subscription event");
    await this.#submitLane(this.#encodeTargetTurn(
      subscription.mapperId,
      payload,
      subscription.owner === 1 ? null : subscription.logicalRoot,
    ));
  }

  async #commit(bytes: Uint8Array): Promise<void> {
    const ingress = decodeTargetIngress(bytes);
    const effects = decodeTargetEffects(ingress.effects);
    const subscriptions = decodeTargetSubscriptions(ingress.subscriptions);
    const subscriptionUpdate = decodeTargetSubscriptionUpdate(ingress.updateResult);
    const targets = decodeTargetPresentations(ingress.presentation);
    if (
      targets.length > 1
      && (
        effects.some((effect) => effect.scope !== 1 && effect.logicalRoot === 0n)
        || subscriptions.some(
          (subscription) => subscription.owner !== 1 && subscription.logicalRoot === 0n,
        )
        || (
          subscriptionUpdate.mode === "dirty-owners"
          && [...subscriptionUpdate.owners].some((owner) => owner.startsWith("*:"))
        )
      )
    ) {
      throw new Error("multi-root Vogui ingress requires root-qualified async records");
    }
    if (targets.length > 1) {
      for (const target of targets) {
        this.#activateLogicalRoot(target.logicalRoot);
        if (this.#inflightRevision !== null || this.#pendingPresentation !== null) {
          throw new Error("multi-root Vogui ingress cannot enter a busy root");
        }
        this.#preflightTarget(target.target);
        this.#storeActiveRoot();
      }
      const lane = this.#requireLane();
      const originalLogicalRoot = this.#activeLogicalRoot;
      const originalSequence = this.#sequence;
      const asyncSnapshot = this.#snapshotAsyncState();
      const rootSnapshots = new Map<bigint, BrowserRootState>();
      const entries: Array<{ payload: Uint8Array; requestId: bigint }> = [];
      for (const target of targets) {
        this.#activateLogicalRoot(target.logicalRoot);
        rootSnapshots.set(target.logicalRoot, this.#snapshotActiveRootState());
      }
      try {
        this.#batchEntries = entries;
        for (const target of targets) {
          this.#activateLogicalRoot(target.logicalRoot);
          this.#stageTargetPresentation(target.target, entries);
          this.#stageResourceLifecycle(entries);
          this.#storeActiveRoot();
        }
        for (const target of targets) {
          this.#activateLogicalRoot(target.logicalRoot);
          await this.#cancelOrphanedHostEffects();
          await this.#removeOrphanedScopeSubscriptions();
          this.#storeActiveRoot();
        }
        if (ingress.completeState) {
          this.#activateLogicalRoot(targets[0]!.logicalRoot);
          await this.#commitAsync(
            effects,
            subscriptions,
            subscriptionUpdate,
            this.#revision,
          );
          this.#storeActiveRoot();
        }
        this.#batchEntries = null;
        if (entries.length !== 0) await lane.submitBatch(entries);
      } catch (error) {
        this.#batchEntries = null;
        this.#sequence = originalSequence;
        this.#restoreAsyncState(asyncSnapshot);
        for (const [logicalRoot, state] of rootSnapshots) {
          this.#rootStates.set(logicalRoot, state);
        }
        const originalState = rootSnapshots.get(originalLogicalRoot);
        if (originalState !== undefined) {
          this.#loadRootState(originalLogicalRoot, originalState);
        }
        throw error;
      }
      return;
    }
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index]!;
      this.#activateLogicalRoot(target.logicalRoot);
      if (this.#inflightRevision !== null) {
        if (targets.length !== 1 || this.#pendingPresentation !== null) {
          throw new Error("Vogui browser provider pending presentation capacity exceeded");
        }
        return new Promise<void>((resolve, reject) => {
          this.#pendingPresentation = { bytes, resolve, reject };
          this.#storeActiveRoot();
        });
      }
      const originalSequence = this.#sequence;
      const rootSnapshot = this.#snapshotActiveRootState();
      const asyncSnapshot = this.#snapshotAsyncState();
      const entries: Array<{ payload: Uint8Array; requestId: bigint }> = [];
      try {
        this.#batchEntries = entries;
        await this.#commitTarget(
          ingress,
          target.target,
          effects,
          subscriptions,
          subscriptionUpdate,
          targets.length === 1,
        );
        this.#batchEntries = null;
        if (entries.length !== 0) await this.#requireLane().submitBatch(entries);
        this.#storeActiveRoot();
      } catch (error) {
        this.#batchEntries = null;
        this.#sequence = originalSequence;
        this.#restoreAsyncState(asyncSnapshot);
        this.#rootStates.set(target.logicalRoot, rootSnapshot);
        this.#loadRootState(target.logicalRoot, rootSnapshot);
        throw error;
      }
    }
  }

  #stageTargetPresentation(
    target: TargetView,
    entries: Array<{ payload: Uint8Array; requestId: bigint }>,
  ): void {
    const mutations: Mutation[] = [];
    const sourceHandles = new Map<number, GenerationalHandle>();
    const next = this.#reconcileNode(target, this.#retained, null, 0, mutations, sourceHandles, 1);
    this.#retained = next;
    this.#reconcileEvents(target, sourceHandles, mutations);
    this.#reconcileRefs(target, sourceHandles, mutations);
    if (mutations.length === 0) return;
    const baseRevision = this.#revision;
    const nextRevision = baseRevision + 1n;
    const lane = this.#requireLane();
    if (!this.#surfaceAttached) {
      const endpoint = {
        index: lane.binding.caller.endpointIndex,
        generation: lane.binding.caller.endpointGeneration,
      };
      const surface = new ByteWriter(38);
      surface.u8(1);
      surface.handle(lane.binding.session);
      surface.handle(endpoint);
      surface.handle(endpoint);
      surface.handle(endpoint);
      surface.u32(0);
      surface.u8(1);
      const surfaceSequence = this.#sequence;
      this.#sequence += 1n;
      entries.push({
        payload: encodeFrameworkPacket({
          kind: MessageKind.UiSurfaceControl,
          uiSession: lane.binding.session,
          uiRoot: this.#rootHandle,
          uiRootEpoch: 1,
          appCodeEpoch: this.#appCodeEpoch,
          revision: nextRevision,
          sequence: surfaceSequence,
        }, surface.finish()),
        requestId: surfaceSequence,
      });
      this.#surfaceAttached = true;
    }
    const sequence = this.#sequence;
    this.#sequence += 1n;
    const kind = baseRevision === 0n ? MessageKind.UiSnapshot : MessageKind.UiPatch;
    entries.push({
      payload: encodeFrameworkPacket({
        kind,
        uiSession: lane.binding.session,
        uiRoot: this.#rootHandle,
        uiRootEpoch: 1,
        appCodeEpoch: this.#appCodeEpoch,
        revision: nextRevision,
        sequence,
      }, encodeTransaction(baseRevision, nextRevision, next.handle, mutations)),
      requestId: sequence,
    });
    this.#revision = nextRevision;
    this.#inflightRevision = nextRevision;
  }

  async #commitTarget(
    ingress: ReturnType<typeof decodeTargetIngress>,
    target: TargetView,
    effects: readonly TargetEffect[],
    subscriptions: readonly TargetSubscription[],
    subscriptionUpdate: TargetSubscriptionUpdate,
    commitAsyncState: boolean,
  ): Promise<void> {
    const candidateSnapshot = this.#snapshotCandidateState();
    let crossedCommitPoint = false;
    try {
      const mutations: Mutation[] = [];
      const sourceHandles = new Map<number, GenerationalHandle>();
      const next = this.#reconcileNode(target, this.#retained, null, 0, mutations, sourceHandles, 1);
      this.#retained = next;
      this.#reconcileEvents(target, sourceHandles, mutations);
      this.#reconcileRefs(target, sourceHandles, mutations);
      const nextRevision = this.#revision + (mutations.length === 0 ? 0n : 1n);
      if (mutations.length === 0) {
        crossedCommitPoint = true;
        await this.#cancelOrphanedHostEffects();
        await this.#removeOrphanedScopeSubscriptions();
        if (ingress.completeState && commitAsyncState) {
          await this.#commitAsync(effects, subscriptions, subscriptionUpdate, nextRevision);
        }
        return;
      }
      const baseRevision = this.#revision;
      const payload = encodeTransaction(baseRevision, nextRevision, next.handle, mutations);
      const kind = baseRevision === 0n ? MessageKind.UiSnapshot : MessageKind.UiPatch;
      const lane = this.#requireLane();
      if (!this.#surfaceAttached) {
        const endpoint = {
          index: lane.binding.caller.endpointIndex,
          generation: lane.binding.caller.endpointGeneration,
        };
        const surface = new ByteWriter(38);
        surface.u8(1);
        surface.handle(lane.binding.session);
        surface.handle(endpoint);
        surface.handle(endpoint);
        surface.handle(endpoint);
        surface.u32(0);
        surface.u8(1);
        const surfaceSequence = this.#sequence;
        this.#sequence += 1n;
        await this.#submitLane(encodeFrameworkPacket({
          kind: MessageKind.UiSurfaceControl,
          uiSession: lane.binding.session,
          uiRoot: this.#rootHandle,
          uiRootEpoch: 1,
          appCodeEpoch: this.#appCodeEpoch,
          revision: nextRevision,
          sequence: surfaceSequence,
        }, surface.finish()), surfaceSequence);
        this.#surfaceAttached = true;
      }
      const sequence = this.#sequence;
      this.#sequence += 1n;
      this.#revision = nextRevision;
      this.#inflightRevision = nextRevision;
      crossedCommitPoint = true;
      await this.#submitLane(encodeFrameworkPacket({
        kind,
        uiSession: lane.binding.session,
        uiRoot: this.#rootHandle,
        uiRootEpoch: 1,
        appCodeEpoch: this.#appCodeEpoch,
        revision: nextRevision,
        sequence,
      }, payload), sequence);
      await this.#flushResourceLifecycle();
      await this.#cancelOrphanedHostEffects();
      await this.#removeOrphanedScopeSubscriptions();
      if (ingress.completeState && commitAsyncState) {
        await this.#commitAsync(effects, subscriptions, subscriptionUpdate, nextRevision);
      }
    } catch (error) {
      if (crossedCommitPoint) {
        this.#inflightRevision = null;
      } else {
        this.#restoreCandidateState(candidateSnapshot);
      }
      throw error;
    }
  }

  #preflightTarget(target: TargetView): void {
    const snapshot = this.#snapshotCandidateState();
    try {
      const mutations: Mutation[] = [];
      const sourceHandles = new Map<number, GenerationalHandle>();
      const next = this.#reconcileNode(
        target,
        this.#retained,
        null,
        0,
        mutations,
        sourceHandles,
        1,
      );
      this.#retained = next;
      this.#reconcileEvents(target, sourceHandles, mutations);
      this.#reconcileRefs(target, sourceHandles, mutations);
      if (mutations.length !== 0) {
        const nextRevision = this.#revision + 1n;
        encodeTransaction(this.#revision, nextRevision, next.handle, mutations);
      }
    } finally {
      this.#restoreCandidateState(snapshot);
    }
  }

  async #commitAsync(
    effects: readonly TargetEffect[],
    subscriptions: readonly TargetSubscription[],
    subscriptionUpdate: TargetSubscriptionUpdate,
    minAppliedRevision: bigint,
  ): Promise<void> {
    const lane = this.#requireLane();
    for (const effect of effects) {
      const logicalRoot = effect.scope === 1
        ? null
        : effect.logicalRoot === 0n
          ? this.#activeLogicalRoot
          : effect.logicalRoot;
      const rootState = logicalRoot === null || logicalRoot === this.#activeLogicalRoot
        ? null
        : this.#rootStates.get(logicalRoot);
      const refs = rootState?.refs ?? this.#refs;
      const rootHandle = logicalRoot === null
        ? { index: 0xffffffff, generation: 0 }
        : rootState?.rootHandle ?? this.#rootHandle;
      if (effect.scope === 3 && !refs.has(effect.logicalRef)) {
        throw new Error("Vogui effect references an unbound logical ref");
      }
      const effectId = this.#nextEffectId;
      if (effectId > 0xffff_ffff_ffff_ffffn) throw new RangeError("Vogui effect identity exhausted");
      this.#nextEffectId += 1n;
      this.#effectMappers.set(effectId, [
        effect.successMapper,
        effect.failureMapper,
        effect.executor,
        effect.scope,
        effect.logicalRef,
        logicalRoot ?? this.#activeLogicalRoot,
      ]);
      if (effect.executor === 1) {
        await this.#submitEffectCommand(
          effect,
          effectId,
          logicalRoot === this.#activeLogicalRoot
            ? minAppliedRevision
            : rootState?.revision ?? minAppliedRevision,
          lane,
          refs,
          rootHandle,
        );
        continue;
      }
      const kind = new TextEncoder().encode(effect.kind);
      const writer = new ByteWriter(MAX_TARGET_BYTES);
      writer.bytes(EFFECT_PREFIX);
      writer.u64(effectId);
      writer.u64(this.#appCodeEpoch);
      writer.u8(effect.executor);
      writer.u8(effect.scope);
      writer.handle(rootHandle);
      const nodeBinding = effect.scope === 3 ? refs.get(effect.logicalRef) : undefined;
      writer.handle(nodeBinding?.reference ?? { index: 0xffffffff, generation: 0 });
      writer.u32(nodeBinding?.bindingGeneration ?? 0);
      writer.u64(effect.deadlineMillis);
      writer.u16(kind.byteLength);
      writer.u32(effect.payload.byteLength);
      writer.bytes(kind);
      writer.bytes(effect.payload);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(writer.finish(), sequence);
    }

    if (subscriptionUpdate.mode === "unchanged") {
      if (subscriptions.length !== 0) throw new Error("unchanged subscription update has records");
      return;
    }
    for (const subscription of subscriptions) {
      const logicalRoot = subscription.owner === 1
        ? 0n
        : subscription.logicalRoot === 0n
          ? this.#activeLogicalRoot
          : subscription.logicalRoot;
      const refs = logicalRoot === this.#activeLogicalRoot
        ? this.#refs
        : this.#rootStates.get(logicalRoot)?.refs;
      if (subscription.owner !== 1 && refs === undefined) {
        throw new Error("subscription references an unknown logical root");
      }
      if (subscription.owner === 3 && !refs!.has(subscription.ownerRef)) {
        throw new Error("scope subscription references an unbound logical ref");
      }
    }
    const desired = new Map(subscriptions.map((subscription) => [
      subscriptionIdentity(subscription, this.#activeLogicalRoot),
      subscription,
    ]));
    if (subscriptionUpdate.mode === "dirty-owners") {
      for (const subscription of subscriptions) {
        if (!dirtyOwnerMatches(
          subscriptionUpdate.owners,
          subscription,
          this.#activeLogicalRoot,
        )) {
          throw new Error("Vogui subscription record belongs to a clean owner");
        }
      }
    }
    for (const [key, current] of this.#subscriptions) {
      if (
        subscriptionUpdate.mode === "dirty-owners"
        && (
          (current.owner !== 1 && current.logicalRoot !== this.#activeLogicalRoot)
          || !dirtyOwnerMatches(
            subscriptionUpdate.owners,
            current,
            this.#activeLogicalRoot,
          )
        )
      ) {
        continue;
      }
      const next = desired.get(key);
      if (
        next !== undefined
        && next.kind === current.kind
        && next.mapperId === current.mapperId
        && sameBytes(next.payload, current.payload)
      ) {
        desired.delete(key);
        continue;
      }
      const writer = new ByteWriter(64);
      writer.bytes(SUBSCRIPTION_PREFIX);
      writer.u8(2);
      writer.handle(current.handle);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(writer.finish(), sequence);
      this.#subscriptions.delete(key);
      this.#releaseSubscription(current.handle);
    }
    for (const [key, subscription] of desired) {
      const handle = this.#allocateSubscription();
      const current = {
        ...subscription,
        handle,
        logicalRoot: subscription.owner === 1
          ? 0n
          : subscription.logicalRoot === 0n
            ? this.#activeLogicalRoot
            : subscription.logicalRoot,
      };
      this.#subscriptions.set(key, current);
      const kind = new TextEncoder().encode(subscription.kind);
      const writer = new ByteWriter(MAX_TARGET_BYTES);
      writer.bytes(SUBSCRIPTION_PREFIX);
      writer.u8(1);
      writer.handle(handle);
      writer.u16(kind.byteLength);
      writer.u32(subscription.payload.byteLength);
      writer.bytes(kind);
      writer.bytes(subscription.payload);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(writer.finish(), sequence);
    }
  }

  async #submitEffectCommand(
    effect: TargetEffect,
    effectId: bigint,
    minAppliedRevision: bigint,
    lane: StudioFrameworkLane,
    refs: ReadonlyMap<number, RefBinding>,
    rootHandle: GenerationalHandle,
  ): Promise<void> {
    if (effect.scope !== 3) throw new Error("Vogui UiCommand effect requires a node scope");
    const binding = refs.get(effect.logicalRef);
    if (binding === undefined) throw new Error("Vogui UiCommand effect references an unbound ref");
    const kind = new TextEncoder().encode(effect.kind);
    const writer = new ByteWriter(MAX_TARGET_BYTES);
    writer.u64(effectId);
    writer.handle(binding.reference);
    writer.u32(binding.bindingGeneration);
    writer.u64(effect.deadlineMillis);
    writer.u16(kind.byteLength);
    writer.bytes(kind);
    writer.u32(effect.payload.byteLength);
    writer.bytes(effect.payload);
    this.#commandEffects.set(effectId, effectId);
    await this.#submitLane(encodeFrameworkPacket({
      kind: MessageKind.UiCommand,
      uiSession: lane.binding.session,
      uiRoot: rootHandle,
      uiRootEpoch: 1,
      appCodeEpoch: this.#appCodeEpoch,
      revision: minAppliedRevision,
      sequence: effectId,
    }, writer.finish()), effectId);
  }

  async #acceptCommandResult(packet: FrameworkPacket): Promise<void> {
    const reader = new ByteReader(packet.payload);
    const commandId = reader.u64();
    const outcome = reader.u8();
    let success = outcome === 1 || outcome === 2;
    let payload: Uint8Array = new Uint8Array();
    if (outcome === 2) {
      const writer = new ByteWriter(65);
      writer.bytes(new TextEncoder().encode("VGM1"));
      writer.handle(readHandle(reader.take(8), 0));
      writer.u32(reader.u32());
      writer.u64(reader.u64());
      writer.u64(reader.u64());
      writer.u8(reader.u8());
      for (let index = 0; index < 4; index += 1) writer.i64(reader.i64());
      payload = writer.finish();
    } else if (outcome === 4) {
      success = false;
    } else if (!success) {
      if (outcome < 3 || outcome > 8) throw new Error("unknown Vogui command outcome");
      payload = Uint8Array.of(outcome);
    }
    if (!reader.done()) throw new Error("trailing Vogui command result bytes");
    const effectId = this.#commandEffects.get(commandId);
    if (effectId === undefined) throw new Error("unknown Vogui command result");
    this.#commandEffects.delete(commandId);
    const mappers = this.#effectMappers.get(effectId);
    if (mappers === undefined) throw new Error("Vogui command effect mapper disappeared");
    this.#effectMappers.delete(effectId);
    await this.#submitLane(
      this.#encodeTargetTurn(
        success ? mappers[0] : mappers[1],
        payload,
        mappers[5],
      ),
      commandId,
    );
  }

  #reconcileNode(
    view: TargetView,
    old: RetainedNode | null,
    parent: GenerationalHandle | null,
    index: number,
    mutations: Mutation[],
    sourceHandles: Map<number, GenerationalHandle>,
    depth: number,
  ): RetainedNode {
    if (depth > MAX_DEPTH) throw new RangeError("Vogui browser tree depth exceeded");
    const reusable = old !== null && old.key === view.key && sameKindIdentity(old.kind, view.kind);
    const handle = reusable ? old.handle : this.#allocateNode();
    if (!reusable) {
      mutations.push({ tag: 1, node: handle, parent, index });
      mutations.push({ tag: 4, node: handle, kind: view.kind });
      mutations.push({ tag: 5, node: handle, properties: view.properties });
    } else {
      if (!sameKind(old.kind, view.kind)) mutations.push({ tag: 4, node: handle, kind: view.kind });
      if (!sameProperties(old.properties, view.properties)) {
        mutations.push({ tag: 5, node: handle, properties: view.properties });
      }
    }
    for (const sourceId of view.sourceIds) sourceHandles.set(sourceId, handle);
    this.#reconcileResources(
      handle,
      reusable ? old?.resources ?? [] : [],
      view.resources,
      mutations,
    );

    const oldChildren = reusable ? old.children : [];
    const keyedOld = new Map<string, RetainedNode>();
    for (const child of oldChildren) {
      if (child.key !== null) keyedOld.set(child.key, child);
    }
    const used = new Set<number>();
    const nextChildren: RetainedNode[] = [];
    const keys = new Set<string>();
    for (let childIndex = 0; childIndex < view.children.length; childIndex += 1) {
      const childView = view.children[childIndex]!;
      if (childView.key !== null) {
        if (keys.has(childView.key)) throw new Error(`duplicate Vogui child key ${childView.key}`);
        keys.add(childView.key);
      }
      let candidate: RetainedNode | null = null;
      if (childView.key !== null) {
        candidate = keyedOld.get(childView.key) ?? null;
      } else {
        const positional = oldChildren[childIndex];
        if (positional !== undefined && positional.key === null) candidate = positional;
      }
      if (candidate !== null && used.has(candidate.handle.index)) candidate = null;
      if (candidate !== null) used.add(candidate.handle.index);
      const child = this.#reconcileNode(
        childView,
        candidate,
        handle,
        childIndex,
        mutations,
        sourceHandles,
        depth + 1,
      );
      if (
        candidate !== null
        && reusable
        && oldChildren[childIndex]?.handle.index !== child.handle.index
      ) {
        mutations.push({ tag: 3, node: child.handle, parent: handle, index: childIndex });
      }
      nextChildren.push(child);
    }
    for (const child of oldChildren) {
      if (!used.has(child.handle.index)) this.#removeSubtree(child, mutations);
    }
    if (!reusable && old !== null) this.#removeSubtree(old, mutations);
    return {
      handle,
      key: view.key,
      kind: cloneKind(view.kind),
      properties: new Map(view.properties),
      children: nextChildren,
      resources: view.resources.map((resource) => ({
        logicalResource: resource.logicalResource,
        descriptor: new Uint8Array(resource.descriptor),
      })),
    };
  }

  #stageResourceLifecycle(
    entries: Array<{ payload: Uint8Array; requestId: bigint }>,
  ): void {
    const lane = this.#requireLane();
    for (const retired of this.#retiredResources.splice(0)) {
      for (const [requestId, fetch] of [...this.#resourceFetches]) {
        if (
          fetch.logicalRoot !== this.#activeLogicalRoot
          || !sameHandle(fetch.resource, retired.resource)
        ) continue;
        this.#resourceFetches.delete(requestId);
        const cancel = new ByteWriter(EFFECT_CANCEL_PREFIX.byteLength + 16);
        cancel.bytes(EFFECT_CANCEL_PREFIX);
        cancel.u64(requestId);
        cancel.u64(this.#appCodeEpoch);
        const cancelSequence = this.#sequence;
        this.#sequence += 1n;
        entries.push({ payload: cancel.finish(), requestId: cancelSequence });
      }
      const payload = new ByteWriter(16);
      payload.handle(retired.resource);
      payload.u64(retired.sourceRevision);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      entries.push({
        payload: encodeFrameworkPacket({
          kind: MessageKind.UiResourceRetire,
          uiSession: lane.binding.session,
          uiRoot: retired.root,
          uiRootEpoch: 1,
          appCodeEpoch: this.#appCodeEpoch,
          revision: retired.commitRevision,
          sequence,
        }, payload.finish()),
        requestId: sequence,
      });
    }
    for (const record of this.#resources.values()) {
      if (!record.needsFetch || record.leases.size === 0) continue;
      for (const [requestId, fetch] of [...this.#resourceFetches]) {
        if (
          fetch.logicalRoot !== this.#activeLogicalRoot
          || fetch.logicalResource !== record.logicalResource
        ) continue;
        this.#resourceFetches.delete(requestId);
        const cancel = new ByteWriter(EFFECT_CANCEL_PREFIX.byteLength + 16);
        cancel.bytes(EFFECT_CANCEL_PREFIX);
        cancel.u64(requestId);
        cancel.u64(this.#appCodeEpoch);
        const sequence = this.#sequence;
        this.#sequence += 1n;
        entries.push({ payload: cancel.finish(), requestId: sequence });
      }
      const path = new TextEncoder().encode(record.descriptor.locator);
      const vfs = new ByteWriter(16 + path.byteLength);
      vfs.bytes(new TextEncoder().encode("VFS1"));
      vfs.u8(1);
      vfs.u8(0);
      vfs.u8(0);
      vfs.u8(0);
      vfs.u32(path.byteLength);
      vfs.u32(0);
      vfs.bytes(path);
      const request = vfs.finish();
      const requestId = this.#nextResourceRequestId;
      this.#nextResourceRequestId -= 1n;
      if (requestId < (1n << 63n)) throw new RangeError("Vogui resource request identity exhausted");
      const effect = new ByteWriter(EFFECT_PREFIX.byteLength + 52 + 3 + request.byteLength);
      effect.bytes(EFFECT_PREFIX);
      effect.u64(requestId);
      effect.u64(this.#appCodeEpoch);
      effect.u8(2);
      effect.u8(1);
      effect.handle({ index: 0xffff_ffff, generation: 0 });
      effect.handle({ index: 0xffff_ffff, generation: 0 });
      effect.u32(0);
      effect.u64(0xffff_ffff_ffff_ffffn);
      effect.u16(3);
      effect.u32(request.byteLength);
      effect.bytes(new TextEncoder().encode("vfs"));
      effect.bytes(request);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      entries.push({ payload: effect.finish(), requestId: sequence });
      this.#resourceFetches.set(requestId, {
        logicalRoot: this.#activeLogicalRoot,
        resource: record.handle,
        logicalResource: record.logicalResource,
        sourceRevision: record.sourceRevision,
        contentHash: new Uint8Array(record.descriptor.contentHash),
      });
      record.needsFetch = false;
    }
  }

  async #flushResourceLifecycle(): Promise<void> {
    const entries: Array<{ payload: Uint8Array; requestId: bigint }> = [];
    this.#stageResourceLifecycle(entries);
    if (entries.length !== 0) await this.#requireLane().submitBatch(entries);
  }

  async #publishBrowserResource(
    record: BrowserResourceRecord,
    bytes: Uint8Array,
  ): Promise<void> {
    const lane = this.#requireLane();
    const entries: Array<{ payload: Uint8Array; requestId: bigint }> = [];
    const chunkBytes = 512 * 1024;
    const chunks = Math.max(1, Math.ceil(bytes.byteLength / chunkBytes));
    for (const lease of record.leases.values()) {
      for (let index = 0; index < chunks; index += 1) {
        const offset = index * chunkBytes;
        const chunk = bytes.subarray(offset, Math.min(bytes.byteLength, offset + chunkBytes));
        const metadata = index === 0 ? record.descriptor.options : new Uint8Array();
        const payload = new ByteWriter(66 + metadata.byteLength + chunk.byteLength);
        payload.handle(record.handle);
        payload.u64(record.sourceRevision);
        payload.u8(record.descriptor.kind);
        payload.bytes(record.descriptor.contentHash);
        payload.u32(bytes.byteLength);
        payload.u32(record.descriptor.options.byteLength);
        payload.u32(offset);
        payload.u32(chunk.byteLength);
        payload.u8(index + 1 === chunks ? 1 : 0);
        payload.bytes(metadata);
        payload.bytes(chunk);
        const sequence = this.#sequence;
        this.#sequence += 1n;
        entries.push({
          payload: encodeFrameworkPacket({
            kind: MessageKind.UiResourcePublication,
            uiSession: lane.binding.session,
            uiRoot: lease.root,
            uiRootEpoch: 1,
            appCodeEpoch: this.#appCodeEpoch,
            revision: lease.commitRevision,
            sequence,
          }, payload.finish()),
          requestId: sequence,
        });
      }
    }
    if (entries.length !== 0) await lane.submitBatch(entries);
  }

  async #cancelOrphanedHostEffects(): Promise<void> {
    const lane = this.#requireLane();
    for (const [effectId, route] of [...this.#effectMappers]) {
      const [, failureMapper, executor, scope, logicalRef, logicalRoot] = route;
      if (
        executor === 1
        || scope !== 3
        || logicalRoot !== this.#activeLogicalRoot
        || this.#refs.has(logicalRef)
      ) continue;
      this.#effectMappers.delete(effectId);
      const cancel = new ByteWriter(EFFECT_CANCEL_PREFIX.byteLength + 16);
      cancel.bytes(EFFECT_CANCEL_PREFIX);
      cancel.u64(effectId);
      cancel.u64(this.#appCodeEpoch);
      let sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(cancel.finish(), sequence);
      const turn = this.#encodeTargetTurn(failureMapper, new Uint8Array(), logicalRoot);
      sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(turn, sequence);
    }
  }

  async #removeOrphanedScopeSubscriptions(): Promise<void> {
    const lane = this.#requireLane();
    for (const [key, subscription] of [...this.#subscriptions]) {
      if (
        subscription.logicalRoot !== this.#activeLogicalRoot
        || subscription.owner !== 3
        || this.#refs.has(subscription.ownerRef)
      ) continue;
      const writer = new ByteWriter(64);
      writer.bytes(SUBSCRIPTION_PREFIX);
      writer.u8(2);
      writer.handle(subscription.handle);
      const sequence = this.#sequence;
      this.#sequence += 1n;
      await this.#submitLane(writer.finish(), sequence);
      this.#subscriptions.delete(key);
      this.#releaseSubscription(subscription.handle);
    }
  }

  #removeSubtree(node: RetainedNode, mutations: Mutation[]): void {
    mutations.push({ tag: 2, node: node.handle });
    const pending = [node];
    while (pending.length > 0) {
      const current = pending.pop()!;
      this.#reconcileResources(current.handle, current.resources, [], mutations);
      pending.push(...current.children);
      this.#releaseNode(current.handle);
    }
  }

  #reconcileResources(
    node: GenerationalHandle,
    oldBindings: readonly TargetResourceBinding[],
    desiredBindings: readonly TargetResourceBinding[],
    mutations: Mutation[],
  ): void {
    const old = new Map(oldBindings.map((binding) => [binding.logicalResource, binding]));
    const desired = new Map<number, TargetResourceBinding>();
    for (const binding of desiredBindings) {
      if (binding.logicalResource === 0 || desired.has(binding.logicalResource)) {
        throw new Error("invalid or duplicate Vogui resource binding");
      }
      desired.set(binding.logicalResource, binding);
    }
    for (const logicalResource of old.keys()) {
      if (desired.has(logicalResource)) continue;
      const record = this.#resources.get(logicalResource);
      if (record === undefined) throw new Error("Vogui resource record disappeared");
      const leaseKey = browserResourceLeaseKey(this.#activeLogicalRoot, node, logicalResource);
      const lease = record.leases.get(leaseKey);
      if (lease === undefined) throw new Error("Vogui resource lease disappeared");
      record.leases.delete(leaseKey);
      mutations.push({ tag: 11, node, resource: record.handle });
      if (record.leases.size === 0) {
        this.#retiredResources.push({
          root: lease.root,
          resource: record.handle,
          sourceRevision: record.sourceRevision,
          commitRevision: this.#revision + 1n,
        });
        this.#resources.delete(logicalResource);
        this.#releaseResource(record.handle);
      }
    }
    for (const [logicalResource, desiredBinding] of desired) {
      const descriptor = decodeBrowserResourceDescriptor(desiredBinding.descriptor);
      let record = this.#resources.get(logicalResource);
      let descriptorChanged = false;
      if (record === undefined) {
        record = {
          logicalResource,
          handle: this.#allocateResource(),
          descriptorBytes: new Uint8Array(desiredBinding.descriptor),
          descriptor,
          sourceRevision: 1n,
          needsFetch: true,
          leases: new Map(),
        };
        this.#resources.set(logicalResource, record);
      } else if (!sameBytes(record.descriptorBytes, desiredBinding.descriptor)) {
        if (record.descriptor.kind !== descriptor.kind) {
          throw new Error("Vogui resource hot reload changed resource kind");
        }
        record.descriptorBytes = new Uint8Array(desiredBinding.descriptor);
        record.descriptor = descriptor;
        record.sourceRevision += 1n;
        record.needsFetch = true;
        descriptorChanged = true;
      }
      const leaseKey = browserResourceLeaseKey(this.#activeLogicalRoot, node, logicalResource);
      if (!record.leases.has(leaseKey)) {
        record.leases.set(leaseKey, {
          logicalRoot: this.#activeLogicalRoot,
          root: this.#rootHandle,
          node,
          commitRevision: this.#revision + 1n,
        });
        mutations.push({
          tag: 10,
          node,
          resource: record.handle,
          sourceRevision: record.sourceRevision,
        });
      } else if (descriptorChanged) {
        for (const lease of record.leases.values()) {
          lease.commitRevision = this.#revision + 1n;
          if (lease.logicalRoot === this.#activeLogicalRoot) {
            mutations.push({
              tag: 10,
              node: lease.node,
              resource: record.handle,
              sourceRevision: record.sourceRevision,
            });
          }
        }
      }
    }
  }

  #reconcileEvents(
    target: TargetView,
    sourceHandles: ReadonlyMap<number, GenerationalHandle>,
    mutations: Mutation[],
  ): void {
    const desired = new Map<string, { node: GenerationalHandle; eventKind: number; mapperId: number }>();
    visitTarget(target, (view) => {
      const node = sourceHandles.get(view.sourceIds[0]!);
      if (node === undefined) throw new Error("Vogui event source was not reconciled");
      for (const [eventKind, mapperId] of view.events) {
        const key = `${handleKey(node)}:${eventKind}`;
        if (desired.has(key)) throw new Error("duplicate Vogui event binding");
        desired.set(key, { node, eventKind, mapperId });
      }
    });
    for (const [key, binding] of this.#events) {
      if (!desired.has(key)) {
        mutations.push({ tag: 7, token: binding.token });
        this.#events.delete(key);
        this.#eventsByToken.delete(handleKey(binding.token));
        this.#releaseEvent(binding.token);
      }
    }
    for (const [key, item] of desired) {
      const existing = this.#events.get(key);
      if (existing !== undefined) {
        const updated = { ...existing, mapperId: item.mapperId };
        this.#events.set(key, updated);
        this.#eventsByToken.set(handleKey(updated.token), updated);
        continue;
      }
      const binding: EventBinding = { ...item, token: this.#allocateEvent() };
      this.#events.set(key, binding);
      this.#eventsByToken.set(handleKey(binding.token), binding);
      mutations.push({ tag: 6, binding });
    }
  }

  #reconcileRefs(
    target: TargetView,
    sourceHandles: ReadonlyMap<number, GenerationalHandle>,
    mutations: Mutation[],
  ): void {
    const desired = new Map<number, GenerationalHandle>();
    visitTarget(target, (view) => {
      const node = sourceHandles.get(view.sourceIds[0]!);
      if (node === undefined) throw new Error("Vogui ref source was not reconciled");
      for (const logicalRef of view.refs) {
        if (desired.has(logicalRef)) throw new Error("duplicate Vogui logical ref");
        desired.set(logicalRef, node);
      }
    });
    for (const [logicalRef, binding] of this.#refs) {
      if (!desired.has(logicalRef)) {
        mutations.push({ tag: 9, reference: binding.reference });
        this.#refs.delete(logicalRef);
        this.#releaseRef(binding.reference);
      }
    }
    for (const [logicalRef, node] of desired) {
      const existing = this.#refs.get(logicalRef);
      if (existing !== undefined && sameHandle(existing.node, node)) continue;
      const binding: RefBinding = existing === undefined
        ? { node, reference: this.#allocateRef(), bindingGeneration: 1 }
        : { ...existing, node, bindingGeneration: nextGeneration(existing.bindingGeneration) };
      this.#refs.set(logicalRef, binding);
      mutations.push({ tag: 8, binding });
    }
  }

  #allocateNode(): GenerationalHandle {
    return allocateHandle(this.#nodeGenerations, this.#freeNodes);
  }

  #releaseNode(handle: GenerationalHandle): void {
    releaseHandle(handle, this.#nodeGenerations, this.#freeNodes);
  }

  #allocateEvent(): GenerationalHandle {
    return allocateHandle(this.#eventGenerations, this.#freeEvents);
  }

  #releaseEvent(handle: GenerationalHandle): void {
    releaseHandle(handle, this.#eventGenerations, this.#freeEvents);
  }

  #allocateRef(): GenerationalHandle {
    return allocateHandle(this.#refGenerations, this.#freeRefs);
  }

  #allocateResource(): GenerationalHandle {
    return allocateHandle(this.#resourceGenerations, this.#freeResources);
  }

  #releaseResource(handle: GenerationalHandle): void {
    releaseHandle(handle, this.#resourceGenerations, this.#freeResources);
  }

  #releaseRef(handle: GenerationalHandle): void {
    releaseHandle(handle, this.#refGenerations, this.#freeRefs);
  }

  #allocateSubscription(): GenerationalHandle {
    return allocateHandle(this.#subscriptionGenerations, this.#freeSubscriptions);
  }

  #releaseSubscription(handle: GenerationalHandle): void {
    releaseHandle(handle, this.#subscriptionGenerations, this.#freeSubscriptions);
  }

  #encodeTargetTurn(
    mapperId: number,
    payload: Uint8Array,
    logicalRoot: bigint | null,
    eventSequence: bigint | null = null,
    eventRevision: bigint | null = null,
  ): Uint8Array {
    const writer = new ByteWriter(MAX_TARGET_BYTES);
    if (logicalRoot === null) {
      writer.bytes(TURN_PREFIX);
      writer.u32(mapperId);
      writer.u32(payload.byteLength);
      writer.bytes(payload);
      return writer.finish();
    }
    const root = logicalRoot === this.#activeLogicalRoot
      ? this.#rootHandle
      : this.#rootStates.get(logicalRoot)?.rootHandle;
    if (root === undefined) throw new Error("Vogui target turn references an unknown root");
    writer.bytes(eventSequence === null ? QUALIFIED_TURN_PREFIX : SEQUENCED_TURN_PREFIX);
    writer.u32(mapperId);
    writer.handle(root);
    writer.handle({
      index: this.#requireLane().binding.caller.endpointIndex,
      generation: this.#requireLane().binding.caller.endpointGeneration,
    });
    if (eventSequence !== null) {
      writer.u64(eventSequence);
      writer.u64(eventRevision ?? 0n);
    }
    writer.u32(payload.byteLength);
    writer.bytes(payload);
    return writer.finish();
  }

  #snapshotCandidateState(): CandidateStateSnapshot {
    return {
      retained: cloneRetainedNode(this.#retained),
      nodeGenerations: this.#nodeGenerations.slice(),
      freeNodes: this.#freeNodes.slice(),
      eventGenerations: this.#eventGenerations.slice(),
      freeEvents: this.#freeEvents.slice(),
      refGenerations: this.#refGenerations.slice(),
      freeRefs: this.#freeRefs.slice(),
      events: new Map(this.#events),
      eventsByToken: new Map(this.#eventsByToken),
      refs: new Map(this.#refs),
      resourceGenerations: this.#resourceGenerations.slice(),
      freeResources: this.#freeResources.slice(),
      resources: cloneBrowserResources(this.#resources),
      retiredResources: this.#retiredResources.map((retired) => ({
        root: { ...retired.root },
        resource: { ...retired.resource },
        sourceRevision: retired.sourceRevision,
        commitRevision: retired.commitRevision,
      })),
    };
  }

  #restoreCandidateState(snapshot: CandidateStateSnapshot): void {
    this.#retained = snapshot.retained;
    this.#nodeGenerations = snapshot.nodeGenerations;
    this.#freeNodes = snapshot.freeNodes;
    this.#eventGenerations = snapshot.eventGenerations;
    this.#freeEvents = snapshot.freeEvents;
    this.#refGenerations = snapshot.refGenerations;
    this.#freeRefs = snapshot.freeRefs;
    this.#events = snapshot.events;
    this.#eventsByToken = snapshot.eventsByToken;
    this.#refs = snapshot.refs;
    this.#resourceGenerations = snapshot.resourceGenerations;
    this.#freeResources = snapshot.freeResources;
    this.#resources = snapshot.resources;
    this.#retiredResources = snapshot.retiredResources;
  }

  #snapshotAsyncState(): AsyncStateSnapshot {
    return {
      subscriptionGenerations: this.#subscriptionGenerations.slice(),
      freeSubscriptions: this.#freeSubscriptions.slice(),
      subscriptions: new Map(this.#subscriptions),
      effectMappers: new Map(this.#effectMappers),
      commandEffects: new Map(this.#commandEffects),
      nextEffectId: this.#nextEffectId,
      resourceFetches: new Map(this.#resourceFetches),
      nextResourceRequestId: this.#nextResourceRequestId,
    };
  }

  #restoreAsyncState(snapshot: AsyncStateSnapshot): void {
    this.#subscriptionGenerations = snapshot.subscriptionGenerations;
    this.#freeSubscriptions = snapshot.freeSubscriptions;
    this.#subscriptions = snapshot.subscriptions;
    this.#effectMappers = snapshot.effectMappers;
    this.#commandEffects = snapshot.commandEffects;
    this.#nextEffectId = snapshot.nextEffectId;
    this.#resourceFetches = snapshot.resourceFetches;
    this.#nextResourceRequestId = snapshot.nextResourceRequestId;
  }

  #storeActiveRoot(): void {
    this.#rootStates.set(this.#activeLogicalRoot, {
      rootHandle: this.#rootHandle,
      retained: this.#retained,
      nodeGenerations: this.#nodeGenerations,
      freeNodes: this.#freeNodes,
      eventGenerations: this.#eventGenerations,
      freeEvents: this.#freeEvents,
      refGenerations: this.#refGenerations,
      freeRefs: this.#freeRefs,
      events: this.#events,
      eventsByToken: this.#eventsByToken,
      refs: this.#refs,
      resourceGenerations: this.#resourceGenerations,
      freeResources: this.#freeResources,
      resources: this.#resources,
      retiredResources: this.#retiredResources,
      revision: this.#revision,
      surfaceAttached: this.#surfaceAttached,
      inflightRevision: this.#inflightRevision,
      pendingPresentation: this.#pendingPresentation,
    });
  }

  #snapshotActiveRootState(): BrowserRootState {
    return {
      rootHandle: { ...this.#rootHandle },
      ...this.#snapshotCandidateState(),
      revision: this.#revision,
      surfaceAttached: this.#surfaceAttached,
      inflightRevision: this.#inflightRevision,
      pendingPresentation: this.#pendingPresentation,
    };
  }

  #loadRootState(logicalRoot: bigint, state: BrowserRootState): void {
    this.#activeLogicalRoot = logicalRoot;
    this.#rootHandle = state.rootHandle;
    this.#retained = state.retained;
    this.#nodeGenerations = state.nodeGenerations;
    this.#freeNodes = state.freeNodes;
    this.#eventGenerations = state.eventGenerations;
    this.#freeEvents = state.freeEvents;
    this.#refGenerations = state.refGenerations;
    this.#freeRefs = state.freeRefs;
    this.#events = state.events;
    this.#eventsByToken = state.eventsByToken;
    this.#refs = state.refs;
    this.#resourceGenerations = state.resourceGenerations;
    this.#freeResources = state.freeResources;
    this.#resources = state.resources;
    this.#retiredResources = state.retiredResources;
    this.#revision = state.revision;
    this.#surfaceAttached = state.surfaceAttached;
    this.#inflightRevision = state.inflightRevision;
    this.#pendingPresentation = state.pendingPresentation;
  }

  #activateLogicalRoot(logicalRoot: bigint): void {
    if (logicalRoot === this.#activeLogicalRoot) return;
    this.#storeActiveRoot();
    let state = this.#rootStates.get(logicalRoot);
    if (state === undefined) {
      if (this.#nextRootIndex > 0xffff_ffff) {
        throw new RangeError("Vogui browser root identity exhausted");
      }
      const rootHandle = { index: this.#nextRootIndex, generation: 1 };
      this.#nextRootIndex += 1;
      state = {
        rootHandle,
        retained: null,
        nodeGenerations: [],
        freeNodes: [],
        eventGenerations: [],
        freeEvents: [],
        refGenerations: [],
        freeRefs: [],
        events: new Map(),
        eventsByToken: new Map(),
        refs: new Map(),
        resourceGenerations: [],
        freeResources: [],
        resources: new Map(),
        retiredResources: [],
        revision: 0n,
        surfaceAttached: false,
        inflightRevision: null,
        pendingPresentation: null,
      };
      this.#logicalRootByHandle.set(handleKey(rootHandle), logicalRoot);
    }
    this.#loadRootState(logicalRoot, state);
  }

  #activatePacketRoot(root: GenerationalHandle): void {
    const logicalRoot = this.#logicalRootByHandle.get(handleKey(root));
    if (logicalRoot === undefined) throw new Error("unknown Vogui browser root");
    this.#activateLogicalRoot(logicalRoot);
  }

  #requireLane(): StudioFrameworkLane {
    if (this.#lane === null) throw new Error("Vogui logic lane is closed");
    return this.#lane;
  }

  async #submitLane(payload: Uint8Array, requestId = 0n): Promise<void> {
    if (this.#batchEntries !== null) {
      this.#batchEntries.push({ payload, requestId });
      return;
    }
    await this.#requireLane().submit(payload, requestId);
  }
}

function cloneRetainedNode(node: RetainedNode | null): RetainedNode | null {
  if (node === null) return null;
  return {
    handle: { ...node.handle },
    key: node.key,
    kind: node.kind.type === "element"
      ? { type: "element", tag: node.kind.tag }
      : { type: "text", text: node.kind.text },
    properties: new Map(node.properties),
    children: node.children.map((child) => cloneRetainedNode(child)!),
    resources: node.resources.map((resource) => ({
      logicalResource: resource.logicalResource,
      descriptor: new Uint8Array(resource.descriptor),
    })),
  };
}

function decodeTargetIngress(bytes: Uint8Array): {
  readonly completeState: boolean;
  readonly updateResult: Uint8Array;
  readonly effects: Uint8Array;
  readonly presentation: Uint8Array;
  readonly subscriptions: Uint8Array;
} {
  const init = stripPrefix(bytes, TARGET_INIT_PREFIX);
  if (init !== null) {
    const reader = new ByteReader(init);
    const modelLength = reader.u32();
    const effectsLength = reader.u32();
    const presentationLength = reader.u32();
    const subscriptionsLength = reader.u32();
    reader.take(modelLength);
    const effects = reader.take(effectsLength);
    const presentation = reader.take(presentationLength);
    const subscriptions = reader.take(subscriptionsLength);
    if (!reader.done()) throw new Error("trailing Vogui target init bytes");
    return {
      completeState: true,
      updateResult: new Uint8Array(),
      effects,
      presentation,
      subscriptions,
    };
  }
  const commit = stripPrefix(bytes, TARGET_COMMIT_PREFIX);
  if (commit !== null) {
    const reader = new ByteReader(commit);
    const modelLength = reader.u32();
    const updateResultLength = reader.u32();
    const effectsLength = reader.u32();
    const presentationLength = reader.u32();
    const subscriptionsLength = reader.u32();
    reader.take(modelLength);
    const updateResult = reader.take(updateResultLength);
    const effects = reader.take(effectsLength);
    const presentation = reader.take(presentationLength);
    const subscriptions = reader.take(subscriptionsLength);
    if (!reader.done()) throw new Error("trailing Vogui target commit bytes");
    return { completeState: true, updateResult, effects, presentation, subscriptions };
  }
  return {
    completeState: false,
    updateResult: new Uint8Array(),
    effects: new Uint8Array(),
    presentation: bytes,
    subscriptions: new Uint8Array(),
  };
}

function stripPrefix(bytes: Uint8Array, prefix: Uint8Array): Uint8Array | null {
  if (bytes.byteLength < prefix.byteLength) return null;
  for (let index = 0; index < prefix.byteLength; index += 1) {
    if (bytes[index] !== prefix[index]) return null;
  }
  return bytes.subarray(prefix.byteLength);
}

function decodeTargetEffects(bytes: Uint8Array): TargetEffect[] {
  if (bytes.byteLength === 0) return [];
  const reader = new ByteReader(bytes);
  const magic = reader.string(4);
  if (magic !== "VGE1" && magic !== "VGE2") throw new Error("invalid Vogui effect block");
  const qualified = magic === "VGE2";
  const count = reader.u32();
  if (count > 4096) throw new RangeError("Vogui effect capacity exceeded");
  const effects: TargetEffect[] = [];
  for (let index = 0; index < count; index += 1) {
    const kindLength = reader.u16();
    const scope = reader.u8();
    const flags = reader.u8();
    const successMapper = reader.u32();
    const failureMapper = reader.u32();
    const deadlineMillis = reader.u64();
    const logicalRoot = qualified ? reader.u64() : 0n;
    const logicalRef = reader.safeU64();
    const payloadLength = reader.u32();
    if (
      kindLength === 0
      || kindLength > 256
      || payloadLength > MAX_PROPERTY_BYTES
      || (scope !== 1 && scope !== 2 && scope !== 3)
      || (scope === 3 ? logicalRef === 0 : logicalRef !== 0)
      || (flags & ~1) !== 0
      || successMapper === 0
      || failureMapper === 0
      || deadlineMillis === 0n
      || (qualified && scope === 1 && logicalRoot !== 0n)
      || (qualified && scope !== 1 && logicalRoot === 0n)
    ) {
      throw new Error("invalid Vogui effect");
    }
    const kind = reader.string(kindLength);
    const executor = effectExecutor(kind);
    effects.push({
      kind,
      executor,
      scope,
      logicalRoot,
      logicalRef,
      successMapper,
      failureMapper,
      deadlineMillis,
      transferable: (flags & 1) !== 0,
      payload: reader.take(payloadLength),
    });
  }
  if (!reader.done()) throw new Error("trailing Vogui effect bytes");
  return effects;
}

function decodeTargetSubscriptions(bytes: Uint8Array): TargetSubscription[] {
  const reader = new ByteReader(bytes);
  const subscriptions: TargetSubscription[] = [];
  const keys = new Set<string>();
  let legacyIndex = 0;
  while (!reader.done()) {
    if (subscriptions.length >= 4096) throw new RangeError("Vogui subscription capacity exceeded");
    const tag = reader.u8();
    let key: string;
    let kindLength: number;
    let payloadLength: number;
    let mapperId: number;
    let owner: 1 | 2 | 3 = 2;
    let logicalRoot = 0n;
    let ownerRef = 0;
    if (tag === 1) {
      kindLength = reader.u32();
      payloadLength = reader.u32();
      mapperId = reader.safeU64();
      legacyIndex += 1;
      key = `legacy-${legacyIndex}`;
    } else if (tag === 2) {
      const keyLength = reader.u16();
      kindLength = reader.u16();
      payloadLength = reader.u32();
      mapperId = reader.safeU64();
      if (keyLength === 0 || keyLength > 256) throw new Error("invalid Vogui subscription key");
      key = reader.string(keyLength);
    } else if (tag === 3 || tag === 4) {
      const ownerTag = reader.u8();
      if (ownerTag !== 1 && ownerTag !== 2 && ownerTag !== 3) {
        throw new Error("invalid Vogui subscription owner");
      }
      owner = ownerTag;
      if (reader.u8() !== 0) throw new Error("invalid Vogui subscription owner flags");
      const keyLength = reader.u16();
      kindLength = reader.u16();
      payloadLength = reader.u32();
      mapperId = reader.safeU64();
      ownerRef = reader.safeU64();
      logicalRoot = tag === 4 ? reader.u64() : 0n;
      if (
        keyLength === 0
        || keyLength > 256
        || ((owner === 1 || owner === 2) ? ownerRef !== 0 : ownerRef === 0)
        || (tag === 4 && owner === 1 && logicalRoot !== 0n)
        || (tag === 4 && owner !== 1 && logicalRoot === 0n)
      ) {
        throw new Error("invalid Vogui subscription owner");
      }
      key = reader.string(keyLength);
    } else {
      throw new Error("unknown Vogui subscription record");
    }
    if (
      kindLength === 0
      || kindLength > 256
      || payloadLength > MAX_PROPERTY_BYTES
      || mapperId === 0
    ) {
      throw new Error("invalid Vogui subscription");
    }
    const kind = reader.string(kindLength);
    if (!subscriptionKindSupported(kind)) throw new Error(`unsupported Vogui subscription ${kind}`);
    const identity = `${logicalRoot}:${owner}:${ownerRef}:${key}`;
    if (keys.has(identity)) throw new Error("duplicate Vogui subscription");
    keys.add(identity);
    subscriptions.push({
      owner,
      logicalRoot,
      ownerRef,
      key,
      kind,
      mapperId,
      payload: reader.take(payloadLength),
    });
  }
  return subscriptions;
}

function decodeTargetSubscriptionUpdate(bytes: Uint8Array): TargetSubscriptionUpdate {
  if (bytes.byteLength === 0) return { mode: "replace-all" };
  const reader = new ByteReader(bytes);
  const magic = reader.string(4);
  if (magic !== "VGU1" && magic !== "VGU2") {
    throw new Error("invalid Vogui update result magic");
  }
  const qualified = magic === "VGU2";
  const mode = reader.u8();
  if (reader.u8() !== 0) throw new Error("invalid Vogui update result flags");
  const count = reader.u16();
  if (mode === 0 && count === 0 && reader.done()) return { mode: "unchanged" };
  if (mode === 1 && count === 0 && reader.done()) return { mode: "replace-all" };
  if (mode !== 2 || count === 0 || count > 4096) {
    throw new Error("invalid Vogui subscription update mode");
  }
  const owners = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    const owner = reader.u8();
    if ((owner !== 1 && owner !== 2 && owner !== 3) || reader.u8() !== 0 || reader.u16() !== 0) {
      throw new Error("invalid Vogui dirty subscription owner");
    }
    const builderId = reader.u32();
    const ownerRef = reader.safeU64();
    const logicalRoot = qualified ? reader.u64() : 0n;
    if (
      builderId === 0
      || ((owner === 1 || owner === 2) ? ownerRef !== 0 : ownerRef === 0)
      || (qualified && owner === 1 && logicalRoot !== 0n)
      || (qualified && owner !== 1 && logicalRoot === 0n)
    ) {
      throw new Error("invalid Vogui dirty subscription request");
    }
    const identity = qualified
      ? `${logicalRoot}:${owner}:${ownerRef}`
      : `*:${owner}:${ownerRef}`;
    if (owners.has(identity)) throw new Error("duplicate Vogui dirty subscription owner");
    owners.add(identity);
  }
  if (!reader.done()) throw new Error("trailing Vogui update result bytes");
  return { mode: "dirty-owners", owners };
}

function subscriptionIdentity(subscription: TargetSubscription, logicalRoot: bigint): string {
  const root = subscription.owner === 1
    ? 0n
    : subscription.logicalRoot === 0n
      ? logicalRoot
      : subscription.logicalRoot;
  return `${root}:${subscription.owner}:${subscription.ownerRef}:${subscription.key}`;
}

function dirtyOwnerMatches(
  owners: ReadonlySet<string>,
  subscription: TargetSubscription,
  activeLogicalRoot: bigint,
): boolean {
  const logicalRoot = subscription.owner === 1
    ? 0n
    : subscription.logicalRoot === 0n
      ? activeLogicalRoot
      : subscription.logicalRoot;
  return owners.has(`${logicalRoot}:${subscription.owner}:${subscription.ownerRef}`)
    || owners.has(`*:${subscription.owner}:${subscription.ownerRef}`);
}

function effectExecutor(kind: string): 1 | 2 | 3 {
  if (
    kind === "focus"
    || kind === "scroll"
    || kind === "selection"
    || kind === "measure"
    || kind === "animation.begin"
    || kind === "animation.cancel"
  ) return 1;
  if (
    kind === "clipboard.read"
    || kind === "clipboard.write"
    || kind === "file.open"
    || kind === "file.save"
    || kind === "navigation"
    || kind === "window.command"
    || kind === "view.command"
    || kind === "vfs"
    || kind === "capability"
    || kind === "audio.activation"
    || kind === "haptics.rumble"
  ) return 2;
  if (kind === "delay" || kind === "background") return 3;
  throw new Error(`unsupported Vogui effect ${kind}`);
}

function subscriptionKindSupported(kind: string): boolean {
  return [
    "timer.once",
    "timer.interval",
    "animation.clock",
    "resize",
    "visibility",
    "route.location",
    "global.shortcut",
    "pointer.stream",
    "file.drop",
    "resource.watch",
    "platform.lifecycle",
  ].includes(kind);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function browserResourceLeaseKey(
  logicalRoot: bigint,
  node: GenerationalHandle,
  logicalResource: number,
): string {
  return `${logicalRoot}:${handleKey(node)}:${logicalResource}`;
}

function decodeBrowserResourceDescriptor(bytes: Uint8Array): BrowserResourceDescriptor {
  if (bytes.byteLength < 48 || new TextDecoder().decode(bytes.subarray(0, 4)) !== "VGD1") {
    throw new Error("invalid Vogui resource descriptor");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kind = view.getUint32(4, true);
  const locatorBytes = view.getUint16(8, true);
  const reserved = view.getUint16(10, true);
  const optionsBytes = view.getUint32(12, true);
  const end = 48 + locatorBytes + optionsBytes;
  const contentHash = bytes.slice(16, 48);
  if (
    kind < 1
    || kind > 6
    || locatorBytes === 0
    || reserved !== 0
    || end !== bytes.byteLength
    || contentHash.every((byte) => byte === 0)
  ) {
    throw new Error("invalid Vogui resource descriptor fields");
  }
  const locator = new TextDecoder("utf-8", { fatal: true })
    .decode(bytes.subarray(48, 48 + locatorBytes));
  return {
    kind,
    locator,
    contentHash,
    options: bytes.slice(48 + locatorBytes),
  };
}

function cloneBrowserResources(
  resources: ReadonlyMap<number, BrowserResourceRecord>,
): Map<number, BrowserResourceRecord> {
  return new Map([...resources].map(([logicalResource, record]) => [
    logicalResource,
    {
      logicalResource,
      handle: { ...record.handle },
      descriptorBytes: new Uint8Array(record.descriptorBytes),
      descriptor: {
        kind: record.descriptor.kind,
        locator: record.descriptor.locator,
        contentHash: new Uint8Array(record.descriptor.contentHash),
        options: new Uint8Array(record.descriptor.options),
      },
      sourceRevision: record.sourceRevision,
      needsFetch: record.needsFetch,
      leases: new Map([...record.leases].map(([key, lease]) => [
        key,
        {
          logicalRoot: lease.logicalRoot,
          root: { ...lease.root },
          node: { ...lease.node },
          commitRevision: lease.commitRevision,
        },
      ])),
    },
  ]));
}

function decodeTargetPresentations(bytes: Uint8Array): TargetRootView[] {
  if (
    bytes.byteLength < 4
    || bytes[0] !== 0x56
    || bytes[1] !== 0x47
    || bytes[2] !== 0x52
    || bytes[3] !== 0x31
  ) {
    return [{ logicalRoot: 1n, target: decodeTargetPresentation(bytes) }];
  }
  const reader = new ByteReader(bytes);
  if (reader.string(4) !== "VGR1") throw new Error("invalid Vogui root batch");
  const count = reader.u16();
  if (count === 0 || reader.u16() !== 0) throw new Error("invalid Vogui root batch header");
  const logicalRoots = new Set<bigint>();
  const targets: TargetRootView[] = [];
  for (let index = 0; index < count; index += 1) {
    const logicalRoot = reader.u64();
    const length = reader.u32();
    if (logicalRoot === 0n || logicalRoots.has(logicalRoot)) {
      throw new Error("invalid Vogui logical root");
    }
    logicalRoots.add(logicalRoot);
    targets.push({
      logicalRoot,
      target: decodeTargetPresentation(reader.take(length)),
    });
  }
  if (!reader.done()) throw new Error("trailing Vogui root batch bytes");
  return targets;
}

function decodeTargetPresentation(bytes: Uint8Array): TargetView {
  const reader = new ByteReader(bytes);
  const nodes = new Map<number, {
    readonly id: number;
    readonly kind: number | null;
    readonly builderId: number | null;
    readonly key: string | null;
    readonly properties: ReadonlyMap<string, string>;
    readonly children: number[];
  }>();
  const events = new Map<number, Map<number, number>>();
  const refs = new Map<number, number[]>();
  const resources = new Map<number, TargetResourceBinding[]>();
  let root: number | null = null;
  let childCountTotal = 0;
  let eventCount = 0;
  let refCount = 0;
  while (!reader.done()) {
    const tag = reader.u8();
    switch (tag) {
      case 1: {
        if (nodes.size >= MAX_NODES) throw new RangeError("Vogui browser node capacity exceeded");
        const id = reader.safeU64();
        const kind = reader.safeU64();
        const keyLength = reader.u32();
        const propertiesLength = reader.u32();
        const childCount = reader.u32();
        childCountTotal += childCount;
        if (
          keyLength > MAX_KEY_BYTES
          || propertiesLength > MAX_PROPERTY_BYTES
          || childCountTotal > MAX_CHILDREN
        ) {
          throw new RangeError("Vogui browser presentation capacity exceeded");
        }
        const key = decodeOptionalString(reader.take(keyLength));
        const properties = decodeProperties(reader.take(propertiesLength));
        const children: number[] = [];
        for (let index = 0; index < childCount; index += 1) children.push(reader.safeU64());
        if (id === 0 || kind === 0 || nodes.has(id)) throw new Error("invalid Vogui source node");
        nodes.set(id, { id, kind, builderId: null, key, properties, children });
        break;
      }
      case 2: {
        if (nodes.size >= MAX_NODES) throw new RangeError("Vogui browser node capacity exceeded");
        const id = reader.safeU64();
        const builderId = reader.safeU64();
        const child = reader.safeU64();
        const keyLength = reader.u32();
        if (keyLength > MAX_KEY_BYTES) throw new RangeError("Vogui browser scope key is too large");
        childCountTotal += 1;
        if (childCountTotal > MAX_CHILDREN) throw new RangeError("Vogui browser child capacity exceeded");
        const key = decodeOptionalString(reader.take(keyLength));
        if (id === 0 || builderId === 0 || child === 0 || nodes.has(id)) {
          throw new Error("invalid Vogui source scope");
        }
        nodes.set(id, {
          id,
          kind: null,
          builderId,
          key,
          properties: new Map(),
          children: [child],
        });
        break;
      }
      case 3: {
        eventCount += 1;
        if (eventCount > MAX_BINDINGS) throw new RangeError("Vogui browser event capacity exceeded");
        const node = reader.safeU64();
        const eventKind = reader.safeU64();
        const mapperId = reader.safeU64();
        if (eventKind < 1 || eventKind > 12 || mapperId < 1 || mapperId > 0x7fff_ffff) {
          throw new Error("invalid Vogui event binding");
        }
        const bindings = events.get(node) ?? new Map<number, number>();
        if (bindings.has(eventKind)) throw new Error("duplicate Vogui event binding");
        bindings.set(eventKind, mapperId);
        events.set(node, bindings);
        break;
      }
      case 4: {
        refCount += 1;
        if (refCount > MAX_BINDINGS) throw new RangeError("Vogui browser ref capacity exceeded");
        const node = reader.safeU64();
        const logicalRef = reader.safeU64();
        const bindings = refs.get(node) ?? [];
        if (logicalRef === 0 || bindings.includes(logicalRef)) throw new Error("duplicate Vogui ref binding");
        bindings.push(logicalRef);
        refs.set(node, bindings);
        break;
      }
      case 5:
        if (root !== null) throw new Error("duplicate Vogui source root");
        root = reader.safeU64();
        break;
      case 6: {
        const node = reader.safeU64();
        const logicalResource = reader.safeU64();
        const descriptorLength = reader.u32();
        if (
          logicalResource === 0
          || descriptorLength === 0
          || descriptorLength > MAX_PROPERTY_BYTES
        ) {
          throw new Error("invalid Vogui resource binding");
        }
        const bindings = resources.get(node) ?? [];
        if (bindings.some((binding) => binding.logicalResource === logicalResource)) {
          throw new Error("duplicate Vogui resource binding");
        }
        bindings.push({
          logicalResource,
          descriptor: new Uint8Array(reader.take(descriptorLength)),
        });
        resources.set(node, bindings);
        break;
      }
      default:
        throw new Error(`unknown Vogui source record ${tag}`);
    }
  }
  if (root === null || !nodes.has(root)) throw new Error("Vogui source root is missing");
  const active = new Set<number>();
  const visited = new Set<number>();
  const build = (id: number, depth: number, scopeKey: string | null): TargetView => {
    if (depth > MAX_DEPTH || active.has(id) || visited.has(id)) {
      throw new Error("Vogui source graph is not a tree");
    }
    const source = nodes.get(id);
    if (source === undefined) throw new Error("Vogui source references an unknown node");
    active.add(id);
    visited.add(id);
    if (source.kind === null) {
      const local = source.key ?? `builder-${source.builderId}`;
      const qualified = scopeKey === null ? `scope:${local}` : `${scopeKey}/${local}`;
      const child = build(source.children[0]!, depth + 1, qualified);
      active.delete(id);
      const mergedEvents = new Map(child.events);
      for (const [eventKind, mapperId] of events.get(id) ?? []) {
        if (mergedEvents.has(eventKind)) throw new Error("duplicate Vogui scope event binding");
        mergedEvents.set(eventKind, mapperId);
      }
      return {
        ...child,
        sourceIds: [...child.sourceIds, id],
        events: mergedEvents,
        refs: [...child.refs, ...(refs.get(id) ?? [])],
        resources: [...child.resources, ...(resources.get(id) ?? [])],
      };
    }
    const properties = new Map(source.properties);
    const kind = decodeViewKind(source.kind, properties);
    const key = scopeKey === null
      ? source.key
      : source.key === null ? scopeKey : `${scopeKey}/${source.key}`;
    const children = source.children.map((child) => build(child, depth + 1, null));
    active.delete(id);
    return {
      sourceIds: [id],
      key,
      kind,
      properties,
      children,
      events: events.get(id) ?? new Map(),
      refs: refs.get(id) ?? [],
      resources: resources.get(id) ?? [],
    };
  };
  const view = build(root, 1, null);
  if (visited.size !== nodes.size) throw new Error("Vogui source contains unreachable nodes");
  return view;
}

function decodeViewKind(kind: number, properties: Map<string, string>): ViewKind {
  switch (kind) {
    case 1: {
      const text = properties.get("text") ?? "";
      properties.delete("text");
      return { type: "text", text };
    }
    case 2: return { type: "element", tag: "img" };
    case 3: return { type: "element", tag: "button" };
    case 4:
      if (!properties.has("type")) properties.set("type", "text");
      return { type: "element", tag: "input" };
    case 5:
      if (!properties.has("type")) properties.set("type", "checkbox");
      return { type: "element", tag: "input" };
    case 6:
      if (!properties.has("type")) properties.set("type", "range");
      return { type: "element", tag: "input" };
    case 7: return { type: "element", tag: "ul" };
    case 8: return { type: "element", tag: "div" };
    default: throw new Error(`unknown Vogui semantic node kind ${kind}`);
  }
}

function decodeProperties(bytes: Uint8Array): Map<string, string> {
  if (bytes.byteLength === 0) return new Map();
  const reader = new ByteReader(bytes);
  if (reader.string(4) !== PROPERTY_MAGIC) throw new Error("invalid Vogui property block");
  const count = reader.u32();
  if (count > MAX_PROPERTIES_PER_NODE) throw new RangeError("Vogui property capacity exceeded");
  const properties = new Map<string, string>();
  for (let index = 0; index < count; index += 1) {
    const nameLength = reader.u16();
    const valueLength = reader.u32();
    if (
      nameLength === 0
      || nameLength > MAX_KEY_BYTES
      || valueLength > MAX_PROPERTY_BYTES
    ) {
      throw new RangeError("Vogui property entry is too large");
    }
    const name = reader.string(nameLength);
    const value = reader.string(valueLength);
    if (name.length === 0 || properties.has(name)) throw new Error("invalid Vogui property");
    properties.set(name, value);
  }
  if (!reader.done()) throw new Error("trailing Vogui property bytes");
  return properties;
}

function encodeTransaction(
  baseRevision: bigint,
  newRevision: bigint,
  root: GenerationalHandle,
  mutations: readonly Mutation[],
): Uint8Array {
  const writer = new ByteWriter(MAX_PACKET_BYTES - 56);
  writer.u64(baseRevision);
  writer.u64(newRevision);
  writer.handle(root);
  writer.u32(mutations.length);
  for (const mutation of mutations) {
    writer.u8(mutation.tag);
    switch (mutation.tag) {
      case 1:
        writer.handle(mutation.node);
        writer.optionalHandle(mutation.parent);
        writer.u32(mutation.index);
        break;
      case 2:
        writer.handle(mutation.node);
        break;
      case 3:
        writer.handle(mutation.node);
        writer.optionalHandle(mutation.parent);
        writer.u32(mutation.index);
        break;
      case 4:
        writer.handle(mutation.node);
        writer.u8(mutation.kind.type === "element" ? 1 : 2);
        writer.string(mutation.kind.type === "element" ? mutation.kind.tag : mutation.kind.text);
        break;
      case 5:
        writer.handle(mutation.node);
        writer.u32(mutation.properties.size);
        for (const [name, value] of mutation.properties) {
          writer.string(name);
          writer.string(value);
        }
        break;
      case 6:
        writer.handle(mutation.binding.node);
        writer.u8(mutation.binding.eventKind);
        writer.handle(mutation.binding.token);
        writer.u8(0);
        break;
      case 7:
        writer.handle(mutation.token);
        break;
      case 8:
        writer.handle(mutation.binding.node);
        writer.handle(mutation.binding.reference);
        writer.u32(mutation.binding.bindingGeneration);
        break;
      case 9:
        writer.handle(mutation.reference);
        break;
      case 10:
        writer.handle(mutation.node);
        writer.handle(mutation.resource);
        writer.u64(mutation.sourceRevision);
        break;
      case 11:
        writer.handle(mutation.node);
        writer.handle(mutation.resource);
        break;
    }
  }
  return writer.finish();
}

function visitTarget(view: TargetView, visitor: (view: TargetView) => void): void {
  const pending = [view];
  while (pending.length > 0) {
    const current = pending.pop()!;
    visitor(current);
    for (let index = current.children.length - 1; index >= 0; index -= 1) {
      pending.push(current.children[index]!);
    }
  }
}

function allocateHandle(generations: number[], free: number[]): GenerationalHandle {
  const index = free.pop();
  if (index !== undefined) return { index, generation: generations[index]! };
  if (generations.length >= 0xffff_ffff) throw new RangeError("Vogui handle capacity exhausted");
  generations.push(1);
  return { index: generations.length - 1, generation: 1 };
}

function releaseHandle(handle: GenerationalHandle, generations: number[], free: number[]): void {
  if (generations[handle.index] !== handle.generation) return;
  generations[handle.index] = nextGeneration(handle.generation);
  free.push(handle.index);
}

function nextGeneration(generation: number): number {
  if (generation >= 0xffff_ffff) throw new RangeError("Vogui handle generation exhausted");
  return generation + 1;
}

function sameKindIdentity(left: ViewKind, right: ViewKind): boolean {
  return left.type === right.type
    && (left.type !== "element" || right.type !== "element" || left.tag === right.tag);
}

function sameKind(left: ViewKind, right: ViewKind): boolean {
  return left.type === right.type
    && (left.type === "element"
      ? right.type === "element" && left.tag === right.tag
      : right.type === "text" && left.text === right.text);
}

function cloneKind(kind: ViewKind): ViewKind {
  return kind.type === "element"
    ? { type: "element", tag: kind.tag }
    : { type: "text", text: kind.text };
}

function sameProperties(
  left: ReadonlyMap<string, string>,
  right: ReadonlyMap<string, string>,
): boolean {
  if (left.size !== right.size) return false;
  for (const [name, value] of left) if (right.get(name) !== value) return false;
  return true;
}

function allocateSafeU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new RangeError(`invalid ${label}`);
  }
  return value;
}

function handleKey(handle: GenerationalHandle): string {
  return `${handle.index}:${handle.generation}`;
}

function sameHandle(left: GenerationalHandle, right: GenerationalHandle): boolean {
  return left.index === right.index && left.generation === right.generation;
}

function readHandle(bytes: Uint8Array, offset: number): GenerationalHandle {
  if (bytes.byteLength - offset < 8) throw new RangeError("truncated Vogui handle");
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  return { index: view.getUint32(0, true), generation: view.getUint32(4, true) };
}

function decodeOptionalString(bytes: Uint8Array): string | null {
  return bytes.byteLength === 0 ? null : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

class ByteReader {
  readonly #bytes: Uint8Array;
  #offset = 0;
  readonly #decoder = new TextDecoder("utf-8", { fatal: true });

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  done(): boolean {
    return this.#offset === this.#bytes.byteLength;
  }

  take(length: number): Uint8Array {
    allocateSafeU32(length, "byte length");
    if (length > this.#bytes.byteLength - this.#offset) throw new RangeError("truncated Vogui bytes");
    const bytes = this.#bytes.subarray(this.#offset, this.#offset + length);
    this.#offset += length;
    return bytes;
  }

  u8(): number {
    return this.take(1)[0]!;
  }

  u16(): number {
    const bytes = this.take(2);
    return new DataView(bytes.buffer, bytes.byteOffset, 2).getUint16(0, true);
  }

  u32(): number {
    const bytes = this.take(4);
    return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
  }

  safeU64(): number {
    const bytes = this.take(8);
    const value = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Vogui identity exceeds JS safe integer");
    return Number(value);
  }

  u64(): bigint {
    const bytes = this.take(8);
    return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
  }

  i64(): bigint {
    const bytes = this.take(8);
    return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigInt64(0, true);
  }

  string(length: number): string {
    return this.#decoder.decode(this.take(length));
  }
}

class ByteWriter {
  readonly #maxBytes: number;
  #bytes = new Uint8Array(256);
  #length = 0;
  readonly #encoder = new TextEncoder();

  constructor(maxBytes: number) {
    this.#maxBytes = maxBytes;
  }

  bytes(bytes: Uint8Array): void {
    this.#ensure(bytes.byteLength);
    this.#bytes.set(bytes, this.#length);
    this.#length += bytes.byteLength;
  }

  u8(value: number): void {
    this.#ensure(1);
    const encoded = allocateSafeU32(value, "u8");
    if (encoded > 0xff) throw new RangeError("invalid u8");
    this.#bytes[this.#length] = encoded;
    this.#length += 1;
  }

  u32(value: number): void {
    this.#ensure(4);
    new DataView(this.#bytes.buffer).setUint32(this.#length, allocateSafeU32(value, "u32"), true);
    this.#length += 4;
  }

  u16(value: number): void {
    this.#ensure(2);
    const encoded = allocateSafeU32(value, "u16");
    if (encoded > 0xffff) throw new RangeError("invalid u16");
    new DataView(this.#bytes.buffer).setUint16(this.#length, encoded, true);
    this.#length += 2;
  }

  u64(value: bigint): void {
    this.#ensure(8);
    new DataView(this.#bytes.buffer).setBigUint64(this.#length, value, true);
    this.#length += 8;
  }

  i64(value: bigint): void {
    this.#ensure(8);
    new DataView(this.#bytes.buffer).setBigInt64(this.#length, value, true);
    this.#length += 8;
  }

  handle(handle: GenerationalHandle): void {
    this.u32(handle.index);
    this.u32(handle.generation);
  }

  optionalHandle(handle: GenerationalHandle | null): void {
    this.u8(handle === null ? 0 : 1);
    if (handle !== null) this.handle(handle);
  }

  string(value: string): void {
    const bytes = this.#encoder.encode(value);
    this.u32(bytes.byteLength);
    this.bytes(bytes);
  }

  finish(): Uint8Array {
    return this.#bytes.slice(0, this.#length);
  }

  #ensure(length: number): void {
    const required = this.#length + length;
    if (!Number.isSafeInteger(required) || required > this.#maxBytes) {
      throw new RangeError("Vogui encoded packet capacity exceeded");
    }
    if (required <= this.#bytes.byteLength) return;
    let capacity = this.#bytes.byteLength;
    while (capacity < required) capacity = Math.min(this.#maxBytes, capacity * 2);
    const next = new Uint8Array(capacity);
    next.set(this.#bytes);
    this.#bytes = next;
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default new VoguiBrowserLogicProvider();
