import Chart from "./Chart/Chart";

type Props = {
  locations: results;
  chart: string;
  average: data | null;
};

const ChartList: React.FC<Props> = ({ locations, chart, average }) => {

  // console.log("average in chartlist", average)

  return !locations.length ? (
    <div className="charts" id="message">
      No Data found. Probably there is no up-to-date data from the given
      country.
    </div>
  ) : (
    <div className="charts">
      {
        <Chart
          // average={average.results}
          locations={locations}
          chart={chart}
        />
      }
    </div>
  );
};

export default ChartList;
