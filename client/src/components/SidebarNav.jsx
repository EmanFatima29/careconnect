"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProfilePicUrl } from "@/utils/profilePic";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
  Avatar,
  Divider,
} from "@mui/material";

// MUI Icons — Menu section
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeIcon from "@mui/icons-material/Home";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VerifiedIcon from "@mui/icons-material/Verified";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

// MUI Icons — Admin section
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";

// MUI Icons — General section
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LogoutIcon from "@mui/icons-material/Logout";

import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { inferRole } from "@/utils/roleUtils";
import { useTheme } from "@mui/material/styles";

// ═══════════════════════════════════════════════════════
// Navigation configuration per role
// ═══════════════════════════════════════════════════════

const PATIENT_MENU = [
  { href: "/dashboard",    label: "Dashboard",    icon: DashboardIcon },
  { href: "/home",         label: "Home",         icon: HomeIcon },
  { href: "/prescriptions",label: "Prescriptions",icon: LocalHospitalIcon },
  { href: "/appointments", label: "Appointments", icon: EventAvailableIcon },
  { href: "/monitoring",   label: "Monitoring",   icon: MonitorHeartIcon },
  { href: "/groups",       label: "Groups",       icon: GroupsIcon },
  { href: "/analytics",    label: "Analytics",    icon: InsightsIcon },
  { href: "/calendar",     label: "Calendar",     icon: CalendarMonthIcon },
  { href: "/profile",      label: "Profile",      icon: AccountCircleIcon },
];

const DOCTOR_MENU = [
  { href: "/dashboard",    label: "Dashboard",         icon: DashboardIcon },
  { href: "/home",         label: "Home",              icon: HomeIcon },
  { href: "/appointments", label: "Appointments",      icon: EventAvailableIcon },
  { href: "/prescriptions",label: "Prescriptions",     icon: LocalHospitalIcon },
  { href: "/monitoring",   label: "Patient Monitoring",icon: MonitorHeartIcon },
  { href: "/groups",       label: "Groups",            icon: GroupsIcon },
  { href: "/analytics",    label: "Analytics",         icon: InsightsIcon },
  { href: "/calendar",     label: "Calendar",          icon: CalendarMonthIcon },
  { href: "/profile",      label: "Profile",           icon: AccountCircleIcon },
];

const PHARMACY_MENU = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/prescriptions", label: "Prescriptions", icon: LocalPharmacyIcon },
  { href: "/monitoring", label: "Monitoring", icon: MonitorHeartIcon },
  { href: "/groups", label: "Groups", icon: GroupsIcon },
  { href: "/analytics", label: "Analytics", icon: InsightsIcon },
  { href: "/profile", label: "Profile", icon: AccountCircleIcon },
];

const ADMIN_MENU = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/analytics", label: "Analytics", icon: InsightsIcon },
  {
    href: "/admin/users",
    label: "User Management",
    icon: PeopleIcon,
  },
  { href: "/monitoring", label: "Monitoring", icon: MonitorHeartIcon },
  { href: "/home", label: "Home", icon: HomeIcon },
  {
    href: "/admin/logs",
    label: "Activity Logs",
    icon: HistoryIcon,
  },
  { href: "/groups",                label: "Groups",                icon: GroupsIcon },
  { href: "/prescriptions",         label: "Prescriptions",         icon: LocalHospitalIcon },
  { href: "/admin/verifications",   label: "Verifications",         icon: VerifiedIcon },
  { href: "/calendar",              label: "Calendar",              icon: CalendarMonthIcon },
];

const GENERAL_ITEMS = [
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/help", label: "Help", icon: HelpOutlineIcon },
  { href: "/logout", label: "Logout", icon: LogoutIcon },
];

// ═══════════════════════════════════════════════════════
// SidebarNav Component
// ═══════════════════════════════════════════════════════

function SidebarNav({ onItemClick }) {
  const pathname = usePathname();
  const muiTheme = useTheme();
  const { data: session } = useSession();
  const currentUser = useSelector((state) => state.user.currentUser);

  const role = inferRole(currentUser?.roles || session?.user?.roles);
  const menuItems =
    role === "admin" || role === "superadmin"
      ? ADMIN_MENU
      : role === "doctor"
        ? DOCTOR_MENU
        : role === "pharmacy"
          ? PHARMACY_MENU
          : PATIENT_MENU;

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : currentUser?.email
      ? currentUser.email.charAt(0).toUpperCase()
      : "U";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        py: 2,
        px: 1.5,
      }}
    >
      {/* ── Brand Logo ── */}
      <Box
        component={Link}
        href="/dashboard"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.5,
          mb: 3,
          textDecoration: "none",
          color: "text.primary",
          "&:hover .brand-icon": {
            transform: "scale(1.1)",
          },
        }}
      >
        <Avatar
          className="brand-icon"
          sx={{
            width: 36,
            height: 36,
            bgcolor: "primary.main",
            fontSize: 18,
            fontWeight: 800,
            transition: "transform 0.3s ease",
            border: "none",
          }}
        >
          C
        </Avatar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontSize: "1.125rem",
          }}
        >
          CareConnect
        </Typography>
      </Box>

      {/* ── User info ── */}
      {currentUser && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.5,
            py: 1.5,
            mb: 2,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.02)",
          }}
        >
          <Avatar
            src={getProfilePicUrl(currentUser.profilePic, "small") || undefined}
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              border: (theme) => `2px solid ${theme.palette.primary.main}33`,
            }}
          >
            {userInitial}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, lineHeight: 1.3 }}
              noWrap
            >
              {currentUser.name || "User"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block", fontSize: "0.625rem" }}
            >
              {currentUser.email}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: role === "admin" ? "error.main" : role === "doctor" ? "success.main" : role === "pharmacy" ? "warning.main" : "primary.main",
              color: "#fff",
              fontSize: "0.5625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {role}
          </Box>
        </Box>
      )}

      {/* ── Menu Section ── */}
      <Typography
        variant="overline"
        sx={{
          px: 1.5,
          mb: 0.5,
          fontSize: "0.625rem",
          fontWeight: 600,
          color: "text.secondary",
          letterSpacing: "0.08em",
        }}
      >
        Menu
      </Typography>
      <List disablePadding sx={{ mb: 2 }}>
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onItemClick?.()}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  py: 1,
                  px: 1.5,
                  minHeight: 40,
                  transition: "all 0.2s ease",
                  ...(isActive && {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    boxShadow: (theme) =>
                      `0 4px 12px ${theme.palette.primary.main}33`,
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  }),
                  ...(!isActive && {
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      color: "text.primary",
                      transform: "translateX(4px)",
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? "inherit" : "text.secondary",
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {item.badge && (
                  <Badge
                    badgeContent={item.badge}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.625rem",
                        height: 18,
                        minWidth: 18,
                        animation: "pulse 2s ease-in-out infinite",
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── General Section ── */}
      <Divider sx={{ mx: 1.5, mb: 1.5 }} />
      <Typography
        variant="overline"
        sx={{
          px: 1.5,
          mb: 0.5,
          fontSize: "0.625rem",
          fontWeight: 600,
          color: "text.secondary",
          letterSpacing: "0.08em",
        }}
      >
        General
      </Typography>
      <List disablePadding>
        {GENERAL_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isLogout = item.href === "/logout";

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onItemClick?.()}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  py: 1,
                  px: 1.5,
                  minHeight: 40,
                  transition: "all 0.2s ease",
                  ...(isLogout && {
                    color: "error.main",
                    "&:hover": {
                      bgcolor: (theme) => `${theme.palette.error.main}14`,
                      color: "error.dark",
                    },
                  }),
                  ...(isActive &&
                    !isLogout && {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      boxShadow: (theme) =>
                        `0 4px 12px ${theme.palette.primary.main}33`,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "primary.contrastText",
                      },
                    }),
                  ...(!isActive &&
                    !isLogout && {
                      color: "text.secondary",
                      "&:hover": {
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.04)",
                        color: "text.primary",
                        transform: "translateX(4px)",
                      },
                    }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isLogout
                      ? "error.main"
                      : isActive
                        ? "inherit"
                        : "text.secondary",
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── Spacer ── */}
      <Box sx={{ flex: 1 }} />

      {/* ── Bottom branding ── */}
      <Box sx={{ px: 1.5, pb: 1, pt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.625rem", opacity: 0.6 }}
        >
          © 2026 CareConnect
        </Typography>
      </Box>
    </Box>
  );
}

export default React.memo(SidebarNav);
