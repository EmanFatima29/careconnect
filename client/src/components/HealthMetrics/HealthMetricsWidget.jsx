"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import ThermostatIcon from "@mui/icons-material/Thermostat";

/**
 * HealthMetricsWidget  — Phase 15.5
 *
 * Fetches healthMetrics via /api/healthMetrics proxy (requires OPENWEATHERMAP_API_KEY in .env.local).
 * Tries browser geolocation first; falls back to city-name search.
 */
export default function HealthMetricsWidget({ compact = false }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cityInput, setCityInput] = React.useState("");
  const [searchCity, setSearchCity] = React.useState("");

  const fetchHealthMetrics = React.useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/healthMetrics?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load healthMetrics");
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setError("Network error: " + e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Try geolocation on mount
  React.useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation unavailable — enter a city to see healthMetrics");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        fetchHealthMetrics({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Location access denied — enter a city to see healthMetrics"),
    );
  }, [fetchHealthMetrics]);

  // City search
  React.useEffect(() => {
    if (searchCity.trim()) fetchHealthMetrics({ city: searchCity.trim() });
  }, [searchCity, fetchHealthMetrics]);

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim()) setSearchCity(cityInput.trim());
  };

  const handleRefresh = () => {
    if (data?.coord) {
      fetchHealthMetrics({ lat: data.coord.lat, lon: data.coord.lon });
    } else if (searchCity) {
      fetchHealthMetrics({ city: searchCity });
    } else {
      navigator.geolocation?.getCurrentPosition((pos) =>
        fetchHealthMetrics({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      );
    }
  };

  const iconUrl = data?.healthMetrics?.[0]?.icon
    ? `https://openweathermap.org/img/wn/${data.healthMetrics[0].icon}@2x.png`
    : null;

  const tempC = data?.main?.temp != null ? Math.round(data.main.temp) : null;
  const feelsLike =
    data?.main?.feels_like != null ? Math.round(data.main.feels_like) : null;
  const humidity = data?.main?.humidity;
  const windKmh =
    data?.wind?.speed != null ? Math.round(data.wind.speed * 3.6) : null;
  const description = data?.healthMetrics?.[0]?.description || "";
  const cityName = data
    ? `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ""}`
    : null;

  return (
    <Card
      variant="outlined"
      role="region"
      aria-label="HealthMetrics widget"
      sx={{ height: "100%" }}
    >
      <CardContent sx={{ pb: "16px !important" }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              HealthMetrics
            </Typography>
            {cityName && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ maxWidth: 160 }}
                aria-label={`Location: ${cityName}`}
              >
                — {cityName}
              </Typography>
            )}
          </Stack>
          <Tooltip title="Refresh healthMetrics">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh healthMetrics data"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* City search form */}
        <form onSubmit={handleCitySubmit} aria-label="Search healthMetrics by city">
          <TextField
            size="small"
            fullWidth
            placeholder="Enter city name…"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            aria-label="City name for healthMetrics search"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    size="small"
                    disabled={!cityInput.trim() || loading}
                    aria-label="Search healthMetrics"
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />
        </form>

        {/* States */}
        {loading && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 2 }}>
            <CircularProgress size={28} aria-label="Loading healthMetrics" />
          </Stack>
        )}

        {!loading && error && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 1 }}
            role="alert"
          >
            {error}
          </Typography>
        )}

        {!loading && data && !error && (
          <Stack spacing={1.5}>
            {/* Main temp + icon */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {iconUrl && (
                <Box
                  component="img"
                  src={iconUrl}
                  alt={description}
                  width={56}
                  height={56}
                  aria-label={`HealthMetrics condition: ${description}`}
                />
              )}
              <Box>
                <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                  <Typography
                    variant={compact ? "h4" : "h3"}
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                    aria-label={`Temperature: ${tempC} degrees Celsius`}
                  >
                    {tempC}°C
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textTransform: "capitalize", mt: 0.25 }}
                >
                  {description}
                </Typography>
              </Box>
            </Stack>

            {/* Details row */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {feelsLike != null && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  title={`Feels like ${feelsLike}°C`}
                >
                  <ThermostatIcon
                    fontSize="small"
                    color="action"
                    aria-hidden="true"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Feels {feelsLike}°C
                  </Typography>
                </Stack>
              )}
              {humidity != null && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  title={`Humidity: ${humidity}%`}
                >
                  <WaterDropIcon
                    fontSize="small"
                    color="info"
                    aria-hidden="true"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {humidity}%
                  </Typography>
                </Stack>
              )}
              {windKmh != null && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  title={`Wind speed: ${windKmh} km/h`}
                >
                  <AirIcon fontSize="small" color="action" aria-hidden="true" />
                  <Typography variant="caption" color="text.secondary">
                    {windKmh} km/h
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
