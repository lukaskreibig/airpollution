import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from '../Dropdown';

describe('Dropdown Component', () => {
  it('renders chart dropdown and updates on selection', async () => {
    const handleSelect = jest.fn();
    render(
      <Dropdown handleSelect={handleSelect} dataValue="2" dropdown="Chart" />
    );

    const chartSelect = screen.getByLabelText(/Chart/i);
    expect(chartSelect).toBeInTheDocument();

    fireEvent.mouseDown(chartSelect);

    const scatterOption = await screen.findByRole('option', {
      name: /Scatter Chart/i,
    });
    fireEvent.click(scatterOption);

    expect(handleSelect).toHaveBeenCalled();
  });

  it('renders country dropdown with countries', async () => {
    const handleSelect = jest.fn();
    const countries = [
      {
        id: 50,
        name: 'Germany',
        cities: 10,
        code: 'DE',
        count: 100,
        firstUpdated: '',
        lastUpdated: '',
        locations: 5,
        parameters: [],
        coordinates: { lat: 51.0, lon: 9.0 },
        sources: 1,
      },
    ];

    render(
      <Dropdown
        handleSelect={handleSelect}
        dataValue="50"
        dropdown="Country"
        countries={countries}
      />
    );

    const countrySelect = screen.getByLabelText(/Country/i);
    expect(countrySelect).toBeInTheDocument();
    fireEvent.mouseDown(countrySelect);

    // Instead of findByText, let's find the listbox and then find the option inside it.
    const listbox = await screen.findByRole('listbox', { name: /Country/i });
    const germanyOption = within(listbox).getByRole('option', {
      name: /Germany/i,
    });
    expect(germanyOption).toBeInTheDocument();
  });
});
