// Map visualization for evaporation engine analysis

let map;
let citiesData = [];
let markers = [];
let heatmapVisible = false;
let currentPopup = null;

// Climate data cache
const climateCache = new Map();

function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [20, 20],
        zoom: 2,
        attributionControl: true
    });

    map.on('load', () => {
        loadCitiesData();
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
}

function estimateClimateData(lat, lon) {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (climateCache.has(cacheKey)) {
        return climateCache.get(cacheKey);
    }

    const absLat = Math.abs(lat);

    // Base temperature calculation with seasonal variation
    let avgTemp = 30 - (absLat * 0.6);

    // Base humidity
    let avgHumidity = 0.7 - (absLat * 0.005);

    // Wind speed (higher in mid-latitudes and coastal areas)
    let avgWindSpeed = 2 + Math.abs(Math.sin(absLat * Math.PI / 90)) * 3;

    // Solar radiation (higher near equator)
    let avgSolarRadiation = 250 - (absLat * 2.5);

    // Regional climate adjustments with higher resolution

    // DESERT REGIONS (Hot, Dry - Excellent for evaporation engines)
    // Sahara Desert
    if (lat > 15 && lat < 35 && lon > -15 && lon < 40) {
        avgTemp += 8;
        avgHumidity -= 0.4;
        avgSolarRadiation += 80;
        avgWindSpeed += 1;
    }

    // Arabian Peninsula
    if (lat > 12 && lat < 32 && lon > 34 && lon < 60) {
        avgTemp += 10;
        avgHumidity -= 0.45;
        avgSolarRadiation += 100;
        avgWindSpeed += 2;
    }

    // Southwestern US Desert
    if (lat > 25 && lat < 40 && lon > -120 && lon < -100) {
        avgTemp += 5;
        avgHumidity -= 0.35;
        avgSolarRadiation += 60;
    }

    // Australian Outback
    if (lat < -15 && lat > -35 && lon > 110 && lon < 145) {
        avgTemp += 7;
        avgHumidity -= 0.38;
        avgSolarRadiation += 70;
    }

    // Atacama Desert (Chile)
    if (lat < -15 && lat > -30 && lon > -75 && lon < -65) {
        avgTemp += 4;
        avgHumidity -= 0.42;
        avgSolarRadiation += 85;
    }

    // HUMID REGIONS
    // Southeast Asian Monsoon
    if (lat > -10 && lat < 30 && lon > 90 && lon < 140) {
        avgHumidity += 0.2;
        avgSolarRadiation -= 30;
        avgTemp += 2;
    }

    // Amazon Rainforest
    if (lat > -10 && lat < 5 && lon > -75 && lon < -45) {
        avgHumidity += 0.25;
        avgSolarRadiation -= 40;
    }

    // Equatorial Africa
    if (lat > -10 && lat < 10 && lon > 5 && lon < 40) {
        avgHumidity += 0.2;
        avgSolarRadiation -= 25;
    }

    // MEDITERRANEAN CLIMATE
    if (lat > 30 && lat < 45 && lon > -10 && lon < 40) {
        avgTemp += 3;
        avgHumidity -= 0.15;
        avgSolarRadiation += 30;
    }

    // COASTAL ADJUSTMENTS
    const isCoastal = (
        (Math.abs(lon) < 20 && Math.abs(lat) < 40) || // Atlantic coast
        (lon > 100 && lon < 130 && lat > 20) || // East Asian coast
        (lon > -130 && lon < -110) // Pacific coast Americas
    );
    if (isCoastal) {
        avgHumidity += 0.1;
        avgWindSpeed += 1.5;
    }

    const climate = {
        avgTemp: Math.max(-10, Math.min(45, avgTemp)),
        avgHumidity: Math.max(0.15, Math.min(0.95, avgHumidity)),
        avgWindSpeed: Math.max(1, Math.min(10, avgWindSpeed)),
        avgSolarRadiation: Math.max(50, Math.min(400, avgSolarRadiation))
    };

    climateCache.set(cacheKey, climate);
    return climate;
}

async function loadCitiesData() {
    const loadingEl = document.getElementById('loading');

    try {
        for (let i = 0; i < capitalCities.length; i++) {
            const city = capitalCities[i];

            loadingEl.querySelector('p').textContent =
                `Analyzing ${city.name} (${i + 1}/250+)...`;

            const climate = estimateClimateData(city.lat, city.lon);
            let power = evapCalc.estimatePowerFromClimateaverages(climate);
            
            // Use measured data for Beirut if available
            if (city.measuredData && city.name === 'Beirut') {
                power = city.measuredData.mean;
            }
            
            const category = evapCalc.getPowerCategory(power);

            citiesData.push({
                ...city,
                climate: climate,
                power: power,
                category: category
            });

            await new Promise(resolve => setTimeout(resolve, 2));
        }

        citiesData.sort((a, b) => b.power - a.power);
        loadingEl.style.display = 'none';

        createMarkers();
        createHeatmapLayer();
        createCountryGradients();
        updateStatistics();

    } catch (error) {
        console.error('Error loading data:', error);
        loadingEl.querySelector('p').textContent = 'Error loading data. Please refresh.';
    }
}

function createMarkers() {
    citiesData.forEach(city => {
        // Create wrapper to prevent positioning issues
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '0';
        wrapper.style.height = '0';
        
        const el = document.createElement('div');
        el.className = 'marker';

        // Scale marker size by power and population
        const baseSize = 12;
        const powerFactor = Math.min(city.power / 100, 2);
        const size = baseSize + (powerFactor * 8);

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = city.category.color;
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.transition = 'transform 0.2s ease';
        el.style.transformOrigin = 'center center';
        el.style.display = 'block';
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.marginLeft = `-${size/2}px`;
        el.style.marginTop = `-${size/2}px`;
        
        wrapper.appendChild(el);

        // Create popup content
        const popupContent = `
            <div style="min-width: 280px;">
                <h3 style="margin-bottom: 12px; font-size: 18px; border-bottom: 2px solid ${city.category.color}; padding-bottom: 8px;">
                    ${city.name}, ${city.country}
                </h3>
                <div style="background: rgba(102, 126, 234, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Power Potential:</strong> <span style="color: ${city.category.color}; font-weight: bold;">${city.power.toFixed(1)} W/m²</span></p>
                    ${city.measuredData ? `<p style="margin: 5px 0; font-size: 12px; color: #888;">Measured: Mean ${city.measuredData.mean} W/m² (Range: ${city.measuredData.min}-${city.measuredData.max}, σ=${city.measuredData.stdDev})</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Rating:</strong> ${city.category.label}</p>
                </div>
                <p style="font-size: 12px; margin: 8px 0;"><strong>Population:</strong> ${city.population.toLocaleString()}</p>
                <p style="font-size: 12px; margin: 8px 0;"><strong>Continent:</strong> ${city.continent}</p>
                <hr style="margin: 12px 0; border: none; border-top: 1px solid #444;">
                <p style="font-size: 13px; font-weight: bold; margin: 8px 0;">Climate Factors:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <p>Temp: ${city.climate.avgTemp.toFixed(1)}°C</p>
                    <p>Humidity: ${(city.climate.avgHumidity * 100).toFixed(0)}%</p>
                    <p>Wind: ${city.climate.avgWindSpeed.toFixed(1)} m/s</p>
                    <p>Solar: ${city.climate.avgSolarRadiation.toFixed(0)} W/m²</p>
                </div>
                <hr style="margin: 12px 0; border: none; border-top: 1px solid #444;">
                <p style="font-size: 11px; color: #999; font-style: italic; margin-top: 10px;">${city.category.description}</p>
                <p style="font-size: 10px; color: #666; margin-top: 8px;">For 1 MW: ${evapCalc.calculateRequiredArea(1000, city.power, 0.1).toFixed(0).toLocaleString()} m² needed</p>
            </div>
        `;

        const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            maxWidth: '350px'
        }).setHTML(popupContent);

        let hoverTimeout = null;

        // Show popup on hover
        wrapper.addEventListener('mouseenter', () => {
            // Clear any pending hide timeout
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }

            // Scale marker without affecting position
            el.style.transform = 'scale(1.5)';
            el.style.zIndex = '1000';

            // Show popup
            if (!popup.isOpen()) {
                popup.setLngLat([city.lon, city.lat]).addTo(map);
            }
            currentPopup = popup;
        });

        wrapper.addEventListener('mouseleave', () => {
            // Reset marker size
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';

            // Remove popup immediately when leaving
            if (popup.isOpen()) {
                popup.remove();
                currentPopup = null;
            }
        });

        // Keep popup open when hovering over it
        popup.on('open', () => {
            const popupEl = popup.getElement();
            if (popupEl) {
                popupEl.addEventListener('mouseenter', () => {
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        hoverTimeout = null;
                    }
                    currentPopup = popup;
                });

                popupEl.addEventListener('mouseleave', () => {
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                    }
                    popup.remove();
                    currentPopup = null;
                });
            }
        });

        const marker = new maplibregl.Marker({ element: wrapper })
            .setLngLat([city.lon, city.lat])
            .addTo(map);

        // Store references
        markers.push({ marker, city, popup, element: el, wrapper: wrapper });
    });
}

function createHeatmapLayer() {
    if (map.getSource('cities-heat')) {
        return;
    }

    map.addSource('cities-heat', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: citiesData.map(city => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [city.lon, city.lat]
                },
                properties: {
                    power: city.power,
                    population: city.population
                }
            }))
        }
    });

    map.addLayer({
        id: 'cities-heat',
        type: 'heatmap',
        source: 'cities-heat',
        paint: {
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'power'],
                0, 0,
                50, 0.2,
                100, 0.4,
                150, 0.6,
                200, 0.8,
                300, 1
            ],
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3
            ],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 15,
                5, 30,
                10, 50
            ],
            'heatmap-opacity': 0.7
        },
        layout: {
            'visibility': 'none'
        }
    });
}

function updateStatistics() {
    const avgPower = citiesData.reduce((sum, city) => sum + city.power, 0) / citiesData.length;
    const bestCity = citiesData[0];

    document.getElementById('cityCount').textContent = citiesData.length;
    document.getElementById('avgPower').textContent = avgPower.toFixed(1);
    document.getElementById('bestCity').textContent = `${bestCity.name} (${bestCity.power.toFixed(1)} W/m²)`;
}

function showTopCities() {
    const top10 = citiesData.slice(0, 10);

    const bounds = new maplibregl.LngLatBounds();
    top10.forEach(city => {
        bounds.extend([city.lon, city.lat]);
    });

    map.fitBounds(bounds, { padding: 100, maxZoom: 5 });

    markers.forEach(({ element, city }) => {
        if (element && top10.includes(city)) {
            // Ensure visibility
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.transform = 'scale(1.8)';
            element.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.9)';
            element.style.border = '3px solid gold';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                element.style.border = '2px solid white';
            }, 2500);
        }
    });

    // Show alert with top cities
    setTimeout(() => {
        const topList = top10.map((c, i) => `${i + 1}. ${c.name}, ${c.country}: ${c.power.toFixed(1)} W/m²`).join('\n');
        console.log('Top 10 Cities for Evaporation Engines:\n' + topList);
    }, 500);
}

function resetView() {
    map.flyTo({
        center: [20, 20],
        zoom: 2,
        duration: 2000
    });
}

function toggleHeatmap() {
    heatmapVisible = !heatmapVisible;

    if (map.getLayer('cities-heat')) {
        map.setLayoutProperty('cities-heat', 'visibility', heatmapVisible ? 'visible' : 'none');
    }

    // Toggle markers opacity when heatmap is on, but keep them visible
    markers.forEach(({ element }) => {
        if (element) {
            element.style.opacity = heatmapVisible ? '0.6' : '1';
            element.style.display = 'block';
            element.style.visibility = 'visible';
        }
    });
}

function createCountryGradients() {
    if (!citiesData || citiesData.length === 0) return;
    
    const topPowerCities = citiesData.slice(0, 10).map(c => ({
        lon: c.lon,
        lat: c.lat,
        power: c.power
    }));
    
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    function getNearestHighPowerCity(lat, lon) {
        let minDist = Infinity;
        let nearestPower = 0;
        
        topPowerCities.forEach(city => {
            const dist = calculateDistance(lat, lon, city.lat, city.lon);
            if (dist < minDist) {
                minDist = dist;
                nearestPower = city.power;
            }
        });
        
        return { distance: minDist, power: nearestPower };
    }
    
    const gradientPoints = [];
    const step = 5;
    
    for (let lat = -90; lat <= 90; lat += step) {
        for (let lon = -180; lon <= 180; lon += step) {
            const nearest = getNearestHighPowerCity(lat, lon);
            const influence = Math.max(0, 1 - nearest.distance / 5000);
            const powerEstimate = nearest.power * influence;
            
            gradientPoints.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat]
                },
                properties: {
                    power: powerEstimate,
                    distance: nearest.distance
                }
            });
        }
    }
    
    if (map.getSource('country-gradients')) {
        map.getSource('country-gradients').setData({
            type: 'FeatureCollection',
            features: gradientPoints
        });
    } else {
        map.addSource('country-gradients', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: gradientPoints
            }
        });
        
        map.addLayer({
            id: 'country-gradients',
            type: 'heatmap',
            source: 'country-gradients',
            paint: {
                'heatmap-weight': [
                    'interpolate',
                    ['linear'],
                    ['get', 'power'],
                    0, 0,
                    50, 0.1,
                    100, 0.3,
                    150, 0.5,
                    200, 0.7,
                    300, 1
                ],
                'heatmap-intensity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 0.3,
                    5, 0.5,
                    10, 1
                ],
                'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(69, 117, 180, 0)',
                    0.2, 'rgba(145, 191, 219, 0.3)',
                    0.4, 'rgba(254, 224, 144, 0.4)',
                    0.6, 'rgba(252, 141, 89, 0.5)',
                    0.8, 'rgba(215, 48, 39, 0.6)',
                    1, 'rgba(178, 24, 43, 0.7)'
                ],
                'heatmap-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 20,
                    5, 40,
                    10, 80
                ],
                'heatmap-opacity': 0.4
            }
        });
    }
}

async function fetchWeatherData(lat, lon, startDate, endDate) {
    const url = `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${lat}&longitude=${lon}&` +
        `start_date=${startDate}&end_date=${endDate}&` +
        `daily=temperature_2m_mean,relative_humidity_2m_mean,wind_speed_10m_mean,` +
        `shortwave_radiation_sum&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Initialize map when page loads
window.addEventListener('load', initMap);
