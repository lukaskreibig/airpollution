import Chart from "./Chart/Chart";

type Props = {
  locations: results;
  chart: number;
  average: data | null;
};

const ChartList: React.FC<Props> = ({ locations, chart, average }) => {
  const dataPoints = locations.length;

  return !average?.results.length || !dataPoints ? (
    <div className="charts" id="message">
      No Data found. Probably there is no up-to-date data from the given
      country.
    </div>
  ) : (
    <div className="charts">
      {
        <Chart
          average={average.results}
          locations={locations}
          dataPoints={dataPoints}
          chart={chart}
        />
      }
    </div>
  );
};

export default ChartList;
