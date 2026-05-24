"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Stack,
  Typography,
  Rating,
  Avatar,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Pagination,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import RateUserDialog from "./RateUserDialog";
import { fetchUserRatings, fetchMyRating } from "@/utils/redux/thunks/ratingThunks";
import { clearRatings } from "@/utils/redux/ratingSlice";
import { getProfilePicUrl } from "@/utils/profilePic";
import { inferRole } from "@/utils/roleUtils";
import { ROLE_COLORS, ROLE_DISPLAY } from "@/components/Map/mapUtils";

export default function RatingSummary({ targetUser, currentUser }) {
  const dispatch = useDispatch();
  const { ratings, myRating, total, loading } = useSelector((s) => s.rating);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const LIMIT = 5;

  const currentUserRole = inferRole(currentUser?.roles);
  const targetRole = targetUser?.roles;
  const canRate = ["doctor", "pharmacy"].includes(targetRole)
    && currentUserRole === "patient"
    && targetUser?._id !== currentUser?._id;

  useEffect(() => {
    if (!targetUser?._id) return;
    dispatch(fetchUserRatings({ userId: targetUser._id, page, limit: LIMIT }));
    if (canRate) dispatch(fetchMyRating(targetUser._id));
    return () => { dispatch(clearRatings()); };
  }, [targetUser?._id, page]); // eslint-disable-line

  const avgRating = targetUser?.ratingSummary?.averageRating || 0;
  const totalRatings = targetUser?.ratingSummary?.totalRatings || 0;

  return (
    <Box>
      {/* Summary header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Stack alignItems="center">
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </Typography>
          <Rating value={avgRating} readOnly precision={0.1} size="small" />
          <Typography variant="caption" color="text.secondary">
            {totalRatings} rating{totalRatings !== 1 ? "s" : ""}
          </Typography>
        </Stack>

        {canRate && (
          <Box sx={{ ml: "auto" }}>
            <Button
              variant={myRating ? "outlined" : "contained"}
              startIcon={<StarIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
              size="small"
            >
              {myRating ? "Update Rating" : `Rate this ${ROLE_DISPLAY[targetRole]}`}
            </Button>
          </Box>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* My rating banner */}
      {myRating && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: (t) => t.palette.primary.main + "10", border: "1px solid", borderColor: "primary.main" + "30" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Your rating:</Typography>
            <Rating value={myRating.score} readOnly size="small" />
            {myRating.comment && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                "{myRating.comment}"
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* Ratings list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : ratings.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
          No ratings yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {ratings.map((r) => {
            const raterPic = getProfilePicUrl(r.raterUserId?.profilePic);
            return (
              <Stack key={r._id} spacing={0.75}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={raterPic} sx={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                    {r.raterUserId?.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {r.raterUserId?.name || "Anonymous"}
                      </Typography>
                      <Rating value={r.score} readOnly size="small" sx={{ fontSize: "0.85rem" }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
                {r.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 6, fontStyle: "italic", fontSize: "0.8rem" }}>
                    "{r.comment}"
                  </Typography>
                )}
                <Divider />
              </Stack>
            );
          })}

          {total > LIMIT && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Pagination count={Math.ceil(total / LIMIT)} page={page} onChange={(_, v) => setPage(v)} size="small" />
            </Box>
          )}
        </Stack>
      )}

      <RateUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        targetUser={targetUser}
      />
    </Box>
  );
}
