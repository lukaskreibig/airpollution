import React from "react";
import { LatestResult, Country } from "../../react-app-env";
import Chart from "./Chart/Chart";

type Props = {
  locations: LatestResult[];
  chart: string;
  country: string;
  countriesList: Country[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChartList: React.FC<Props> = ({
  locations,
  chart,
  country,
  countriesList,
  showSidebar,
  setShowSidebar,
}) => {
  return !locations.length ? (
    <div className="charts" id="message">
      No data found. There might be no up-to-date data from the selected country.
    </div>
  ) : (
    <div style={{ width: '100%', flex: 1 }}>
      <Chart
          locations={locations}
          chart={chart}
          country={country}
          countriesList={countriesList} 
          showSidebar={showSidebar} 
          setShowSidebar={setShowSidebar} />
    </div>
  );
};

export default ChartList;
