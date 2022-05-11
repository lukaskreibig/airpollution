import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

type Props = {
  handleSelect: (event: SelectChangeEvent) => void;
  dataValue: string | undefined;
  dropdown: string;
  countries?: countries[];
};

const Dropdown: React.FC<Props> = ({
  handleSelect,
  dataValue,
  dropdown,
  countries,
}) => {
  let timeData = [
    { input: "day", description: "Today" },
    { input: "month", description: "This Month" },
    { input: "year", description: "This Year" },
  ];

  let chartData = [
    { input: "1", description: "Detailed Air Pollution Data" },
    { input: "3", description: "Latest Air Pollution Data" },
    { input: "2", description: "Average Air Pollution Data" },
  ];

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">{dropdown}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={dataValue}
          name={dropdown}
          label={dropdown}
          onChange={handleSelect}
        >
          {(dropdown === "Time"
            ? timeData
            : dropdown === "Country"
            ? countries!
            : chartData
          ).map((data: any, index: any) => (
            <MenuItem value={!countries ? data.input : data.code} key={index}>
              {!countries ? data.description : data.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default Dropdown;
