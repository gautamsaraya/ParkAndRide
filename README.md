# Park and Ride: Smart Parking & Last-Mile Connectivity Solution

## Overview

Park and Ride is a comprehensive mobile application designed to streamline urban commuting by providing seamless parking solutions near metro stations and facilitating last-mile connectivity. The app addresses the challenges of finding parking in congested urban areas and helps commuters efficiently transition between private vehicles and public transportation.

Users can search for metro stations, view nearby parking facilities, check real-time availability, reserve parking slots with flexible timing, and make secure payments. The platform also includes features for booking last-mile transportation services, creating a complete end-to-end commuting solution.

## Key Features

### For Users

- **Metro Station Search**: Find nearby metro stations or search by name
- **Parking Availability**: Real-time information on available parking slots
- **Dynamic Pricing**: Pricing based on demand and availability
- **Slot Reservation**: Select specific parking zones and slots
- **Flexible Booking**: Choose arrival and departure times
- **QR Code Access**: Digital access to parking facilities
- **Multiple Payment Options**: Wallet, loyalty points, and online payment
- **Reservation Management**: View, modify, and cancel reservations
- **User Profiles**: Store preferences and vehicle information
- **Loyalty Program**: Earn and redeem points for parking

### Ride Booking Features

- **Multiple Ride Types**:

  - On-Demand Rides: Instant booking for immediate travel
  - Scheduled Rides: Advance booking for planned journeys
  - Shared Rides: Cost-effective option with co-passengers
  - Private Rides: Exclusive vehicle usage

- **Vehicle Options**:

  - E-Rickshaw: Eco-friendly option with 3-seat capacity
  - Cab: Comfortable 4-seater vehicle
  - Shuttle: Spacious 8-seater for group travel

- **Smart Ride Matching**:

  - 10-minute matching window for shared rides
  - Intelligent seat availability tracking
  - Vehicle type compatibility check
  - Route optimization for shared journeys

- **Dynamic Fare Calculation**:

  - Distance-based pricing
  - Capacity-adjusted rates
  - Shared ride discounts
  - Real-time fare estimates

- **Location Services**:
  - Geoapify integration for precise location
  - Pickup/dropoff point autocomplete
  - Real-time location tracking
  - Route visualization

### For Administrators

- **Metro Station Management**: Add, edit, and remove metro stations
- **Parking Lot Management**: Configure parking facilities and capacity
- **Slot Management**: Define zones and manage individual parking slots
- **Time Restrictions**: Set maintenance periods and special restrictions
- **Dashboard**: Monitor usage statistics and occupancy rates
- **Driver Management**: Onboard and manage drivers
- **Vehicle Fleet Management**: Track and maintain vehicle inventory
- **Ride Analytics**: Monitor ride patterns and performance metrics

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Expo CLI
- React Native development environment

### Backend Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/ParkAndRide.git
   ```

2. Navigate to the backend directory:

   ```
   cd ParkAndRide/backend
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/parkandride
   JWT_SECRET=your_jwt_secret_key
   ```

5. Start the server:
   ```
   npm run dev
   ```

### Mobile App Setup

1. Navigate to the app directory:

   ```
   cd ParkAndRide/parkandride-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the Expo development server:

   ```
   npm start
   ```

4. Use the Expo Go app on your mobile device or an emulator to run the app.

## Technologies Used

### Backend

- **Express.js**: Fast, unopinionated web framework for Node.js
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: Elegant MongoDB object modeling for Node.js
- **JWT**: Secure authentication and authorization
- **bcryptjs**: Password hashing and security

### Frontend (Mobile App)

- **React Native**: Cross-platform mobile application framework
- **Expo**: Development platform for React Native
- **React Navigation**: Navigation and routing solution
- **Axios**: Promise-based HTTP client
- **AsyncStorage**: Local data persistence
- **React Native Reanimated**: Animations and gestures
- **React Native Vector Icons**: Icon library
- **React Native QR Code SVG**: QR code generation

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate user and get token
- `GET /api/auth/me`: Get current user profile

### Metro Stations

- `GET /api/metro-stations`: Get all metro stations
- `GET /api/metro-stations/:id`: Get specific metro station
- `GET /api/metro-stations/search`: Search stations by name
- `GET /api/metro-stations/nearby`: Find stations near coordinates

### Parking Lots

- `GET /api/parking-lots`: Get all parking lots
- `GET /api/parking-lots/:id`: Get specific parking lot
- `GET /api/parking-lots/by-station/:metroStationId`: Get lots by metro station
- `GET /api/parking-lots/:lotId/slots`: Get slots for a parking lot
- `GET /api/parking-lots/:lotId/availability`: Check slot availability

### Reservations

- `POST /api/reservations`: Create a new reservation
- `GET /api/reservations`: Get user's reservations
- `GET /api/reservations/:id`: Get specific reservation
- `PUT /api/reservations/:id/cancel`: Cancel a reservation
- `PUT /api/reservations/:id/payment`: Complete payment
- `PUT /api/reservations/:id/update-time`: Update reservation time

### Ride Management

- `POST /api/rides`: Create a new ride booking
- `GET /api/rides`: Get user's ride history
- `GET /api/rides/:id`: Get specific ride details
- `PUT /api/rides/:id/cancel`: Cancel a ride
- `GET /api/rides/available`: Find available rides for sharing
- `POST /api/rides/estimate`: Get fare estimate for a ride
- `GET /api/rides/active`: Get user's active rides

### Driver Management

- `POST /api/admin/drivers`: Add a new driver
- `GET /api/admin/drivers`: List all drivers
- `GET /api/admin/drivers/:id`: Get driver details
- `PUT /api/admin/drivers/:id`: Update driver information
- `PUT /api/admin/drivers/:id/status`: Update driver status
- `DELETE /api/admin/drivers/:id`: Remove a driver

### Vehicle Management

- `POST /api/admin/vehicles`: Add a new vehicle
- `GET /api/admin/vehicles`: List all vehicles
- `GET /api/admin/vehicles/:id`: Get vehicle details
- `PUT /api/admin/vehicles/:id`: Update vehicle information
- `PUT /api/admin/vehicles/:id/status`: Update vehicle status
- `DELETE /api/admin/vehicles/:id`: Remove a vehicle

### User Profile

- `GET /api/user/me`: Get user profile
- `POST /api/user/wallet/add`: Add money to wallet
- `POST /api/user/wallet/redeem-points`: Redeem loyalty points
- `GET /api/user/wallet/transactions`: Get wallet transaction history

## Contributors

- [Gautam Saraya](https://github.com/gautamsaraya)

## Acknowledgements

- [React Native Community](https://reactnative.dev/)
- [Expo Team](https://expo.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Express.js](https://expressjs.com/)

## License

This project is licensed under the MIT License.
