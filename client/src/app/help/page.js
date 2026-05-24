"use client";

import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ForumIcon from "@mui/icons-material/Forum";
import EmailIcon from "@mui/icons-material/Email";
import { createDashboardCardSx } from "@/utils/themeUtils";

// ══════════════════════════════════════════════════════
// Help categories — adapted for CareConnect
// ══════════════════════════════════════════════════════

const helpCategories = [
  {
    icon: MenuBookIcon,
    title: "Documentation",
    description:
      "Browse comprehensive guides about prescription management, monitoring, and chat features",
    color: "#1976d2",
  },
  {
    icon: OndemandVideoIcon,
    title: "Video Tutorials",
    description:
      "Watch step-by-step video guides on using CareConnect features",
    color: "#8b5cf6",
  },
  {
    icon: ForumIcon,
    title: "Community Forum",
    description:
      "Connect with other patients and get answers from the community",
    color: "#2e7d32",
  },
  {
    icon: EmailIcon,
    title: "Contact Support",
    description: "Get help from our support team via email or chat",
    color: "#f59e0b",
  },
];

const faqs = [
  {
    question: "How do I add a new prescription?",
    answer:
      "Navigate to the Prescriptions page from the sidebar, then click the 'Add Prescription' button. Fill in the prescription name, prescribing date, area, and other details, then save.",
  },
  {
    question: "Can I invite other patients to my group?",
    answer:
      "Yes! Go to the Groups page, select your group, and click 'Add Member'. You can invite members by email or username.",
  },
  {
    question: "How does location sharing work?",
    answer:
      "When enabled, your location is shared on the map so nearby patients can connect with you. You can toggle this in Settings > Privacy.",
  },
  {
    question: "How do I use the monitoring dashboard?",
    answer:
      "The Monitoring page provides real-time data about your prescriptions. You can track health status, set alerts, and view historical trends.",
  },
  {
    question: "Can I export my analytics data?",
    answer:
      "Yes, visit the Analytics page and click the 'Export Report' button to download your data as a CSV file.",
  },
  {
    question: "How do I change notification preferences?",
    answer:
      "Go to Settings and scroll to the Notifications section. Toggle the switches to enable or disable different notification types.",
  },
];

export default function HelpPage() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);

  const filteredFaqs = React.useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", animation: "fadeIn 0.5s ease-out" }}>
      <Stack spacing={3}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
              height: 52,
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            },
          }}
        />

        {/* Help Categories */}
        <Grid container spacing={2}>
          {helpCategories.map((cat, index) => {
            const IconComp = cat.icon;
            return (
              <Grid item xs={12} sm={6} key={cat.title}>
                <Card
                  sx={{
                    ...createDashboardCardSx(index),
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.01)",
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardActionArea sx={{ p: 0 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: cat.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComp sx={{ color: "#fff", fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, mb: 0.5 }}
                          >
                            {cat.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {cat.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* FAQ Section */}
        <Card sx={createDashboardCardSx(4)}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Frequently Asked Questions
            </Typography>

            {filteredFaqs.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                No results found for &ldquo;{searchQuery}&rdquo;
              </Typography>
            ) : (
              filteredFaqs.map((faq, index) => (
                <Accordion
                  key={index}
                  expanded={expanded === index}
                  onChange={(_, isExpanded) =>
                    setExpanded(isExpanded ? index : false)
                  }
                  disableGutters
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "12px !important",
                    mb: 1.5,
                    "&::before": { display: "none" },
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                    opacity: 0,
                    animation: `slideInUp 0.4s ease-out forwards`,
                    animationDelay: `${index * 50}ms`,
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.text.primary,
                        theme.palette.mode === "dark" ? 0.04 : 0.02,
                      ),
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      px: 2.5,
                      "& .MuiAccordionSummary-content": { my: 1.5 },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
