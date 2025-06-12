import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface DropdownProps {
  handleSelect: (event: SelectChangeEvent) => void;
  dataValue: string;
  dropdown: string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  handleSelect,
  dataValue,
  dropdown,
  className,
}) => {
  return (
    <FormControl size="small" variant="outlined" className={className}>
      <InputLabel>{dropdown}</InputLabel>
      <Select
        name={dropdown}
        value={dataValue}
        onChange={handleSelect}
        label={dropdown}
      >
        <MenuItem value="1">Scatter View</MenuItem>
        <MenuItem value="2">Map View</MenuItem>
      </Select>
    </FormControl>
  );
};

export default Dropdown;
