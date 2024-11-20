// In ChartList.tsx

import Chart from "./Chart/Chart";

type Props = {
  locations: LatestResult[];
  chart: string;
};

const ChartList: React.FC<Props> = ({ locations, chart }) => {
  return !locations.length ? (
    <div className="charts" id="message">
      No Data found. Probably there is no up-to-date data from the given country.
    </div>
  ) : (
    <div className="charts">
      <Chart locations={locations} chart={chart} />
    </div>
  );
};

export default ChartList;
