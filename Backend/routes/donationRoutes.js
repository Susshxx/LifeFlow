const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Donation = require("../models/Donation");

// ── helpers ──────────────────────────────────────────────────────────────────

function generateTransactionUUID() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const short = uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${dateStr}-${timeStr}-${short}`;
}

function generateSignature(message, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

function verifySignature(decoded, secretKey) {
  const signedFields = decoded.signed_field_names.split(",");
  const message = signedFields.map((f) => `${f}=${decoded[f]}`).join(",");
  const expected = generateSignature(message, secretKey);
  return expected === decoded.signature;
}

// ── POST /api/donation/initiate ───────────────────────────────────────────────
router.post("/initiate", async (req, res) => {
  try {
    const { amount, donorName = "Anonymous", message = "" } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid donation amount." });
    }

    const numAmount = Number(amount);
    const transaction_uuid = generateTransactionUUID();

    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const backendUrl = `http://localhost:${process.env.PORT || 5000}`;

    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const sigMessage = `total_amount=${numAmount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = generateSignature(sigMessage, secretKey);

    // Fire-and-forget DB save — don't block the response on it.
    // The record will be upserted/created when success/failure callback arrives.
    Donation.create({
      transaction_uuid,
      amount: numAmount,
      total_amount: numAmount,
      donorName,
      message,
      status: "PENDING",
    }).catch((err) =>
      console.warn("Donation DB save (non-blocking) failed:", err.message)
    );

    return res.json({
      amount: numAmount,
      tax_amount: 0,
      total_amount: numAmount,
      transaction_uuid,
      product_code,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${backendUrl}/api/donation/success`,
      failure_url: `${backendUrl}/api/donation/failure`,
      signed_field_names,
      signature,
      esewa_url: `${process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np"}/api/epay/main/v2/form`,
    });
  } catch (err) {
    console.error("Donation initiate error:", err);
    return res.status(500).json({ error: "Failed to initiate donation." });
  }
});

// ── GET /api/donation/success ─────────────────────────────────────────────────
router.get("/success", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const { data } = req.query;
    if (!data) {
      return res.redirect(`${frontendUrl}/donation/failure?reason=no_data`);
    }

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

    if (!verifySignature(decoded, secretKey)) {
      console.error("eSewa signature mismatch!", decoded);
      return res.redirect(`${frontendUrl}/donation/failure?reason=signature_mismatch`);
    }

    const { transaction_uuid, total_amount, transaction_code, ref_id, status } = decoded;

    // Fire-and-forget DB update — redirect immediately, don't await Atlas
    Donation.findOneAndUpdate(
      { transaction_uuid },
      {
        status: status === "COMPLETE" ? "COMPLETE" : "FAILED",
        esewa_transaction_code: transaction_code,
        esewa_ref_id: ref_id || null,
      }
    ).catch((err) => console.warn("Success DB update (non-blocking) failed:", err.message));

    return res.redirect(
      `${frontendUrl}/donation/success?uuid=${transaction_uuid}&amount=${total_amount}&ref=${ref_id || ""}`
    );
  } catch (err) {
    console.error("Donation success handler error:", err);
    return res.redirect(`${frontendUrl}/donation/failure?reason=server_error`);
  }
});

// ── GET /api/donation/failure ────────────────────────────────────────────────
router.get("/failure", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { transaction_uuid } = req.query;

  // Fire-and-forget DB update
  if (transaction_uuid) {
    Donation.findOneAndUpdate({ transaction_uuid }, { status: "FAILED" })
      .catch((err) => console.warn("Failure DB update (non-blocking) failed:", err.message));
  }

  return res.redirect(`${frontendUrl}/donation/failure`);
});

// ── GET /api/donation/status/:uuid ───────────────────────────────────────────
router.get("/status/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const donation = await Donation.findOne({ transaction_uuid: uuid });
    if (!donation) return res.status(404).json({ error: "Donation not found." });

    const statusUrl = process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np";
    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";

    const response = await axios.get(
      `${statusUrl}/api/epay/transaction/status/`,
      {
        params: {
          product_code,
          total_amount: donation.total_amount,
          transaction_uuid: uuid,
        },
      }
    );

    const esewaStatus = response.data;
    if (esewaStatus.status) {
      await Donation.findOneAndUpdate(
        { transaction_uuid: uuid },
        { status: esewaStatus.status, esewa_ref_id: esewaStatus.ref_id || null }
      );
    }

    return res.json({ ...esewaStatus, local: donation });
  } catch (err) {
    console.error("Donation status check error:", err.message);
    return res.status(500).json({ error: "Status check failed." });
  }
});

module.exports = router;
