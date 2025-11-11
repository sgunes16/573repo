// @ts-ignore
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN

export interface MapboxFeature {
  place_name: string
  center: [number, number]
  geometry: {
    coordinates: [number, number]
  }
}

export interface MapboxResponse {
  features: MapboxFeature[]
}

export const mapboxService = {
  async reverseGeocode(longitude: number, latitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,neighborhood,locality`
      )
      const data: MapboxResponse = await response.json()
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name
      }
      
      return 'Location not found'
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return 'Unable to fetch address'
    }
  },

  async forwardGeocode(address: string, limit: number = 5): Promise<Array<{ longitude: number; latitude: number; address: string }>> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=${limit}`
      )
      const data: MapboxResponse = await response.json()
      
      if (data.features && data.features.length > 0) {
        return data.features.map(feature => ({
          longitude: feature.center[0],
          latitude: feature.center[1],
          address: feature.place_name,
        }))
      }
      
      return []
    } catch (error) {
      console.error('Forward geocoding error:', error)
      return []
    }
  },
}

