import { useEffect, useState } from "react";
import "./App.css";
import ChartList from "./components/ChartList/ChartList";
import Dropdown from "./components/Dropdown/Dropdown";
import { SelectChangeEvent, LinearProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const App: React.FC = () => {
  const [data, setData] = useState<data | null>(null);
  const [countriesList, setCountriesList] = useState<countries[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");

  const [time, setTime] = useState<string>("month");
  const [chart, setChart] = useState<string>("1");
  const [country, setCountry] = useState<string>("50");

  const [open, setOpen] = useState<boolean>(true);
  const handleClose = (): void => setOpen(false);

   /**
   * Fetching Data of the OpenAQ API
   * <p>
   * Fetch from three Endpoints from the OpenAQ Air Pollution API:
   * /averages - fetch the average data according to the chosen Time Span in the Dropdown Menu.
   * /locations - fetch the individual data of all Stations in the chosen Country in the Dropdown Menu.
   * /countries - fetch the countries which have Air Pollution Data so we can chose from them later.
   * 
   * The function checks for Error Messages and Shows them to the User.
   * If no Errors occur, each fetch will be stored in its own State.
   *
   * @author Lukas Kreibig
   */

   const baseUrl = 'https://airpollution-mocha.vercel.app/api/fetchData' 


  
useEffect((): void => {
  const getData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [latestFetch, countriesFetch] = await Promise.all([
        fetch(
          `${baseUrl}?path=/v2/latest&spatial=country&country_id=${country}&temporal=month&parameter=pm10&parameter=pm25&limit=1000`
        ),
        fetch(`${baseUrl}?path=/v3/countries`),
      ]);

      if (!latestFetch.ok || !countriesFetch.ok) {
        setLoading(false);
        throw new Error(
          `Oh No! A failure occurred fetching ${
            !latestFetch.ok
              ? `Latest Data ${latestFetch.status}`
              : `Country Data: ${countriesFetch.status}`
          }`
        );
      }

      const airQualityData = await latestFetch.json();
      const countriesData = await countriesFetch.json();

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


  useEffect(() => {
    console.log("data", data)
  },[data])

  useEffect(() => {
    console.log("countriesList", countriesList)
  },[countriesList])


  useEffect(() => {
    console.log("country", country)
  },[country])

  /**
   * Handles the User Selection of the Dropdown Menus
   * <p>
   * handleSelect is being passed down to every Dropdown Menu.
   * If the User Selects an entry in the Dropdown Menu, handle Select 
   * is being fired in App.tsx with the Parameter of the Dropdown Choice.
   * 
   * The event.targe.name is being checked, to identify the Dropdown Menu
   * in App.tsx. The new value is then accordingly stored in a State in App.tsx
   * and passed down children components.
   *
   * @author Lukas Kreibig
   */

  const handleSelect = (event: SelectChangeEvent) => {
    console.log("event.target.value", event.target.value)
    console.log("event.target.name", event.target.name)
    if (event.target.name === "Country") {
      setCountry(event.target.value as string);
    } else if (event.target.name === "Chart") {
      setChart(event.target.value as any);
    } else if (event.target.name === "Time") {
      setTime(event.target.value as any);
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
            This is an informal Graph that uses OpenAQ API to get you worldwide
            Air Pollution Data worldwide. Have fun playing around!
          </Typography>
        </Box>
      </Modal>

      <div className="dropdowncontainer">
        {
          <Dropdown
            handleSelect={handleSelect}
            dataValue={chart}
            dropdown={"Chart"}          
            />
        }
        {data && (
          <Dropdown
            handleSelect={handleSelect}
            dataValue={country}
            dropdown={"Country"}
            countries={countriesList}
          />
        )}
        {chart === "2" ? (
          <Dropdown
            handleSelect={handleSelect}
            dataValue={time}
            dropdown={"Time"}
          />
        ) : null}
      </div>
      {loading && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      {error && (
        <div
          className="charts"
          id="message"
        >{`Error fetching the data - ${error}`}</div>
      )}
      {!data && (
        <div className="charts" id="message">
          Loading Data for the first time. This might take a while!
        </div>
      )}
      {data && (
        <ChartList locations={data.results} chart={chart} />
      )}
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
