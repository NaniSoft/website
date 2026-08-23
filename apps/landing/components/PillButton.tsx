'use client';

import { Button } from 'antd';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Button>, 'shape'>;

/**
 * The landing's only button: antd's Button pinned to shape="round", which
 * sets the radius to the control height — a true pill. Encodes the SPEC §2
 * shape lock ("buttons are pills") in code so it can't be forgotten
 * per-instance. antd v6 offers no global component-token override for this.
 */
export function PillButton({ ...rest }: Props) {
  return <Button {...rest} shape="round" />;
}
