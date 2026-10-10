require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const createOwner = async () => {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME;

  if (!email || !password || !name) {
    throw new Error(
      "OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD are required"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "Owner password must contain at least 12 characters"
    );
  }

  await mongoose.connect(
    process.env.MONGODB_URI
  );

  const normalizedEmail =
    email.trim().toLowerCase();

  const existingUser =
    await User.findOne({
      email: normalizedEmail,
    });

  if (existingUser) {
    if (existingUser.role === "owner") {
      console.log(
        "An owner account with this email already exists."
      );

      return;
    }

    throw new Error(
      "A non-owner account already uses this email. Choose another owner email."
    );
  }

  const hashedPassword =
    await bcrypt.hash(password, 12);

  await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "owner",
    isActive: true,
  });

  console.log(
    `Owner account created successfully: ${normalizedEmail}`
  );
};

const run = async () => {
  try {
    await createOwner();
  } catch (error) {
    console.error(
      "Owner creation failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();