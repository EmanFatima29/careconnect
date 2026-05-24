/**
 * Extract a usable URL from a profilePic ward that may be a string or an object
 * with variant URLs (thumbnail, small, medium, large, original).
 *
 * @param {string|object|null} profilePic  The profilePic value from a user object
 * @param {"thumbnail"|"small"|"medium"|"large"|"original"} preferredSize
 * @returns {string|null}
 */
export function getProfilePicUrl(profilePic, preferredSize = "medium") {
  if (!profilePic) return null;
  if (typeof profilePic === "string") return profilePic;
  return (
    profilePic[preferredSize] ||
    profilePic.medium ||
    profilePic.small ||
    profilePic.thumbnail ||
    profilePic.original ||
    null
  );
}
