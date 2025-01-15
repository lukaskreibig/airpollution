import { Step } from 'react-joyride';

const tourSteps: Step[] = [
  {
    target: '.map-area',
    content:
      "Welcome to MapTheAir!\n\nThis application monitors real-time air pollution data from countries worldwide. Let's take a quick tour to discover all the features!",
    placement: 'center',
    title: 'Welcome!',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.average-plot',
    content:
      'This is the Average Plot, which displays the average AQI for the selected Country.',
    placement: 'bottom',
    title: 'Average Plot',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.chart-dropdown',
    content:
      'Choose the view that best suits the insights you want to explore. Different views offer various perspectives on air quality data.',
    placement: 'bottom',
    title: 'Chart Selection',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.country-dropdown',
    content:
      'Select the country for which you would like to view air quality data.',
    placement: 'bottom',
    title: 'Country Selection',
    spotlightClicks: true,
  },
  {
    target: '.search-field',
    content:
      'Use this search bar to quickly locate specific cities or locations within the selected country.',
    placement: 'bottom',
    title: 'Search Function',
    spotlightClicks: true,
  },
  {
    target: '.choose-sort',
    content:
      'Sort the city list by Name or specific pollution criteria to organize the data according to your analysis needs.',
    placement: 'bottom',
    title: 'Sort Options',
    spotlightClicks: true,
  },
  {
    target: '.sort-select',
    content:
      'Click here to switch between ascending and descending order, refining how your sorted data is displayed.',
    placement: 'bottom',
    title: 'Sort Direction',
    spotlightClicks: true,
  },
  {
    target: '.close-list',
    content: 'Click here to toggle the sidebar and view the full map.',
    placement: 'bottom',
    title: 'Close Sidebar',
    spotlightClicks: true,
  },
  {
    target: '.map-area',
    content:
      'Hover over the map points to see detailed air quality information for each location. Have fun exploring!',
    placement: 'center',
    title: 'Interactive Map Points',
    spotlightClicks: true,
  },
];

export default tourSteps;
