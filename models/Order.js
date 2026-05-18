const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  id: String,
  date: Date,
  status: String,
  userEmail: String,
  userName: String,
  userPhone: String,
  userAddress: String,
  items: Array,
  subtotal: Number, // ← নতুন
  deliveryFee: Number, // ← নতুন
  deliveryZone: String, // ← নতুন ("inside" বা "outside")
  total: Number,
  paymentMethod: String,
  latitude: Number,
  longitude: Number,
});

module.exports = mongoose.model("Order", orderSchema);
