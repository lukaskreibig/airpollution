import { SelectChangeEvent } from "@mui/material";
import { render, screen } from "@testing-library/react";
import Dropdown from "../Dropdown";

const handleSelect = (event: SelectChangeEvent) => {
  if (event.target.name === "Country") {
    (event.target.value as string);};}


describe("Dropdown", () => {
  test("Testing Dropdown Time", async () => {
    render(
      <Dropdown handleSelect={handleSelect} dataValue={"day"} dropdown={"Time"} />
    );
    const TimeDropdown = screen.getByText(/Today/i);
    expect(TimeDropdown).toBeInTheDocument();
  });

  describe("Dropdown Charts", () => {
    test("Testing Dropdown Chart 1", async () => {
      render(
        <Dropdown handleSelect={handleSelect} dataValue={"1"} dropdown={"Chart"} />
      );
      const ChartDropdown = screen.getByText(/Detailed/i);
      expect(ChartDropdown).toBeInTheDocument();
    });

    test("Testing Dropdown Chart 2", async () => {
      render(
        <Dropdown handleSelect={handleSelect} dataValue={"2"} dropdown={"Chart"} />
      );
      const ChartDropdown = screen.getByText(/Average/i);
      expect(ChartDropdown).toBeInTheDocument();
    });

    test("Testing Dropdown Chart 3", async () => {
      render(
        <Dropdown handleSelect={handleSelect} dataValue={"3"} dropdown={"Chart"} />
      );
      const ChartDropdown = screen.getByText(/Latest/i);
      expect(ChartDropdown).toBeInTheDocument();
    });
  });

  test("Testing Dropdown Country", async () => {
    render(
      <Dropdown
        handleSelect={handleSelect}
        dataValue={"DE"}
        dropdown={"Country"}
        countries={[{
          cities: "Berlin",
          code: "DE",
          count: 10,
          firstUpdated: 12-10-2001,
          localUpdated: 12-10-2001,
          locations: 12,
          name: "Germany",
          parameters: ["test"],
          sources: 12
        },]}
      />
    );
    const CountryDropdown = screen.getByText(/Germany/i);
    expect(CountryDropdown).toBeInTheDocument();
  });
});


