// Location detection service using browser geolocation and IP-based lookup

export interface LocationData {
  city?: string
  region?: string
  country?: string
  countryCode?: string
  formatted?: string
  latitude?: number
  longitude?: number
}

export class LocationService {
  
  /**
   * Get user's location using browser geolocation API
   */
  static async getBrowserLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported')
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Reverse geocode to get address
          const locationData = await this.reverseGeocode(latitude, longitude)
          resolve(locationData)
        },
        (error) => {
          console.warn('Geolocation error:', error.message)
          resolve(null)
        },
        { timeout: 10000 }
      )
    })
  }

  /**
   * Reverse geocode coordinates to address using free API
   */
  static async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    try {
      // Using Nominatim (OpenStreetMap) - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      )
      
      if (!response.ok) throw new Error('Geocoding failed')
      
      const data = await response.json()
      const address = data.address || {}
      
      const city = address.city || address.town || address.village || address.suburb
      const region = address.state || address.region || address.county
      const country = address.country
      const countryCode = address.country_code?.toUpperCase()
      
      const formatted = [city, country].filter(Boolean).join(', ')
      
      return {
        city,
        region,
        country,
        countryCode,
        formatted,
        latitude: lat,
        longitude: lon
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return { latitude: lat, longitude: lon }
    }
  }

  /**
   * Get location from IP address (fallback method)
   */
  static async getIPBasedLocation(): Promise<LocationData | null> {
    try {
      // Using ipapi.co - free tier, no API key needed
      const response = await fetch('https://ipapi.co/json/')
      
      if (!response.ok) throw new Error('IP lookup failed')
      
      const data = await response.json()
      
      return {
        city: data.city,
        region: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        formatted: `${data.city}, ${data.country_name}`,
        latitude: data.latitude,
        longitude: data.longitude
      }
    } catch (error) {
      console.error('IP-based location failed:', error)
      return null
    }
  }

  /**
   * Get user's location using best available method
   */
  static async detectLocation(): Promise<LocationData | null> {
    try {
      // Try browser geolocation first (most accurate)
      console.log('🌍 Detecting location...')
      const browserLocation = await this.getBrowserLocation()
      
      if (browserLocation?.formatted) {
        console.log('✅ Location detected:', browserLocation.formatted)
        return browserLocation
      }
      
      // Fallback to IP-based location
      console.log('📡 Trying IP-based location...')
      const ipLocation = await this.getIPBasedLocation()
      
      if (ipLocation?.formatted) {
        console.log('✅ Location detected:', ipLocation.formatted)
        return ipLocation
      }
      
      console.log('⚠️ Could not detect location')
      return null
    } catch (error) {
      console.error('Location detection failed:', error)
      return null
    }
  }

  /**
   * Format location for display
   */
  static formatLocation(location: LocationData): string {
    if (location.formatted) return location.formatted
    
    const parts = [
      location.city,
      location.region,
      location.country
    ].filter(Boolean)
    
    return parts.join(', ') || 'Unknown location'
  }

  /**
   * Parse location string into components
   */
  static parseLocation(locationString: string): Partial<LocationData> {
    const parts = locationString.split(',').map(s => s.trim())
    
    if (parts.length === 1) {
      return { city: parts[0] }
    } else if (parts.length === 2) {
      return { city: parts[0], country: parts[1] }
    } else if (parts.length >= 3) {
      return { city: parts[0], region: parts[1], country: parts[2] }
    }
    
    return { formatted: locationString }
  }

  /**
   * Comprehensive world locations database
   */
  static getWorldLocations(): string[] {
    return [
      // Ireland
      'Dublin, Ireland',
      'Cork, Ireland',
      'Galway, Ireland',
      'Limerick, Ireland',
      'Waterford, Ireland',
      'Drogheda, Ireland',
      'Kilkenny, Ireland',
      
      // United Kingdom
      'London, UK',
      'Manchester, UK',
      'Birmingham, UK',
      'Edinburgh, UK',
      'Glasgow, UK',
      'Liverpool, UK',
      'Bristol, UK',
      'Leeds, UK',
      'Cardiff, UK',
      'Belfast, UK',
      
      // United States
      'New York, USA',
      'Los Angeles, USA',
      'Chicago, USA',
      'Houston, USA',
      'Phoenix, USA',
      'Philadelphia, USA',
      'San Antonio, USA',
      'San Diego, USA',
      'Dallas, USA',
      'San Francisco, USA',
      'Austin, USA',
      'Seattle, USA',
      'Denver, USA',
      'Boston, USA',
      'Miami, USA',
      'Las Vegas, USA',
      'Portland, USA',
      'Nashville, USA',
      
      // France
      'Paris, France',
      'Marseille, France',
      'Lyon, France',
      'Toulouse, France',
      'Nice, France',
      'Nantes, France',
      'Bordeaux, France',
      
      // Germany
      'Berlin, Germany',
      'Munich, Germany',
      'Hamburg, Germany',
      'Frankfurt, Germany',
      'Cologne, Germany',
      'Stuttgart, Germany',
      'Düsseldorf, Germany',
      
      // Spain
      'Madrid, Spain',
      'Barcelona, Spain',
      'Valencia, Spain',
      'Seville, Spain',
      'Bilbao, Spain',
      'Málaga, Spain',
      
      // Italy
      'Rome, Italy',
      'Milan, Italy',
      'Naples, Italy',
      'Turin, Italy',
      'Florence, Italy',
      'Venice, Italy',
      'Bologna, Italy',
      
      // Netherlands
      'Amsterdam, Netherlands',
      'Rotterdam, Netherlands',
      'The Hague, Netherlands',
      'Utrecht, Netherlands',
      
      // Belgium
      'Brussels, Belgium',
      'Antwerp, Belgium',
      'Ghent, Belgium',
      'Bruges, Belgium',
      
      // Switzerland
      'Zurich, Switzerland',
      'Geneva, Switzerland',
      'Bern, Switzerland',
      'Basel, Switzerland',
      
      // Austria
      'Vienna, Austria',
      'Salzburg, Austria',
      'Innsbruck, Austria',
      
      // Portugal
      'Lisbon, Portugal',
      'Porto, Portugal',
      'Faro, Portugal',
      
      // Greece
      'Athens, Greece',
      'Thessaloniki, Greece',
      'Patras, Greece',
      
      // Poland
      'Warsaw, Poland',
      'Krakow, Poland',
      'Wrocław, Poland',
      'Gdansk, Poland',
      
      // Czech Republic
      'Prague, Czech Republic',
      'Brno, Czech Republic',
      
      // Scandinavia
      'Copenhagen, Denmark',
      'Stockholm, Sweden',
      'Oslo, Norway',
      'Helsinki, Finland',
      'Reykjavik, Iceland',
      
      // Canada
      'Toronto, Canada',
      'Vancouver, Canada',
      'Montreal, Canada',
      'Calgary, Canada',
      'Ottawa, Canada',
      'Edmonton, Canada',
      
      // Australia
      'Sydney, Australia',
      'Melbourne, Australia',
      'Brisbane, Australia',
      'Perth, Australia',
      'Adelaide, Australia',
      
      // New Zealand
      'Auckland, New Zealand',
      'Wellington, New Zealand',
      'Christchurch, New Zealand',
      
      // Asia
      'Tokyo, Japan',
      'Seoul, South Korea',
      'Beijing, China',
      'Shanghai, China',
      'Hong Kong, China',
      'Singapore, Singapore',
      'Bangkok, Thailand',
      'Kuala Lumpur, Malaysia',
      'Manila, Philippines',
      'Jakarta, Indonesia',
      'Hanoi, Vietnam',
      'Mumbai, India',
      'Delhi, India',
      'Bangalore, India',
      'Dubai, UAE',
      'Abu Dhabi, UAE',
      'Doha, Qatar',
      'Tel Aviv, Israel',
      'Istanbul, Turkey',
      
      // South America
      'São Paulo, Brazil',
      'Rio de Janeiro, Brazil',
      'Buenos Aires, Argentina',
      'Santiago, Chile',
      'Lima, Peru',
      'Bogotá, Colombia',
      'Mexico City, Mexico',
      
      // Africa
      'Cairo, Egypt',
      'Lagos, Nigeria',
      'Johannesburg, South Africa',
      'Cape Town, South Africa',
      'Nairobi, Kenya',
      'Casablanca, Morocco',
      
      // Middle East
      'Riyadh, Saudi Arabia',
      'Jeddah, Saudi Arabia',
      'Kuwait City, Kuwait',
      'Beirut, Lebanon',
      'Amman, Jordan',
      
      // Eastern Europe
      'Moscow, Russia',
      'Saint Petersburg, Russia',
      'Kiev, Ukraine',
      'Bucharest, Romania',
      'Budapest, Hungary',
      'Sofia, Bulgaria',
      
      // Baltic States
      'Tallinn, Estonia',
      'Riga, Latvia',
      'Vilnius, Lithuania'
    ]
  }
}

