import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// antd components used by kept sections schedule async state updates after
// mount that land outside RTL's initial act() wrapper in jsdom. Flushing the
// macrotask queue settles those updates before assertions.
async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderPage() {
  return render(
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

describe('Page shell (nanisoft)', () => {
  it('renders the W1 wordmark in the top nav and footer', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getAllByRole('img', { name: 'nanisoft' })).toHaveLength(2);
  });

  it('renders the positioning line (digital twin of the IT estate)', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getAllByText(/digital twin of the IT estate/i).length).toBeGreaterThan(0);
  });

  it('has a skip link', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders the main landmark', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('keeps the five narrative sections', async () => {
    renderPage();
    await flushAntd();
    for (const id of ['problem', 'platform', 'use-cases', 'integrations', 'final-cta']) {
      expect(document.getElementById(id, )).not.toBeNull();
    }
  });

  it('no longer renders the retired Sentinel-demo components', async () => {
    renderPage();
    await flushAntd();
    // Markers of the retired sections: Agents demo, knowledge-graph demo,
    // testimonial.
    expect(screen.queryByText('Ask in plain English. Get cited answers.')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore the live graph.')).not.toBeInTheDocument();
    expect(screen.queryByText('Priya Raman')).not.toBeInTheDocument();
    // No Sentinel branding anywhere on the rendered surface.
    expect(screen.queryAllByText(/Sentinel/i)).toHaveLength(0);
  });

  it('hands off from the datalake path into the architecture walkthrough', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/the next section walks the full pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /built like a lakehouse/i })).toBeInTheDocument();
  });

  it('names the flagship unlock and keeps the section free of dead links', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/Sensitive Product View Audit/)).toBeInTheDocument();
    expect(screen.getByText('Flagship · available today')).toBeInTheDocument();
    const section = document.getElementById('use-cases');
    expect(section?.querySelectorAll('a[href="#"]')).toHaveLength(0);
    const more = screen.getByRole('link', { name: /see the flagship run today in the playground/i });
    expect(more.getAttribute('href')).toBe('https://playground.nanisoft.com');
  });

  it('states the approach: sixteen off-the-shelf products, four built in-house', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/Sixteen proven open-source products carry the platform/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Built in-house' })).toBeInTheDocument();
    for (const name of ['Atlas', 'Compass', 'DataGerry Bridge', 'Scout']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText('+40')).not.toBeInTheDocument();
  });
});
