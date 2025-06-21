const MetroStation = require('../models/MetroStation');

// Get all metro stations
exports.getAllStations = async (req, res) => {
  try {
    const stations = await MetroStation.find().sort('name');
    res.json(stations);
  } catch (err) {
    console.error('Error fetching metro stations:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single metro station by ID
exports.getStationById = async (req, res) => {
  try {
    const station = await MetroStation.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Metro station not found' });
    }
    res.json(station);
  } catch (err) {
    console.error('Error fetching metro station:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search metro stations by name
exports.searchStations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const stations = await MetroStation.find({
      name: { $regex: query, $options: 'i' }
    }).sort('name').limit(10);

    res.json(stations);
  } catch (err) {
    console.error('Error searching metro stations:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get nearby metro stations based on coordinates
exports.getNearbyStations = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters (default 10km)
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const stations = await MetroStation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(10);

    res.json(stations);
  } catch (err) {
    console.error('Error fetching nearby metro stations:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new metro station (Admin only)
exports.createStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    location.coordinates[0] = location.coordinates[0] / 100000;
    location.coordinates[1] = location.coordinates[1] / 100000;

    if (!name || !location || !location.coordinates) {
      return res.status(400).json({ message: 'Name and location coordinates are required' });
    }

    // Validate coordinates
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Location coordinates must be an array [longitude, latitude]' });
    }

    // Parse coordinates as floating point numbers
    const coordinates = [
      parseFloat(location.coordinates[0]),
      parseFloat(location.coordinates[1])
    ];

    const newStation = new MetroStation({
      name,
      location: {
        type: 'Point',
        coordinates: coordinates
      }
    });

    await newStation.save();
    res.status(201).json(newStation);
  } catch (err) {
    console.error('Error creating metro station:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a metro station (Admin only)
exports.updateStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    location.coordinates[0] = location.coordinates[0] / 100000;
    location.coordinates[1] = location.coordinates[1] / 100000;
    const stationId = req.params.id;
    
    // Find the station first
    const station = await MetroStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Metro station not found' });
    }

    // Update fields if provided
    if (name) station.name = name;
    
    if (location && location.coordinates) {
      // Validate coordinates
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ message: 'Location coordinates must be an array [longitude, latitude]' });
      }
      
      // Parse coordinates as floating point numbers
      const coordinates = [
        parseFloat(location.coordinates[0]),
        parseFloat(location.coordinates[1])
      ];
      
      station.location = {
        type: 'Point',
        coordinates: coordinates
      };
    }

    await station.save();
    res.json(station);
  } catch (err) {
    console.error('Error updating metro station:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a metro station (Admin only)
exports.deleteStation = async (req, res) => {
  try {
    const stationId = req.params.id;
    
    const station = await MetroStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Metro station not found' });
    }

    // Check if station has associated parking lots
    const ParkingLot = require('../models/ParkingLot');
    const associatedLots = await ParkingLot.find({ metroStationId: stationId });
    
    if (associatedLots.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete station with associated parking lots. Remove parking lots first.',
        associatedLots: associatedLots.map(lot => ({ id: lot._id, name: lot.name }))
      });
    }

    await MetroStation.findByIdAndDelete(stationId);
    res.json({ message: 'Metro station deleted successfully' });
  } catch (err) {
    console.error('Error deleting metro station:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 