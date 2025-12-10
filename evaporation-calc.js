// Evaporation Engine Power Calculator
// Based on the Penman Equation and thermodynamic principles

class EvaporationCalculator {
    constructor() {
        // Physical constants
        this.c_t = 0.01157; // W m day MJ^-1 mm^-1 - unit conversion constant
        this.c_e = 6.42465e-4; // mol day mm^-1 m^-2 - unit conversion constant
        this.L_v = 2448; // MJ/Mg - latent heat of vaporization
        this.rho_w = 1; // Mg/m^3 - density of water
        this.gamma = 0.067; // kPa/K - psychrometric constant
        this.R_v = 461.5; // J/(kg K) - specific gas constant for water vapor
        this.R = 8.314; // J/(mol K) - ideal gas constant
        this.RH_wet = 0.975; // relative humidity at water surface
    }

    calculateSaturationVaporPressure(T_celsius) {
        const T = T_celsius;
        return 0.61121 * Math.exp((18.678 - T / 234.5) * (T / (257.14 + T)));
    }

    calculateDelta(T_celsius) {
        const T_kelvin = T_celsius + 273.15;
        const e_s = this.calculateSaturationVaporPressure(T_celsius);
        return (this.L_v * e_s) / (this.R_v * T_kelvin * T_kelvin);
    }

    calculateVaporPressureDeficit(T_celsius, RH) {
        const e_s = this.calculateSaturationVaporPressure(T_celsius);
        return (1 - RH) * e_s;
    }

    calculateEvaporation(params) {
        const { R_n, T_celsius, RH, u_a } = params;

        const T_mean = T_celsius;
        const Delta = this.calculateDelta(T_mean);
        const D_a = this.calculateVaporPressureDeficit(T_mean, RH);

        // Penman Equation: E_pr = (Delta * R_n + 2.6 * c_t * L_v * rho_w * gamma * (1 + 0.54 * u_a) * D_a) / (Delta + gamma)
        const numerator = Delta * R_n + 2.6 * this.c_t * this.L_v * this.rho_w * this.gamma * (1 + 0.54 * u_a) * D_a;
        const denominator = Delta + this.gamma;

        const E_pr = numerator / denominator;
        return Math.max(0, E_pr); // Evaporation cannot be negative
    }

    calculateMaxPower(E_pr, T_celsius, RH_air) {
        const T_kelvin = T_celsius + 273.15;

        if (RH_air >= this.RH_wet || RH_air <= 0) {
            return 0;
        }
        const power = this.c_e * E_pr * this.R * T_kelvin * Math.log(this.RH_wet / RH_air);

        return Math.max(0, power);
    }

    analyzeAnnualPerformance(weatherData) {
        const dailyResults = [];

        // Process daily data
        for (let day of weatherData.days) {
            const evaporation = this.calculateEvaporation({
                R_n: day.netRadiation,
                T_celsius: day.temperature,
                RH: day.relativeHumidity,
                u_a: day.windSpeed
            });

            const power = this.calculateMaxPower(
                evaporation,
                day.temperature,
                day.relativeHumidity
            );

            dailyResults.push({
                date: day.date,
                evaporation: evaporation,
                power: power,
                temperature: day.temperature,
                humidity: day.relativeHumidity,
                windSpeed: day.windSpeed
            });
        }

        // Calculate statistics
        const powers = dailyResults.map(d => d.power);
        const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
        const maxPower = Math.max(...powers);
        const minPower = Math.min(...powers);

        return {
            dailyResults: dailyResults,
            avgPower: avgPower,
            maxPower: maxPower,
            minPower: minPower,
            totalDays: dailyResults.length
        };
    }

    estimatePowerFromClimateaverages(climate) {
        const {
            avgTemp = 15,
            avgHumidity = 0.65,
            avgWindSpeed = 3,
            avgSolarRadiation = 200
        } = climate;

        const R_n = avgSolarRadiation * 0.65;

        const evaporation = this.calculateEvaporation({
            R_n: R_n,
            T_celsius: avgTemp,
            RH: avgHumidity,
            u_a: avgWindSpeed
        });

        const power = this.calculateMaxPower(evaporation, avgTemp, avgHumidity);

        return power;
    }

    getPowerCategory(power) {
        if (power > 200) {
            return {
                level: 'excellent',
                color: '#d73027',
                label: 'Excellent',
                description: 'Ideal conditions for evaporation engine deployment'
            };
        } else if (power > 150) {
            return {
                level: 'very-good',
                color: '#fc8d59',
                label: 'Very Good',
                description: 'Favorable conditions with high potential'
            };
        } else if (power > 100) {
            return {
                level: 'good',
                color: '#fee090',
                label: 'Good',
                description: 'Moderate potential for implementation'
            };
        } else if (power > 50) {
            return {
                level: 'moderate',
                color: '#91bfdb',
                label: 'Moderate',
                description: 'Limited but viable potential'
            };
        } else {
            return {
                level: 'low',
                color: '#4575b4',
                label: 'Low',
                description: 'Challenging conditions for deployment'
            };
        }
    }

    calculateRequiredArea(targetPowerKW, powerDensity, efficiency = 0.1) {
        const effectivePower = powerDensity * efficiency;
        return (targetPowerKW * 1000) / effectivePower;
    }
}

// Create global instance
const evapCalc = new EvaporationCalculator();
