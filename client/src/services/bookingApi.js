
import api from "./api";

export const getMenu = async () => {
  const response = await api.get("/menu");
  return response.data.data.menuItems;
};

export const getTimeSlots = async () => {
  const response = await api.get("/time-slots");
  return response.data.data.timeSlots;
};

export const getTables = async () => {
  const response = await api.get("/tables");
  return response.data.data.tables;
};

export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data.data.booking;
};

export const getMyBookings = async () => {
  const response = await api.get("/bookings/mine");
  return response.data.data.bookings;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.patch(
    `/bookings/mine/${bookingId}/cancel`
  );

  return response.data.data.booking;
};

export const createPaymentOrder = async (bookingId) => {
  const response = await api.post(
    `/payments/${bookingId}/order`,
    {}
  );

  return response.data.data;
};

export const verifyPayment = async (bookingId, paymentData) => {
  const response = await api.post(
    `/payments/${bookingId}/verify`,
    paymentData
  );

  return response.data.data.booking;
};
