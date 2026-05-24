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
  alpha,
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { createDashboardCardSx } from "@/utils/themeUtils";

/**
 * HealthMetricsCard — v0-styled wrapper around the healthMetrics data fetch.
 *
 * This is a fresh dashboard-ready healthMetrics widget that matches the
 * v0 design language (entrance animation, card hover, gradient accent).
 * It keeps the same OpenHealthMetricsMap /api/healthMetrics proxy used by the
 * original HealthMetricsWidget.
 *
 * @param {number} [props.index=0] – Stagger animation index
 */
export default function HealthMetricsCard({ index = 0 }) {
  const theme = useTheme();
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
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        fetchHealthMetrics({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Location access denied — search a city"),
    );
  }, [fetchHealthMetrics]);

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
      sx={{
        ...createDashboardCardSx(index),
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient strip */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, #1976D2 0%, #42A5F5 50%, #90CAF9 100%)",
        }}
      />

      <CardContent sx={{ p: 2.5, pt: 3, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.info.main, 0.1),
              }}
            >
              <WbSunnyIcon
                sx={{ fontSize: 20, color: theme.palette.warning.main }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                HealthMetrics
              </Typography>
              {cityName && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {cityName}
                </Typography>
              )}
            </Box>
          </Stack>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Search */}
        <form onSubmit={handleCitySubmit}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search city…"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      size="small"
                      disabled={!cityInput.trim() || loading}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
        </form>

        {/* Loading */}
        {loading && (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {/* Error */}
        {!loading && error && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            {error}
          </Typography>
        )}

        {/* Data */}
        {!loading && data && !error && (
          <Stack spacing={2}>
            {/* Temperature row */}
            <Stack direction="row" alignItems="center" spacing={2}>
              {iconUrl && (
                <Box
                  component="img"
                  src={iconUrl}
                  alt={description}
                  width={60}
                  height={60}
                  sx={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                  }}
                />
              )}
              <Box>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {tempC}°C
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textTransform: "capitalize", mt: 0.25 }}
                >
                  {description}
                </Typography>
              </Box>
            </Stack>

            {/* Detail chips */}
            <Stack
              direction="row"
              spacing={2}
              divider={
                <Box
                  sx={{
                    width: 1,
                    bgcolor: "divider",
                    alignSelf: "stretch",
                  }}
                />
              }
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.04),
                borderRadius: 2,
                p: 1.5,
              }}
            >
              {feelsLike != null && (
                <Stack alignItems="center" spacing={0.25} sx={{ flex: 1 }}>
                  <ThermostatIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {feelsLike}°C
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    Feels like
                  </Typography>
                </Stack>
              )}
              {humidity != null && (
                <Stack alignItems="center" spacing={0.25} sx={{ flex: 1 }}>
                  <WaterDropIcon
                    sx={{ fontSize: 18, color: theme.palette.info.main }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {humidity}%
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    Humidity
                  </Typography>
                </Stack>
              )}
              {windKmh != null && (
                <Stack alignItems="center" spacing={0.25} sx={{ flex: 1 }}>
                  <AirIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {windKmh} km/h
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    Wind
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
