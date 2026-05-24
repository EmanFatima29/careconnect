"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Skeleton, IconButton, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

/**
 * LazyMedia — WhatsApp-style lazy media loading for chat messages.
 *
 * - Images: show thumbnail/blur placeholder first, load full image on viewport entry
 * - Videos: show poster thumbnail, load video on play click
 * - Files: show file icon with download link (no lazy loading needed)
 *
 * Uses IntersectionObserver for viewport-based loading.
 */

function resolveUrl(media, fileUrl, size = "medium") {
  // New media object with responsive variants
  if (media?.urls) {
    return {
      thumb: media.urls.thumbnail || media.urls.small || media.urls.original,
      full: media.urls[size] || media.urls.original,
      videoThumb: media.urls.videoThumb || null,
    };
  }
  // Legacy fileUrl
  return { thumb: fileUrl, full: fileUrl, videoThumb: null };
}

export function LazyImage({ media, fileUrl, alt = "Shared image", onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  const { thumb, full } = resolveUrl(media, fileUrl, "medium");

  // IntersectionObserver for viewport-based loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // Start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        maxWidth: 280,
        maxHeight: 200,
        borderRadius: 1,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        bgcolor: "action.hover",
      }}
      onClick={() => onClick?.(full)}
    >
      {/* Blurred thumbnail placeholder */}
      {!loaded && thumb && (
        <Box
          component="img"
          src={thumb}
          alt=""
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: 200,
            objectFit: "cover",
            filter: "blur(8px)",
            transform: "scale(1.1)", // Prevent blur edges showing
          }}
        />
      )}

      {/* Skeleton fallback if no thumbnail */}
      {!loaded && !thumb && (
        <Skeleton
          variant="rectangular"
          width={280}
          height={160}
          animation="wave"
        />
      )}

      {/* Full resolution image — loads when in viewport */}
      {inView && (
        <Box
          component="img"
          src={full}
          alt={alt}
          onLoad={() => setLoaded(true)}
          sx={{
            position: loaded ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "auto",
            maxHeight: 200,
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      )}
    </Box>
  );
}

export function LazyVideo({ media, fileUrl }) {
  const [showVideo, setShowVideo] = useState(false);
  const { full, videoThumb } = resolveUrl(media, fileUrl);

  if (showVideo) {
    return (
      <Box
        component="video"
        src={full}
        controls
        autoPlay
        sx={{
          maxWidth: 280,
          maxHeight: 200,
          borderRadius: 1,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        maxWidth: 280,
        maxHeight: 200,
        borderRadius: 1,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "action.hover",
      }}
      onClick={() => setShowVideo(true)}
    >
      {videoThumb ? (
        <Box
          component="img"
          src={videoThumb}
          alt="Video thumbnail"
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: 200,
            objectFit: "cover",
          }}
        />
      ) : (
        <Skeleton variant="rectangular" width={280} height={160} />
      )}

      {/* Play button overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.3)",
        }}
      >
        <IconButton
          sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "white" } }}
        >
          <PlayArrowIcon fontSize="large" />
        </IconButton>
      </Box>
    </Box>
  );
}

export function FileAttachment({ media, fileUrl, content }) {
  const url = media?.urls?.original || fileUrl;
  const name = media?.originalName || content || "Download File";

  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: 1,
        bgcolor: "action.hover",
        textDecoration: "none",
        color: "text.primary",
        "&:hover": { bgcolor: "action.selected" },
      }}
    >
      <InsertDriveFileIcon color="action" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {media?.size && (
          <Typography variant="caption" color="text.secondary">
            {(media.size / 1024).toFixed(0)} KB
          </Typography>
        )}
      </Box>
    </Box>
  );
}
