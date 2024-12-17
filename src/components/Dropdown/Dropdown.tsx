import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { Country } from "../../react-app-env";

type Props = {
  handleSelect: (event: SelectChangeEvent) => void;
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
    { input: "day", description: "Today" },
    { input: "month", description: "This Month" },
    { input: "year", description: "This Year" },
  ];

  const chartData = [
    { input: "1", description: "Scatter Chart" },
    { input: "2", description: "Average Charts" },
    { input: "3", description: "Map View" },
  ];

  let options: { value: string; label: string }[] = [];

  if (dropdown === "Time") {
    options = timeData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  } else if (dropdown === "Country" && countries) {
    options = countries
    .map((country) => ({
      value: String(country.id),
      label: country.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  } else {
    options = chartData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  }

  return (
    <Box sx={{ minWidth: 120 }} className={className} >
      <FormControl fullWidth>
        <InputLabel id={`${dropdown}-select-label`}>{dropdown}</InputLabel>
        <Select
          labelId={`${dropdown}-select-label`}
          id={`${dropdown}-select`}
          value={dataValue || ""}
          name={dropdown}
          label={dropdown}
          onChange={handleSelect}
          sx={{            
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }}}
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
