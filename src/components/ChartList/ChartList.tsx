import { LatestResult } from "../../react-app-env";
import Chart from "./Chart/Chart";

type Props = {
  locations: LatestResult[];
  chart: string;
};

const ChartList: React.FC<Props> = ({ locations, chart }) => {
  return !locations.length ? (
    <div className="charts" id="message">
      No data found. There might be no up-to-date data from the selected country.
    </div>
  ) : (
    <div className="charts">
      <Chart locations={locations} chart={chart} />
    </div>
  );
};

export default ChartList;
