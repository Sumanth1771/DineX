const RefreshToken = require("../models/RefreshToken");
const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/auth");

const REFRESH_TOKEN_LIFETIME = 7 * 24 * 60 * 60 * 1000;

const createRefreshToken = async (userId) => {
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_LIFETIME
  );

  await RefreshToken.create({
    tokenHash,
    user: userId,
    expiresAt,
  });

  return rawToken;
};

const rotateRefreshToken = async (rawToken) => {
  const tokenHash = hashRefreshToken(rawToken);

  const storedToken = await RefreshToken.findOne({
    tokenHash,
  }).populate("user");

  if (!storedToken) {
    return {
      status: "invalid",
    };
  }

  /*
   * Refresh-token reuse detection.
   *
   * A token that was already revoked should never be used again.
   */
  if (storedToken.revokedAt) {
    /*
     * Revoke all active refresh tokens for this user.
     *
     * This protects the account if a stolen refresh token
     * is replayed after legitimate rotation.
     */
    await RefreshToken.updateMany(
      {
        user: storedToken.user._id,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );

    return {
      status: "reuse",
    };
  }

  if (storedToken.expiresAt <= new Date()) {
    storedToken.revokedAt = new Date();
    await storedToken.save();

    return {
      status: "expired",
    };
  }

  if (!storedToken.user || !storedToken.user.isActive) {
    storedToken.revokedAt = new Date();
    await storedToken.save();

    return {
      status: "invalid",
    };
  }

  /*
   * Revoke old token.
   */
  storedToken.revokedAt = new Date();

  const newRawToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRawToken);

  storedToken.replacedByTokenHash = newTokenHash;

  await storedToken.save();

  /*
   * Store the replacement token.
   */
  await RefreshToken.create({
    tokenHash: newTokenHash,
    user: storedToken.user._id,
    expiresAt: new Date(
      Date.now() + REFRESH_TOKEN_LIFETIME
    ),
  });

  return {
    status: "success",
    refreshToken: newRawToken,
    user: storedToken.user,
  };
};

const revokeRefreshToken = async (rawToken) => {
  const tokenHash = hashRefreshToken(rawToken);

  await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
};

module.exports = {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
};