# EvapoScore - Global Evaporation Engine Feasibility Visualization

**Try it live:** https://evapo-score.vercel.app/

This is an interactive web app that shows where evaporation-driven engines could work best around the world. It uses MapLibre to display results for 250+ cities and calculates power potential using climate data.

## What This Does

I built this to figure out where evaporation-driven engines would actually work in the real world. These engines use water evaporation to generate power - pretty cool concept, right? The app looks at climate data for cities around the world and calculates how much power you could theoretically get using the Penman Equation.

The main things it looks at are:
- Temperature
- Relative Humidity  
- Wind Speed
- Solar Radiation

It's based on a competition project I worked on, and I thought it'd be useful to visualize the results globally.

## Features

- **Interactive Map**: Explore 250+ cities worldwide
- **Real-time Calculations**: Power potential calculated using the Penman Equation
- **Color-coded Markers**: Visual indication of power potential
  - Red: Excellent (>200 W/m²)
  - Orange: Very Good (150-200 W/m²)
  - Yellow: Good (100-150 W/m²)
  - Light Blue: Moderate (50-100 W/m²)
  - Dark Blue: Low (<50 W/m²)
- **Detailed Popups**: Click markers for climate data and analysis
- **Top Cities View**: Quickly identify the best locations
- **Heatmap Mode**: Alternative visualization of power distribution
- **Global Statistics**: Average power, city count, and best location

## Getting Started

Super simple - just open `index.html` in your browser. No npm install, no build step, nothing fancy. Just download the files and open it.

If you want to run it locally:
```bash
# Clone the repo
git clone https://github.com/ameya1232/EvapoScore.git
cd EvapoScore

# Then just open index.html in your browser
open index.html    # on Mac
# or double-click it, whatever works
```

### Files Structure

```
EvapoScore/
├── index.html              # Main HTML file
├── capitals-data.js        # Cities dataset (250+ cities)
├── evaporation-calc.js     # Penman equation implementation
├── map.js                  # MapLibre visualization logic
└── README.md              # This file
```

## How It Works

The math behind this uses the Penman Equation to figure out how fast water evaporates:

```
E_pr = (Δ · R_n + 2.6 · c_t · L_v · ρ_w · γ · (1 + 0.54 · u_a) · D_a) / (Δ + γ)
```

Where:
- `E_pr`: Evaporation rate (mm/day)
- `Δ`: Rate of change of saturation vapor pressure with temperature
- `R_n`: Net radiation (W/m²)
- `γ`: Psychrometric constant (0.067 kPa/K)
- `u_a`: Wind speed (m/s)
- `D_a`: Vapor pressure deficit (kPa)
- `L_v`: Latent heat of vaporization (2448 MJ/Mg)
- `ρ_w`: Density of water (1 Mg/m³)

Then it calculates the max power you could get from an engine:

```
P/A = c_e · E_pr · R · T_air · ln(RH_wet / RH_air)
```

Where:
- `P/A`: Power per area (W/m²)
- `R`: Ideal gas constant (8.314 J/(mol·K))
- `T_air`: Air temperature (K)
- `RH_wet`: Relative humidity at water surface (~97.5%)
- `RH_air`: Ambient relative humidity

## How to Use

1. **Explore the Map**: Pan and zoom to explore different regions
2. **Click Markers**: View detailed climate data and power calculations for each city
3. **Use Controls**:
   - **Top 10 Cities**: Highlights and zooms to the best locations
   - **Reset View**: Returns to global view
   - **Toggle Heatmap**: Switch between marker and heatmap visualization

## Key Findings

Based on the analysis, cities with the highest evaporation engine potential typically have:
- **Low relative humidity** (dry climates)
- **High solar radiation** (sunny regions)
- **Moderate to high temperatures**
- **Good wind speeds**

Optimal regions include:
- Middle Eastern deserts (UAE, Saudi Arabia, Qatar)
- North African cities (Egypt, Algeria)
- Parts of Australia
- Southwestern United States

## Technical Stuff

Right now it estimates climate data based on where cities are located. I pulled real data from the Open-Meteo API for 250+ cities, but the code also has a fallback estimation method. Here's how you could fetch real data:

```javascript
// Example API call structure (included in code)
const url = `https://archive-api.open-meteo.com/v1/archive?
    latitude=${lat}&longitude=${lon}&
    start_date=2023-01-01&end_date=2023-12-31&
    daily=temperature_2m_mean,relative_humidity_2m_mean,
    wind_speed_10m_mean,shortwave_radiation_sum`;
```

### MapLibre GL JS

Uses MapLibre GL JS for:
- Vector and raster tile rendering
- Interactive markers with custom styling
- Heatmap visualization
- Smooth animations and transitions

## Why I Built This

This started as a competition project, but I thought it was interesting enough to turn into a real web app. It's a good example of:
- Using thermodynamics in real applications
- Working with climate data
- Building interactive maps
- Analyzing renewable energy potential

## Things I Might Add Later

- Real-time data from Open-Meteo API (right now it's mostly estimated)
- Show how power changes by season
- Add info about water availability in each area
- Maybe a cost calculator
- Better mobile support

## References

1. **Park, Y., & Chen, X. (2020).** Water-responsive materials for sustainable energy applications. *Journal of Materials Chemistry A*, 8(31), 15227–15244.

2. **Penman, H.L. (1948).** Natural evaporation from open water, bare soil and grass. *Proceedings of the Royal Society of London. Series A*, 193(1032), 120-145.

3. **Open-Meteo API**: Historical weather data archive - https://open-meteo.com

## License

This project is created for educational purposes as part of the WSS Competition Project.

## Contributing

Feel free to submit PRs or issues! Some things that would be helpful:
- More cities in the dataset
- Better climate estimation
- Real-time weather integration
- More map features

## Known Limitations

- Climate data is currently estimated, not from real weather stations
- Does not account for water body availability in each location
- Simplified net radiation calculation
- Does not include seasonal variations in detail
- Engine efficiency assumptions may vary from real-world performance

## Contact

Questions? Check out the research report or open an issue on GitHub.

---

Made for understanding renewable energy potential worldwide
