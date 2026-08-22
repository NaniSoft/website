/**
 * Per-tool canonical-action mutates (SPEC §4.8). Each is the *one honest act* a
 * single-stepping learner performs, and is also what auto-run's playbook step
 * calls — one code path per tool. Mutates a *clone* of the state (the reducer
 * clones before calling `apply`), so these are plain mutation code.
 */
import type { PlaygroundState } from './playground-state';

/**
 * DataGerry / Blueprint canonical action — the definitional hinge (SPEC §4.8):
 * add the `Sensitive: bool` field to the `Product` ObjectType before any data
 * flows. Idempotent (a no-op if `Sensitive` is already present). Creates the
 * `Product` ObjectType defensively if it is absent.
 *
 * Used by step 1's `apply` AND by the overlay's "Add Sensitive: bool" button —
 * the one code path.
 */
export function authorSensitiveProductField(state: PlaygroundState): void {
  let product = state.schemaRegistry.Product;
  if (!product) {
    product = { name: 'Product', fields: [] };
    state.schemaRegistry.Product = product;
  }
  if (!product.fields.some((f) => f.name === 'Sensitive')) {
    product.fields.push({ name: 'Sensitive', type: 'bool' });
  }
}

/**
 * Airflow / Trailhead canonical action — trigger the ingestion DAG (SPEC §4.8):
 * land the raw extracted rows into Bronze (`bronze.products`, `bronze.view_logs`).
 * Idempotent — re-sets Bronze from the in-browser source rows (a no-op in effect
 * once already loaded; the overlay's "already run" guard is `bronze.products.length`).
 *
 * Used by step 7's `apply` AND by the overlay's "Run this DAG" button — the one
 * code path. Reads none (the DAG config / source rows are static in the mock).
 */
export function loadBronze(state: PlaygroundState): void {
  state.bronze = { products: state.products, viewLogs: state.viewLogs };
}