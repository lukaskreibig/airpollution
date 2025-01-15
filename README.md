# Map The Air - Air Quality Visualization Dashboard (Beta)

An interactive web application for visualizing air quality data using **Plotly**, **Mapbox**, and **React**. This project allows users to explore air quality metrics such as PM2.5 and PM10 across various locations, providing rich visual insights and comparisons to WHO guidelines.

**Note:** This is a **Beta version**, and some features are still under development or subject to change based on user feedback.

<img width="281" alt="MapTheAirLogo" src="https://github.com/user-attachments/assets/0b97bcec-71ac-4979-a690-6f6888c350d8" />

---

## 🗋 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [What is AQI?](#what-is-aqi)
- [Installation](#installation)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Technologies Used](#technologies-used)
- [API Integration](#api-integration)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- **Interactive Map**  
  Visualize air quality metrics across locations using Mapbox. Threshold-based coloring provides instant insights into air quality conditions.

- **Mini Average Chart**  
  A sleek, collapsible chart displays average air quality data with WHO guideline comparisons.

- **Scatter Chart**  
  A compelling and different way of visualizing all the AQI values of a country.

- **Sidebar with Search and Sorting**  
  Quickly filter and sort data by location name or air quality metrics (PM2.5, PM10).

- **Color Thresholds**  
  Dynamic color coding for safe, moderate, unhealthy, and hazardous air quality levels.

---

## 🔥 Demo

Check out the live Beta here: <a href="https://www.maptheair.com/" target="_blank">Map The Air Beta</a>

---

## 💡 What is AQI?

**AQI** stands for **Air Quality Index**, a standardized scale used by environmental agencies (such as the **U.S. Environmental Protection Agency**) and adopted worldwide to communicate how polluted the air currently is or how polluted it is forecast to become.

- **Pollutants Monitored**: The AQI typically focuses on key pollutants: **PM2.5**, **PM10**, **O₃** (ozone), **NO₂** (nitrogen dioxide), **SO₂** (sulfur dioxide), and **CO** (carbon monoxide).
- **Breakpoints**: Each pollutant’s concentration is converted into a numerical range (0–500). These breakpoints are used to classify air quality into "Good," "Moderate," "Unhealthy," "Very Unhealthy," and "Hazardous."
- **Why It Matters**: A single AQI value helps the public quickly gauge overall air pollution levels and any associated health concerns. For example, an AQI under 50 usually indicates "Good" air quality, while values above 150 suggest that even healthy individuals could begin experiencing adverse symptoms.
- **WHO Guidelines**: Alongside the AQI scale, organizations like the **World Health Organization (WHO)** provide recommended thresholds for pollutants (e.g., PM2.5 < 15 µg/m³) to reduce health risks.
- **Use Cases**: Public health advisories, city planning, personal air quality monitors, and real-time pollution tracking apps rely on AQI to make data accessible and actionable for everyone.

### **How We Calculate AQI**

Our application uses the latest **real-time data** fetched from the **OpenAQ API**. While the methodology aligns closely with the official AQI calculation, slight differences exist due to real-time processing and simplified pollutant conversions for performance and user experience.

---

## 🚀 Usage

### Explore the Map

- Zoom in/out and pan around to explore air quality data across locations.
- Hover over data points for detailed metrics.

### Sidebar

- Search for specific locations by name.
- Sort data by PM2.5, PM10, or location name.

### Mini Average Chart

- View the average air quality metrics in a collapsible chart on the map.
- Compare the data against WHO guidelines.

---

## 🔄 Technologies Used

### Frontend Frameworks and Libraries

- **React**: For building the user interface, ensuring component reusability and state management.
- **Material UI**: For styling and theming the application with prebuilt components and accessibility in mind.
- **Plotly.js**: For creating highly interactive and customizable charts.
- **Mapbox GL JS**: For rendering detailed and interactive maps with customizable layers and markers.

### Backend and Data

- **TypeScript**: Ensures type safety and reduces runtime errors by catching issues during development.
- **OpenAQ API**: Fetches real-time air quality data from monitoring stations worldwide.

### Testing and Deployment

- **JEST**: A testing framework for writing and running unit tests to ensure application reliability.
- **React Testing Library**: For testing React components in a manner resembling real user interactions.
- **GitHub Actions**: Automates testing and continuous integration in the development pipeline.

### Tooling and Utilities

- **ESLint**: For maintaining code quality and enforcing consistent coding styles.
- **Prettier**: For automatic code formatting.
- **dotenv**: For managing environment variables locally.

---

## 🌐 API Integration

The application integrates with the **OpenAQ API** for fetching real-time air quality data.

---

**Explore the air quality around you with Map The Air!**
