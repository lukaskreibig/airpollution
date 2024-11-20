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
};

const Dropdown: React.FC<Props> = ({
  handleSelect,
  dataValue,
  dropdown,
  countries,
}) => {
  const timeData = [
    { input: "day", description: "Today" },
    { input: "month", description: "This Month" },
    { input: "year", description: "This Year" },
  ];

  const chartData = [
    { input: "1", description: "Detailed Air Pollution Data" },
    { input: "3", description: "Latest Air Pollution Data" },
    { input: "2", description: "Average Air Pollution Data" },
  ];

  let options: { value: string; label: string }[] = [];

  if (dropdown === "Time") {
    options = timeData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  } else if (dropdown === "Country" && countries) {
    options = countries.map((country) => ({
      value: String(country.id),
      label: country.name,
    }));
  } else {
    options = chartData.map((data) => ({
      value: data.input,
      label: data.description,
    }));
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id={`${dropdown}-select-label`}>{dropdown}</InputLabel>
        <Select
          labelId={`${dropdown}-select-label`}
          id={`${dropdown}-select`}
          value={dataValue || ""}
          name={dropdown}
          label={dropdown}
          onChange={handleSelect}
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
