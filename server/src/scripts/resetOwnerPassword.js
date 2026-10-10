require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("../models/User");

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let answer = "";

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function onData(char) {
      if (char === "\u0003") {
        cleanup();
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(answer);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        answer = answer.slice(0, -1);
        return;
      }

      if (char >= " ") {
        answer += char;
      }
    }

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing from server/.env"
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const owners = await User.find({ role: "owner" })
    .select("name email isActive")
    .lean();

  if (owners.length === 0) {
    console.log(
      "No owner accounts found. No changes made."
    );
    console.log(
      "Do not promote a customer until we verify the correct account."
    );
    return;
  }

  console.log("\nExisting DineX owner accounts:");
  owners.forEach((owner, index) => {
    console.log(
      `${index + 1}. ${owner.name} | ${owner.email} | ${
        owner.isActive ? "Active" : "Disabled"
      }`
    );
  });

  const email = (
    await ask("\nEnter the owner email to recover: ")
  ).toLowerCase();

  const owner = owners.find(
    (item) => item.email.toLowerCase() === email
  );

  if (!owner) {
    throw new Error(
      "That email is not an existing owner account. No changes made."
    );
  }

  if (!owner.isActive) {
    throw new Error(
      "This owner account is disabled. No changes made."
    );
  }

  const password = await askHidden(
    "Enter a new password (minimum 12 characters): "
  );

  if (password.length < 12) {
    throw new Error(
      "Password must contain at least 12 characters. No changes made."
    );
  }

  const confirmation = await askHidden(
    "Re-enter the new password: "
  );

  if (password !== confirmation) {
    throw new Error(
      "Passwords do not match. No changes made."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.updateOne(
    { _id: owner._id, role: "owner" },
    { $set: { password: hashedPassword } }
  );

  console.log("\nOwner password reset successfully.");
  console.log("Login email:", owner.email);
  console.log("Use your new password on the DineX login page.");
}

main()
  .catch((error) => {
    console.error("\nRecovery failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
