import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Country } from '../../react-app-env';

type Props = {
  handleSelect: (value: string) => void;
  dataValue: string | undefined;
  dropdown: string;
  countries?: Country[];
  className?: string;
};

const Dropdown: React.FC<Props> = ({
  handleSelect,
  dataValue,
  dropdown,
  countries,
  className,
}) => {
  const timeData = [
    { input: 'day', description: 'Today' },
    { input: 'month', description: 'This Month' },
    { input: 'year', description: 'This Year' },
  ];

  const viewData = [
    { input: 'map', description: 'Map' },
    { input: 'insights', description: 'Insights' },
  ];

  let options: { value: string; label: string }[] = [];

  if (dropdown === 'Time') {
    options = timeData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  } else if (dropdown === 'Country' && countries) {
    options = countries
      .map((country) => ({
        value: String(country.id),
        label: country.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } else {
    options = viewData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  }

  if (dropdown === 'View') {
    return (
      <Box className={className}>
        <ToggleButtonGroup
          exclusive
          value={dataValue || 'map'}
          onChange={(_event, value) => {
            if (value) handleSelect(value);
          }}
          aria-label="View"
          size="small"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 2,
            boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)',
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              borderColor: 'rgba(17,24,39,0.12)',
              fontWeight: 800,
              textTransform: 'none',
            },
          }}
        >
          {options.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 120 }} className={className}>
      <FormControl fullWidth>
        <InputLabel id={`${dropdown}-select-label`}>{dropdown}</InputLabel>
        <Select
          labelId={`${dropdown}-select-label`}
          id={`${dropdown}-select`}
          value={dataValue || ''}
          name={dropdown}
          label={dropdown}
          onChange={(event) => handleSelect(event.target.value)}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
          }}
        >
          {options.map((option, index) => (
            <MenuItem value={option.value} key={index}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default Dropdown;
