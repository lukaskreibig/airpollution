import React, { useEffect } from 'react';
import { LatestResult, Country } from '../../react-app-env';
import Chart from './Chart/Chart';

type Props = {
  locations: LatestResult[];
  chart: string;
  country: string;
  countriesList: Country[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapLoadEnd?: () => void;
};

const ChartList: React.FC<Props> = ({
  locations,
  chart,
  country,
  countriesList,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
}) => {
  useEffect(() => {
    console.log('chart', chart);
  }, [chart]);

  if (!locations.length) {
    return (
      <div className="charts" id="message">
        No data found. Possibly no up-to-date data for this country.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', flex: 1 }}>
      <Chart
        locations={locations}
        chart={chart}
        country={country}
        countriesList={countriesList}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onMapLoadEnd={onMapLoadEnd}
      />
    </div>
  );
};

export default ChartList;
