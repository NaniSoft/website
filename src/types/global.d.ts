// Global type augmentations — imported once, applies to the whole TS program.
// `@total-typescript/ts-reset` tightens built-in types (JSON.parse returns
// `unknown`, Array.from narrowing, etc.) for safer runtime validation. Keep
// this as a side-effect-only module; no exports needed.
import '@total-typescript/ts-reset'
