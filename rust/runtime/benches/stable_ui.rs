use std::hint::black_box;
use std::time::Instant;

use vogui_runtime::tree::{RetainedTree, TreeConfig, ViewKind, ViewNode};

const NODE_COUNT: usize = 10_000;
const WARMUP: usize = 20;
const DEFAULT_RUNS: usize = 200;
const MAX_RUNS: usize = 10_000_000;

fn main() {
    let runs = configured_runs("VOGUI_STABLE_RUNS");
    let mut tree = RetainedTree::new(TreeConfig::default()).expect("valid benchmark config");
    let children = (0..NODE_COUNT - 1)
        .map(|index| ViewNode {
            key: Some(format!("row-{index}")),
            kind: ViewKind::Text(format!("stable-{index}")),
            props: Default::default(),
            children: Vec::new(),
        })
        .collect();
    tree.reconcile(&ViewNode {
        key: Some(String::from("root")),
        kind: ViewKind::Element(String::from("column")),
        props: Default::default(),
        children,
    })
    .expect("initial stable UI fixture");
    let root = tree.root_node().expect("fixture root");
    let target = tree.children(root).expect("fixture children")[NODE_COUNT / 2];
    let (scope_hash, scope_generation) = tree
        .node_scope_identity(target)
        .expect("target scope identity");

    for iteration in 0..WARMUP {
        apply_small_scope(&mut tree, scope_hash, scope_generation, iteration as u64);
    }
    let mut samples = Vec::with_capacity(runs);
    let before = tree.instrumentation();
    for iteration in 0..runs {
        let start = Instant::now();
        apply_small_scope(
            &mut tree,
            scope_hash,
            scope_generation,
            (WARMUP + iteration) as u64,
        );
        samples.push(start.elapsed().as_nanos());
    }
    let after = tree.instrumentation();
    assert_eq!(
        after.scanned_nodes - before.scanned_nodes,
        runs as u64,
        "single-Scope benchmark scanned outside its owned node"
    );
    print_report("vogui-stable-ui-small-scope", runs, &mut samples, after);
}

fn apply_small_scope(
    tree: &mut RetainedTree,
    scope_hash: u64,
    scope_generation: u32,
    iteration: u64,
) {
    let transaction = tree
        .reconcile_scope(
            scope_hash,
            scope_generation,
            &ViewNode {
                key: Some(String::from("target")),
                kind: ViewKind::Text(format!("changed-{iteration}")),
                props: Default::default(),
                children: Vec::new(),
            },
        )
        .expect("small Scope reconcile");
    black_box(transaction);
}

fn print_report(
    name: &str,
    runs: usize,
    samples: &mut [u128],
    counters: vogui_runtime::tree::TreeInstrumentation,
) {
    samples.sort_unstable();
    println!(
        concat!(
            "{{\"name\":\"{}\",\"fixture_nodes\":{},\"warmup\":{},\"runs\":{},",
            "\"p50_ns\":{},\"p95_ns\":{},\"p99_ns\":{},\"max_ns\":{},",
            "\"scanned_nodes\":{},\"dirty_patches\":{},\"node_allocations\":{}}}"
        ),
        name,
        NODE_COUNT,
        WARMUP,
        runs,
        percentile(samples, 50),
        percentile(samples, 95),
        percentile(samples, 99),
        samples[samples.len() - 1],
        counters.scanned_nodes,
        counters.dirty_patches,
        counters.node_allocations,
    );
}

fn configured_runs(name: &str) -> usize {
    match std::env::var(name) {
        Ok(value) => value
            .parse::<usize>()
            .ok()
            .filter(|runs| (1..=MAX_RUNS).contains(runs))
            .unwrap_or_else(|| panic!("{name} must be an integer in 1..={MAX_RUNS}")),
        Err(std::env::VarError::NotPresent) => DEFAULT_RUNS,
        Err(std::env::VarError::NotUnicode(_)) => panic!("{name} must be valid UTF-8"),
    }
}

fn percentile(samples: &[u128], percentile: usize) -> u128 {
    let index = (samples.len() - 1) * percentile / 100;
    samples[index]
}
