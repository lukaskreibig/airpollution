/**
 * @file Legend.test.tsx
 * @desc Unit tests for the Legend overlay component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Legend from '../Legend';

describe('Legend component', () => {
  it('does not render if chart !== "2"', () => {
    const { queryByText } = render(<Legend chart="1" showSidebar={false} />);
    expect(queryByText(/AQI Legend/i)).not.toBeInTheDocument();
  });

  it('renders the legend if chart="2"', () => {
    render(<Legend chart="2" showSidebar={false} />);
    expect(screen.getByText(/AQI Legend/i)).toBeInTheDocument();
    expect(screen.getByText(/0-50 \(Good\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/101-150 \(Unhealthy for Sensitive Groups\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/201-300 \(Very Unhealthy\)/i)).toBeInTheDocument();
    expect(screen.getByText(/301\+ \(Hazardous\)/i)).toBeInTheDocument();
  });

  it('applies left: 310px style if showSidebar is true', () => {
    const { container } = render(<Legend chart="2" showSidebar={true} />);
    // We expect the container to have inline style "left: 310px"
    const legendBox = container.firstChild as HTMLElement;
    expect(legendBox).toHaveStyle('left: 310px');
  });
});
