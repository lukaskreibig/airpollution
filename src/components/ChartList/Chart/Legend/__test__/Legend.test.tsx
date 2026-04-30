/**
 * @file Legend.test.tsx
 * @desc Unit tests for the Legend overlay component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Legend from '../Legend';

describe('Legend component', () => {
  it('renders the legend', () => {
    render(<Legend showSidebar={false} />);
    expect(screen.getByText(/AQI Legend/i)).toBeInTheDocument();
    expect(screen.getByText(/0-50 \(Good\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/101-150 \(Unhealthy for Sensitive Groups\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/201-300 \(Very Unhealthy\)/i)).toBeInTheDocument();
    expect(screen.getByText(/301\+ \(Hazardous\)/i)).toBeInTheDocument();
  });

  it('applies left: 310px style if showSidebar is true', () => {
    const { container } = render(<Legend showSidebar={true} />);
    // We expect the container to have inline style "left: 310px"
    const legendBox = container.firstChild as HTMLElement;
    expect(legendBox).toHaveStyle('left: 310px');
  });
});
