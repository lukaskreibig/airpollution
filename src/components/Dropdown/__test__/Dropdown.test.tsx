import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';

interface Country {
  id: number;
  name: string;
  code: string;
}

export interface DropdownProps {
  handleSelect: (e: SelectChangeEvent) => void;
  dataValue: string;
  dropdown: 'View' | 'Chart' | 'Country';
  /** optional – nur für Country-Dropdown */
  countries?: Country[];
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  handleSelect,
  dataValue,
  dropdown,
  countries = [],
  className,
}) => {
  const label = dropdown === 'Country' ? 'Country' : dropdown;

  return (
    <FormControl size="small" className={className}>
      <InputLabel>{label}</InputLabel>
      <Select
        name={dropdown}
        value={dataValue}
        label={label}
        onChange={handleSelect}
      >
        {dropdown === 'View' && (
          <>
            <MenuItem value="1">Scatter Chart</MenuItem>
            <MenuItem value="2">Map</MenuItem>
          </>
        )}
        {dropdown === 'Chart' && (
          <>
            <MenuItem value="1">Scatter Chart</MenuItem>
            <MenuItem value="2">Average Gauge</MenuItem>
          </>
        )}
        {dropdown === 'Country' &&
          countries.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default Dropdown;
