import { render, screen } from "@testing-library/react";
import ChartList from "../ChartList";

describe("ChartList Failure Messages", () => {
  test("Testing Failure Message without Data in ChartList", () => {
    render(<ChartList chart={"0"} locations={[{ average: 2}]} average={null} />);
    const NoDataFound = screen.getByText(/No Data found./i);
    expect(NoDataFound).toBeInTheDocument();
  });

  test("Testing Failure Message with Data in ChartList", () => {
    render(
      <ChartList
        locations={[{ parameters: [ "test" ] }]}
        chart={"0"}
        average={{ results: [{ parameter: "pm25" }] }}
      />
    );
    const NoDataFound = screen.queryByText(/No Data found./i);
    expect(NoDataFound).not.toBeInTheDocument();
  });
});
