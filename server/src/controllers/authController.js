const bcrypt = require("bcryptjs");

const User = require("../models/User");

const {
  generateAccessToken,
} = require("../utils/auth");

const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/cookies");

const {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
    } = req.validated.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    const accessToken = generateAccessToken(user);

    const refreshToken = await createRefreshToken(
      user._id
    );

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.validated.body;

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is disabled",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      await createRefreshToken(user._id);

    setRefreshTokenCookie(
      res,
      refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const result =
      await rotateRefreshToken(
        refreshToken
      );

    if (result.status === "reuse") {
      clearRefreshTokenCookie(res);

      return res.status(401).json({
        success: false,
        message:
          "Session invalidated. Please log in again.",
      });
    }

    if (
      result.status === "invalid" ||
      result.status === "expired"
    ) {
      clearRefreshTokenCookie(res);

      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please log in again.",
      });
    }

    const accessToken =
      generateAccessToken(result.user);

    setRefreshTokenCookie(
      res,
      result.refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(
        refreshToken
      );
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};