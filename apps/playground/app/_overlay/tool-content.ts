import type { ComponentType } from 'react';
import { AirflowOverlay } from './AirflowOverlay';
import { AtlasOpaOverlay } from './AtlasOpaOverlay';
import { CompassOverlay } from './CompassOverlay';
import { DataGerryOverlay } from './DataGerryOverlay';
import { SupersetOverlay } from './SupersetOverlay';
import { TrinoOverlay } from './TrinoOverlay';

/**
 * The single registration point for mocked-tool overlay content (SPEC §4.8).
 * Tickets 12–16 add their tool body here; the uniform chrome (`ToolOverlay`)
 * stays unchanged. Keyed by component id.
 */
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
  trailhead: AirflowOverlay,
  overlook: TrinoOverlay,
  atlas: AtlasOpaOverlay,
  compass: CompassOverlay,
  superset: SupersetOverlay,
};