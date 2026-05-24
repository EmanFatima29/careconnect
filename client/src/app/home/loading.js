"use client";
import { Box, Skeleton } from "@mui/material";
import { ChatSkeleton } from "@/components/UI/StyledComponents";

export default function Loading() {
  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)", gap: 1.5 }}>
      <Box sx={{ width: "50%" }}>
        <ChatSkeleton />
      </Box>
      <Box sx={{ width: "50%" }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height="100%"
          sx={{ minHeight: 500, borderRadius: 2 }}
        />
      </Box>
    </Box>
  );
}
