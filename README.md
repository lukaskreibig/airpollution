# Map The Air - Air Quality Visualization Dashboard

An interactive web application for visualizing air quality data using **Plotly**, **Mapbox**, and **React**. This project allows users to explore air quality metrics such as PM2.5 and PM10 across various locations, providing rich visual insights and comparisons to WHO guidelines.

<img width="281" alt="MapTheAirLogo" src="https://github.com/user-attachments/assets/0b97bcec-71ac-4979-a690-6f6888c350d8" />

---

## 📋 Table of Contents

- [Features](#features)
- [Demo](#demo)
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

- **Sidebar with Search and Sorting**  
  Quickly filter and sort data by location name or air quality metrics (PM2.5, PM10).

- **Responsive Design**  
  Optimized for various devices, from desktops to tablets.

- **Color Thresholds**  
  Dynamic color coding for safe, moderate, unhealthy, and hazardous air quality levels.

---

## 🎥 Demo

Check out the live Beta here: <a href="https://www.maptheair.com/" target="_blank">Map The Air Beta</a>

---

## 🛠️ Installation

To run the application locally, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Install Dependencies**
   Ensure you have **Node.js** and **npm** installed. Then, run:
   ```bash
   npm install
   ```

3. **Set Environment Variables**
   Create a `.env` file in the root directory and configure it as follows:
   ```env
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   REACT_APP_API_BASE_URL=your_api_url
   ```

4. **Start the Development Server**
   ```bash
   npm start
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000` to view the application.

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

## 📁 Folder Structure

```plaintext
src
├── components
│   ├── ChartList
│   │   ├── Chart
│   │   │   ├── Chart.tsx
│   │   │   ├── ChartFunction.ts
│   │   │   └── styles.css
│   │   └── ChartList.tsx
│   ├── Sidebar
│   │   └── Sidebar.tsx
├── services
│   ├── api.ts
├── App.tsx
├── index.tsx
└── styles.css
```

---

## 🛠️ Technologies Used

- **React**: For building the user interface.
- **Plotly.js**: For interactive charts and data visualization.
- **Mapbox GL JS**: For rendering the map and geo-coordinates.
- **Material UI**: For styling components.
- **TypeScript**: For type safety and maintainability.

---

## 🌐 API Integration

The application integrates with the **OpenAQ API** for fetching real-time air quality data. Ensure you have the correct API base URL in the `.env` file:

```env
REACT_APP_API_BASE_URL=https://api.openaq.org/v1/
```

For more details, visit the [OpenAQ API Documentation](https://docs.openaq.org/).

---

## 👩‍💻 Development

### Running Tests
To run the test suite:
```bash
npm test
```

### Linting
To check for linting errors:
```bash
npm run lint
```

### Building for Production
To build the application for production:
```bash
npm run build
```

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push the branch to your fork.
4. Submit a pull request describing your changes.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

- **OpenAQ** for providing air quality data.
- **Mapbox** for the mapping platform.
- **Plotly** for interactive charting tools.

---

Happy coding! :tada:
