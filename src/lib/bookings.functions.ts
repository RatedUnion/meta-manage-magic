// In recordBookingPayment handler:
const { data: booking, error: fetchErr } = await supabaseAdmin
  .from("bookings")
  .select("id, email, payment_status")
  .eq("booking_reference", data.bookingReference)
  .single();

if (fetchErr || !booking) {
  throw new Error("Booking reference not found.");
}

// Ensure the email matches the original booking to prevent tampering
if (booking.email.trim().toLowerCase() !== data.email.trim().toLowerCase()) {
  throw new Error("Email does not match the booking details.");
}

if (booking.payment_status === "paid") {
  throw new Error("This booking has already been verified and paid.");
}
