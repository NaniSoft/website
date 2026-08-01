'use client'

import type { Engine, ISourceOptions } from '@tsparticles/engine'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { useTheme } from 'nextra-theme-docs'
import { useCallback, useMemo } from 'react'
import { loadFull } from 'tsparticles'

const PanelParticles = () => {
  const { resolvedTheme } = useTheme()

  // Load the particles engine once. In @tsparticles/react v4 the
  // `initParticlesEngine` helper was replaced by the <ParticlesProvider init>
  // prop, so the engine is initialized through the provider instead of a
  // manual useEffect.
  const init = useCallback(async (engine: Engine) => {
    await loadFull(engine)
  }, [])

  const options = useMemo<ISourceOptions>(
    () => ({
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: resolvedTheme === 'light' ? '#9f9cbf' : '#c1c7d1',
        },
        links: {
          color: {
            value: resolvedTheme === 'light' ? '#9f9cbf' : '#c1c7d1',
          },
          distance: 120,
          enable: true,
          opacity: resolvedTheme === 'light' ? 0.2 : 0.1,
          width: 1,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 60,
        },
        opacity: {
          value: resolvedTheme === 'light' ? 0.2 : 0.15,
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [resolvedTheme],
  )

  return (
    <ParticlesProvider init={init}>
      <Particles
        className="max-sm:hidden pointer-events-none"
        options={options}
      />
    </ParticlesProvider>
  )
}

export {
  PanelParticles,
}
