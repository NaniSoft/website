import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

// Capture the hover handler CommandCenter passes to KGCanvas so the test can
// drive the hover path that real pointer events would.
let lastHoverHandler: ((node: GraphNode | null) => void) | undefined;

vi.mock('@/components/KGCanvas', () => ({
  KGCanvas: (props: {
    onNodeHover?: (node: GraphNode | null) => void;
  }) => {
    lastHoverHandler = props.onNodeHover;
    return <div data-testid="kg-canvas-stub" />;
  },
}));

import { CommandCenter } from '@/components/CommandCenter';

const SAMPLE_LABEL = 'Sarah Chen';
const SAMPLE = graphData.nodes.find((n) => n.label === SAMPLE_LABEL)!;
const TARGET: GraphNode =
  graphData.nodes.find((n) => n.type === 'Service' && n.label === 'etl-pipeline') ??
  graphData.nodes.find((n) => n.type === 'Service') ??
  graphData.nodes[1];

describe('Hero right-rail hover preview (spec §5)', () => {
  beforeEach(() => {
    lastHoverHandler = undefined;
  });

  it('starts with the SAMPLE node and updates on hover without a click', () => {
    render(
      <ThemeProvider>
        <CommandCenter />
      </ThemeProvider>
    );

    const preview = screen.getByTestId('node-inspector-preview');

    // Initial state shows the spec-default SAMPLE node (Sarah Chen).
    expect(preview).toHaveAttribute('data-node-id', SAMPLE.id);
    expect(screen.getByTestId('preview-name')).toHaveTextContent(SAMPLE_LABEL);
    expect(screen.getByTestId('preview-type')).toHaveTextContent('User');

    // Hover updates the preview with no click required.
    expect(lastHoverHandler).toBeTypeOf('function');
    act(() => {
      lastHoverHandler?.(TARGET);
    });

    // Preview content visibly changes to the hovered node.
    expect(preview).toHaveAttribute('data-node-id', TARGET.id);
    expect(screen.getByTestId('preview-name')).toHaveTextContent(TARGET.label);
    expect(screen.getByTestId('preview-type')).toHaveTextContent(TARGET.type);
  });
});
