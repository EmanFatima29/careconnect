import bcrypt from "bcryptjs";
export async function hashPassword(password) {
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(trimmedPassword, salt);
}
