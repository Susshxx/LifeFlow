// // const mongoose = require("mongoose");
// // const bcrypt = require("bcryptjs");

// // const userSchema = new mongoose.Schema(
// //   {
// //     name:     { type: String, required: true },
// //     email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
// //     password: { type: String, default: null },
// //     googleId: { type: String, default: null },
// //     role:     { type: String, enum: ["user", "hospital", "admin"], default: "user" },

// //     bloodGroup:   { type: String, default: "" },
// //     phone:        { type: String, default: "" },
// //     province:     { type: String, default: "" },
// //     district:     { type: String, default: "" },
// //     municipality: { type: String, default: "" },

// //     // Date of birth — stored as separate day/month/year strings
// //     dobDay:   { type: String, default: "" },
// //     dobMonth: { type: String, default: "" },
// //     dobYear:  { type: String, default: "" },

// //     // Hospital-specific
// //     hospitalName:      { type: String, default: "" },
// //     hospitalRegNumber: { type: String, default: "" },

// //     isVerified:    { type: Boolean, default: false },
// //     avatar:        { type: String, default: "" },
// //     documentPhoto: { type: String, default: "" },
// //   },
// //   { timestamps: true }
// // );

// // // Hash password before save (only if modified and present)
// // userSchema.pre("save", async function (next) {
// //   if (!this.isModified("password") || !this.password) return next();
// //   this.password = await bcrypt.hash(this.password, 10);
// //   next();
// // });

// // userSchema.methods.comparePassword = async function (plain) {
// //   return bcrypt.compare(plain, this.password || "");
// // };

// // module.exports = mongoose.model("User", userSchema);


// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     name:     { type: String, required: true },
//     email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, default: null },
//     googleId: { type: String, default: null },
//     role:     { type: String, enum: ["user", "hospital", "admin"], default: "user" },

//     bloodGroup:   { type: String, default: "" },
//     phone:        { type: String, default: "" },
//     province:     { type: String, default: "" },
//     district:     { type: String, default: "" },
//     municipality: { type: String, default: "" },

//     // Date of birth stored as separate strings
//     dobDay:   { type: String, default: "" },
//     dobMonth: { type: String, default: "" },
//     dobYear:  { type: String, default: "" },

//     // Hospital-specific
//     hospitalName:      { type: String, default: "" },
//     hospitalRegNumber: { type: String, default: "" },

//     isVerified:    { type: Boolean, default: false },
//     avatar:        { type: String, default: "" },
//     documentPhoto: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// // ── Pre-save hook ─────────────────────────────────────────────────────────────
// // FIX: Do NOT use `next` with async pre-save hooks in modern Mongoose.
// // Simply return a promise (async/await) — Mongoose handles it automatically.
// userSchema.pre("save", async function () {
//   if (!this.isModified("password") || !this.password) return;
//   this.password = await bcrypt.hash(this.password, 10);
// });

// // ── Password comparison ───────────────────────────────────────────────────────
// userSchema.methods.comparePassword = async function (plain) {
//   if (!this.password) return false;
//   return bcrypt.compare(plain, this.password);
// };

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    googleId: { type: String, default: null },
    role:     { type: String, enum: ["user", "hospital", "admin"], default: "user" },

    bloodGroup:   { type: String, default: "" },
    phone:        { type: String, default: "" },
    province:     { type: String, default: "" },
    district:     { type: String, default: "" },
    municipality: { type: String, default: "" },

    // Date of birth stored as separate strings
    dobDay:   { type: String, default: "" },
    dobMonth: { type: String, default: "" },
    dobYear:  { type: String, default: "" },

    // Hospital-specific
    hospitalName:      { type: String, default: "" },
    hospitalRegNumber: { type: String, default: "" },

    isVerified:    { type: Boolean, default: false },
    avatar:        { type: String, default: "" },
    documentPhoto: { type: String, default: "" },

    // ── Temporary location ────────────────────────────────────────────────────
    // Set during registration; shown as a yellow pin on the search map.
    // Users can update this later from their profile settings.
    tempLocation: {
      lat:   { type: Number, default: null },
      lng:   { type: Number, default: null },
      label: { type: String, default: ""   },
    },
  },
  { timestamps: true }
);

// ── Pre-save hook ─────────────────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ── Indexes for performance ───────────────────────────────────────────────────
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ 'tempLocation.lat': 1, 'tempLocation.lng': 1 });
userSchema.index({ isVerified: 1, 'tempLocation.lat': 1 });

// ── Password comparison ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);