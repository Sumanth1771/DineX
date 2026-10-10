const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie(
    "refreshToken",
    token,
    getRefreshCookieOptions()
  );
};

const clearRefreshTokenCookie = (res) => {
  const options = getRefreshCookieOptions();

  res.clearCookie("refreshToken", {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
};

module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};