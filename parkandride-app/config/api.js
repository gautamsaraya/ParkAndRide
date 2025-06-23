import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../utils/auth";

// API base URL - in a real app, this would come from .env file
const API_BASE_URL = "http://192.168.1.2:5000/api";

// Create API instance
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to requests
API.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token from storage
      await AsyncStorage.removeItem("token");

      // If you have access to navigation, you could redirect to login
      // navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const AuthAPI = {
  register: (userData) => API.post("/auth/register", userData),
  login: (credentials) => API.post("/auth/login", credentials),
  getProfile: () => API.get("/auth/me"),
};

// User API endpoints
export const UserAPI = {
  getProfile: () => API.get("/user/me"),
  addWalletBalance: (amount) => API.post("/user/wallet/add", { amount }),
  redeemLoyaltyPoints: () => API.post("/user/wallet/redeem-points"),
  getWalletTransactions: () => API.get("/user/wallet/transactions"),
};

// Metro Stations API endpoints
export const MetroStationsAPI = {
  getAll: () => API.get("/metro-stations"),
  getById: (id) => API.get(`/metro-stations/${id}`),
  search: (query) => API.get(`/metro-stations/search?query=${query}`),
  getNearby: (longitude, latitude, maxDistance) =>
    API.get(
      `/metro-stations/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`
    ),
};

// Parking Lots API endpoints
export const ParkingLotsAPI = {
  getAll: () => API.get("/parking-lots"),
  getById: (id) => API.get(`/parking-lots/${id}`),
  getByMetroStation: (metroStationId) =>
    API.get(`/parking-lots/by-station/${metroStationId}`),
  getSlots: (lotId) => API.get(`/parking-lots/${lotId}/slots`),
  checkAvailability: (lotId, startTime, endTime) =>
    API.get(
      `/parking-lots/${lotId}/availability?startTime=${startTime}&endTime=${endTime}`
    ),
  checkSlotAvailability: (slotId, startTime, endTime) =>
    API.get(
      `/parking-lots/slots/${slotId}/availability?startTime=${startTime}&endTime=${endTime}`
    ),
};

// Reservations API endpoints
export const ReservationsAPI = {
  getUserReservations: () => API.get("/reservations"),
  getById: (id) => API.get(`/reservations/${id}`),
  create: (reservationData) => API.post("/reservations", reservationData),
  cancel: (id) => API.put(`/reservations/${id}/cancel`),
  completePayment: (id, paymentMethod) =>
    API.put(`/reservations/${id}/payment`, { paymentMethod }),
  updateTime: (id, timeData) =>
    API.put(`/reservations/${id}/update-time`, timeData),
};

// Rides API endpoints
export const RidesAPI = {
  getUserRides: () => API.get("/rides"),
  getById: (id) => API.get(`/rides/${id}`),
  bookRide: (rideData) => API.post("/rides", rideData),
  cancelRide: (id) => API.put(`/rides/${id}/cancel`),
  completeRide: (id, paymentMethod) =>
    API.put(`/rides/${id}/complete`, { paymentMethod }),
  checkAvailability: (params) =>
    API.get("/rides/check-availability", { params }),
  updateRide: (id, updateData) => API.put(`/rides/${id}`, updateData),
};

// Admin API endpoints
export const AdminAPI = {
  // Metro Stations
  createStation: (stationData) =>
    API.post("/admin/metro-stations", stationData),
  updateStation: (id, stationData) =>
    API.put(`/admin/metro-stations/${id}`, stationData),
  deleteStation: (id) => API.delete(`/admin/metro-stations/${id}`),

  // Parking Lots
  createParkingLot: (lotData) => API.post("/admin/parking-lots", lotData),
  updateParkingLot: (id, lotData) =>
    API.put(`/admin/parking-lots/${id}`, lotData),
  deleteParkingLot: (id) => API.delete(`/admin/parking-lots/${id}`),

  // Parking Slots
  createParkingSlot: (slotData) => API.post("/admin/parking-slots", slotData),
  createMultipleParkingSlots: (slotsData) =>
    API.post("/admin/parking-slots/bulk", slotsData),
  updateParkingSlot: (id, slotData) =>
    API.put(`/admin/parking-slots/${id}`, slotData),
  deleteParkingSlot: (id) => API.delete(`/admin/parking-slots/${id}`),
  addTimeRestriction: (id, restrictionData) =>
    API.post(`/admin/parking-slots/${id}/time-restrictions`, restrictionData),
  removeTimeRestriction: (id, restrictionIndex) =>
    API.delete(
      `/admin/parking-slots/${id}/time-restrictions/${restrictionIndex}`
    ),

  // Drivers
  getAllDrivers: () => API.get("/admin/drivers"),
  getDriverById: (id) => API.get(`/admin/drivers/${id}`),
  createDriver: (driverData) => API.post("/admin/drivers", driverData),
  updateDriver: (id, driverData) => API.put(`/admin/drivers/${id}`, driverData),
  deleteDriver: (id) => API.delete(`/admin/drivers/${id}`),

  // Vehicles
  getAllVehicles: () => API.get("/admin/vehicles"),
  getVehicleById: (id) => API.get(`/admin/vehicles/${id}`),
  getVehiclesByStation: (stationId) =>
    API.get(`/admin/vehicles/by-station/${stationId}`),
  createVehicle: (vehicleData) => API.post("/admin/vehicles", vehicleData),
  updateVehicle: (id, vehicleData) =>
    API.put(`/admin/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => API.delete(`/admin/vehicles/${id}`),
};

export default API;
