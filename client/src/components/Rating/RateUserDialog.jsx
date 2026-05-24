"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Rating,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { submitRating, fetchMyRating } from "@/utils/redux/thunks/ratingThunks";
import { ROLE_COLORS, ROLE_DISPLAY } from "@/components/Map/mapUtils";
import { getProfilePicUrl } from "@/utils/profilePic";

const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };

export default function RateUserDialog({ open, onClose, targetUser }) {
  const dispatch = useDispatch();
  const { submitting, error, myRating } = useSelector((s) => s.rating);

  const [score, setScore]     = useState(0);
  const [hover, setHover]     = useState(-1);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  const role = targetUser?.roles || "doctor";
  const roleColor   = ROLE_COLORS[role] || ROLE_COLORS.doctor;
  const roleDisplay = ROLE_DISPLAY[role] || "Doctor";
  const picUrl = getProfilePicUrl(targetUser?.profilePic);

  // Pre-fill from existing rating
  useEffect(() => {
    if (open && myRating) {
      setScore(myRating.score || 0);
      setComment(myRating.comment || "");
    } else if (open) {
      setScore(0);
      setComment("");
    }
    setSuccess(false);
  }, [open, myRating]);

  const handleSubmit = async () => {
    if (!score || !targetUser?._id) return;
    const result = await dispatch(submitRating({
      ratedUserId: targetUser._id,
      score,
      comment,
    }));
    if (!result.error) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  if (!targetUser) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={picUrl} sx={{ width: 40, height: 40, bgcolor: roleColor + "cc" }}>
            {targetUser.name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {myRating ? "Update Your Rating" : `Rate this ${roleDisplay}`}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">{targetUser.name}</Typography>
              <Chip label={roleDisplay} size="small" sx={{ height: 16, fontSize: "0.55rem", bgcolor: roleColor, color: "#fff", fontWeight: 700 }} />
            </Stack>
          </Stack>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>Rating submitted successfully!</Alert>
        ) : (
          <Stack spacing={2.5}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <Stack alignItems="center" spacing={0.5}>
              <Rating
                value={score}
                onChange={(_, v) => setScore(v)}
                onChangeActive={(_, v) => setHover(v)}
                size="large"
                emptyIcon={<StarIcon style={{ opacity: 0.35 }} fontSize="inherit" />}
              />
              {(hover > 0 || score > 0) && (
                <Typography variant="caption" color="text.secondary">
                  {LABELS[hover > 0 ? hover : score]}
                </Typography>
              )}
            </Stack>

            <TextField
              label="Comment (optional)"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder={`Share your experience with this ${roleDisplay.toLowerCase()}...`}
              helperText={`${comment.length}/500`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Stack>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!score || submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <StarIcon />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {myRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
