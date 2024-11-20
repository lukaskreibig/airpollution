import { useEffect, useState } from "react";
import "./App.css";
import ChartList from "./components/ChartList/ChartList";
import Dropdown from "./components/Dropdown/Dropdown";
import { SelectChangeEvent, LinearProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Country, Data } from "./react-app-env";

const App: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [time, setTime] = useState<string>("month");
  const [chart, setChart] = useState<string>("1");
  const [country, setCountry] = useState<string>("50");

  const [open, setOpen] = useState<boolean>(true);
  const handleClose = (): void => setOpen(false);

  const baseUrl = "https://airpollution-mocha.vercel.app/api/fetchData";

  useEffect((): void => {
    const getData = async (): Promise<void> => {
      try {
        setLoading(true);
        const [latestFetch, countriesFetch] = await Promise.all([
          fetch(
            `${baseUrl}?path=/v2/latest&spatial=country&country_id=${country}&temporal=${time}&parameter=pm10&parameter=pm25&limit=1000`
          ),
          fetch(`${baseUrl}?path=/v3/countries`),
        ]);

        if (!latestFetch.ok || !countriesFetch.ok) {
          throw new Error(
            `Oh No! A failure occurred fetching ${
              !latestFetch.ok
                ? `Latest Data ${latestFetch.status}`
                : `Country Data: ${countriesFetch.status}`
            }`
          );
        }

        const airQualityData: Data = await latestFetch.json();
        const countriesData: { results: Country[] } = await countriesFetch.json();

        setData(airQualityData);
        setCountriesList(countriesData.results);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [time, country]);

  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === "Country") {
      setCountry(event.target.value as string);
    } else if (event.target.name === "Chart") {
      setChart(event.target.value as string);
    } else if (event.target.name === "Time") {
      setTime(event.target.value as string);
    }
  };

  return (
    <div className="App">
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h5" component="h3">
            Air Pollution Data
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            This is an informal graph that uses the OpenAQ API to provide worldwide air pollution data. Have fun exploring!
          </Typography>
        </Box>
      </Modal>

      <div className="dropdowncontainer">
        <Dropdown
          handleSelect={handleSelect}
          dataValue={chart}
          dropdown="Chart"
        />
        {countriesList.length > 0 && (
          <Dropdown
            handleSelect={handleSelect}
            dataValue={country}
            dropdown="Country"
            countries={countriesList}
          />
        )}
        {chart === "2" && (
          <Dropdown
            handleSelect={handleSelect}
            dataValue={time}
            dropdown="Time"
          />
        )}
      </div>
      {loading && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      {error && (
        <div className="charts" id="message">
          {`Error fetching the data - ${error}`}
        </div>
      )}
      {!data && !loading && (
        <div className="charts" id="message">
          Loading data for the first time. This might take a while!
        </div>
      )}
      {data && <ChartList locations={data.results} chart={chart} />}
    </div>
  );
};

export default App;

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  border: "1px solid #000",
  boxShadow: 24,
  p: 4,
};
