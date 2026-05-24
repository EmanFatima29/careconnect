"use client";
import logger from "@/lib/logger";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "next-auth/react";
import { clearCurrentUser } from "@/utils/redux/userSlice";
import { setUsersData } from "@/utils/redux/userSlice";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import { updateUser } from "@/lib/api";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState } from "react";

export default function LogoutButton({ variant = "redirect" }) {
  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect variant — navigates to /logout page
  if (variant === "redirect") {
    return (
      <Button
        onClick={() => router.push("/logout")}
        startIcon={<LogoutIcon />}
        sx={{
          color: "error.main",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
          "&:hover": {
            bgcolor: "error.main",
            color: "#fff",
          },
        }}
      >
        Logout
      </Button>
    );
  }

  // Inline variant — shows confirmation dialog
  const handleLogout = async () => {
    setLoading(true);
    try {
      if (socket?.connected) {
        socket.emit("manual-disconnect", {
          userId: currentUser._id,
          email: currentUser.email,
        });

        await updateUser(currentUser.email, {
          status: "offline",
          lastSeen: new Date(),
        });
      }
      dispatch(clearCurrentUser());
      dispatch(setUsersData([]));
      dispatch(setCurrentChat(null));
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      logger.error("Logout error:", err);
      await signOut({ callbackUrl: "/login" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        startIcon={<LogoutIcon />}
        color="error"
        variant="outlined"
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        Logout
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out of CareConnect? Your data will be
            saved.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
