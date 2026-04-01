export type WeatherResponse = {
  current_weather?: {
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
  };
};

export type AirQualityResponse = {
  current?: {
    pm2_5?: number;
    pm10?: number;
  };
};

export type UserPreferenceRow = {
  preference_type: string;
  preference_value: string;
};

export type LocationRow = {
  location_id: string;
};

export type LocationResponseItem = {
  location_id: string;
  lat: number;
  lon: number;
};

export type ActivityScoreResponse = {
  score: number;
  recommendation: string;
  preferences: UserPreferenceRow[];
  weather: {
    temperature?: number;
    wind_speed?: number;
    conditions?: number;
  };
  air_quality: {
    pm2_5?: number;
    pm10?: number;
  };
};
