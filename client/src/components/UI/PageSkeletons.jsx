"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Stack,
} from "@mui/material";

function HeaderSkeleton() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ py: 2, px: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={44} height={44} />
            <Box>
              <Skeleton variant="text" width={180} height={24} />
              <Skeleton variant="text" width={240} height={16} />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Skeleton
              variant="rounded"
              width={80}
              height={32}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rounded"
              width={100}
              height={32}
              sx={{ borderRadius: 2 }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatsRowSkeleton({ count = 4 }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Skeleton
                variant="circular"
                width={28}
                height={28}
                sx={{ mx: "auto", mb: 0.5 }}
              />
              <Skeleton
                variant="text"
                width={40}
                height={32}
                sx={{ mx: "auto" }}
              />
              <Skeleton
                variant="text"
                width={60}
                height={14}
                sx={{ mx: "auto" }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function CardGridSkeleton({ count = 6, cols = 3 }) {
  return (
    <Grid container spacing={2.5}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={12 / cols} key={i}>
          <Card sx={{ borderRadius: 3, height: 220 }}>
            <Box
              sx={{
                height: 4,
                bgcolor: "action.hover",
                borderRadius: "12px 12px 0 0",
              }}
            />
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton
                    variant="rounded"
                    width={60}
                    height={22}
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
                <Skeleton variant="text" width="80%" height={16} />
                <Skeleton variant="text" width="50%" height={16} />
                <Skeleton variant="text" width="40%" height={16} />
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <Skeleton
                    variant="rounded"
                    width={70}
                    height={28}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={70}
                    height={28}
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Page-specific skeletons ──

export function PrescriptionsSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <StatsRowSkeleton />
        <Stack direction="row" spacing={2}>
          <Skeleton
            variant="rounded"
            width={220}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={130}
            height={36}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
        <CardGridSkeleton count={6} />
      </Stack>
    </Container>
  );
}

export function GroupsSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <Stack direction="row" spacing={2}>
          <Skeleton
            variant="rounded"
            width={260}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={200}
            height={36}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
        <CardGridSkeleton count={6} />
      </Stack>
    </Container>
  );
}

export function CalendarSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <Stack direction="row" justifyContent="center" spacing={2}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 1,
                  }}
                >
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={`h-${i}`}
                      variant="text"
                      width="100%"
                      height={20}
                    />
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton
                      key={`d-${i}`}
                      variant="rounded"
                      sx={{ aspectRatio: "1", borderRadius: 2 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={160}
                  height={24}
                  sx={{ mb: 2 }}
                />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={60}
                    sx={{ mb: 1.5, borderRadius: 2 }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export function MonitoringSkeleton() {
  return (
    <Container maxWidth="xl" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <StatsRowSkeleton />
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4} lg={3}>
            <Card sx={{ borderRadius: 3, height: 500 }}>
              <CardContent>
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={36}
                  sx={{ mb: 2, borderRadius: 2 }}
                />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={48}
                    sx={{ mb: 1, borderRadius: 1.5 }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8} lg={9}>
            <Skeleton
              variant="rounded"
              width="100%"
              height={500}
              sx={{ borderRadius: 3 }}
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export function AnalyticsSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <StatsRowSkeleton />
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Skeleton
              variant="rounded"
              width="100%"
              height={36}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={280}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={280}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export function ProfileSkeleton() {
  return (
    <Container maxWidth="md" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <Card sx={{ borderRadius: 3 }}>
          <Box
            sx={{
              height: 100,
              bgcolor: "action.hover",
              borderRadius: "12px 12px 0 0",
            }}
          />
          <CardContent sx={{ mt: -5, px: 3 }}>
            <Stack direction="row" spacing={2.5} alignItems="flex-end">
              <Skeleton variant="circular" width={96} height={96} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={200} height={32} />
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Skeleton
                    variant="rounded"
                    width={120}
                    height={26}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={26}
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width={160} height={24} sx={{ mb: 2 }} />
            <Grid container spacing={2.5}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton
                    variant="rounded"
                    height={56}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Skeleton
                  variant="rounded"
                  height={80}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export function SettingsSkeleton() {
  return (
    <Container maxWidth="md" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="text" width={180} height={24} sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {Array.from({ length: 4 }).map((__, j) => (
                  <Stack
                    key={j}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" height={18} />
                      <Skeleton variant="text" width="70%" height={14} />
                    </Box>
                    <Skeleton
                      variant="rounded"
                      width={52}
                      height={28}
                      sx={{ borderRadius: 3 }}
                    />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

export function AdminUsersSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <StatsRowSkeleton count={4} />
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" spacing={1.5}>
                <Skeleton
                  variant="rounded"
                  width={220}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rounded"
                  width={120}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
                <Box sx={{ flex: 1 }} />
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
              </Stack>
            </Box>
            {Array.from({ length: 8 }).map((_, i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="30%" height={18} />
                  <Skeleton variant="text" width="50%" height={14} />
                </Box>
                <Skeleton
                  variant="rounded"
                  width={70}
                  height={24}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rounded"
                  width={70}
                  height={24}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton variant="circular" width={28} height={28} />
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export function AdminLogsSkeleton() {
  return (
    <Container maxWidth="lg" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" spacing={1.5}>
                <Skeleton
                  variant="rounded"
                  width={180}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rounded"
                  width={140}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
                <Box sx={{ flex: 1 }} />
                <Skeleton
                  variant="rounded"
                  width={110}
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
              </Stack>
            </Box>
            {Array.from({ length: 12 }).map((_, i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}
              >
                <Skeleton
                  variant="rounded"
                  width={70}
                  height={22}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton variant="text" width={140} height={16} />
                <Skeleton variant="text" sx={{ flex: 1 }} height={16} />
                <Skeleton variant="text" width={90} height={14} />
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export function HelpSkeleton() {
  return (
    <Container maxWidth="md" disableGutters sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack spacing={2.5}>
        <HeaderSkeleton />
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton
              variant="rounded"
              height={44}
              sx={{ borderRadius: 2, mb: 2 }}
            />
            <Stack spacing={1.5}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={56}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export { HeaderSkeleton, StatsRowSkeleton, CardGridSkeleton };
