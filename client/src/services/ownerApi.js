
import api from "./api";

export const getOwnerDashboard = async () => {
  const response = await api.get("/analytics/dashboard");
  return response.data.data;
};

export const getOwnerBookings = async () => {
  const response = await api.get("/bookings");
  return response.data.data.bookings;
};

export const getManageMenu = async () => {
  const response = await api.get("/menu/manage/all");
  return response.data.data.menuItems;
};

export const getManageTables = async () => {
  const response = await api.get("/tables/manage/all");
  return response.data.data.tables;
};

export const getManageTimeSlots = async () => {
  const response = await api.get("/time-slots/manage/all");
  return response.data.data.timeSlots;
};

export const createOwnerMenuItem = async (data) => {
  const response = await api.post("/menu", data);
  return response.data.data.menuItem;
};

export const updateOwnerMenuItem = async (id, data) => {
  const response = await api.patch(`/menu/${id}`, data);
  return response.data.data.menuItem;
};

export const archiveOwnerMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data.data.menuItem;
};

export const createOwnerTable = async (data) => {
  const response = await api.post("/tables", data);
  return response.data.data.table;
};

export const updateOwnerTable = async (id, data) => {
  const response = await api.patch(`/tables/${id}`, data);
  return response.data.data.table;
};

export const deactivateOwnerTable = async (id) => {
  const response = await api.delete(`/tables/${id}`);
  return response.data.data.table;
};

export const createOwnerTimeSlot = async (data) => {
  const response = await api.post("/time-slots", data);
  return response.data.data.timeSlot;
};

export const updateOwnerTimeSlot = async (id, data) => {
  const response = await api.patch(`/time-slots/${id}`, data);
  return response.data.data.timeSlot;
};

export const deactivateOwnerTimeSlot = async (id) => {
  const response = await api.delete(`/time-slots/${id}`);
  return response.data.data.timeSlot;
};
