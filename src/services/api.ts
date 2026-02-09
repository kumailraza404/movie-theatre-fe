import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Movie {
  _id?: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  runtime?: number;
  genres?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Showtime {
  _id: string;
  movieId: string;
  datetime: string;
  totalRows: number;
  totalColumns: number;
}

export interface Seat {
  row: number;
  column: number;
  status: 'available' | 'hold' | 'confirmed';
}

export interface SeatAvailability {
  showtime: {
    id: string;
    movieId: string;
    datetime: string;
    totalRows: number;
    totalColumns: number;
  };
  availability: Seat[][];
}

export interface Reservation {
  _id: string;
  userId?: string;
  showtimeId?: string;
  showtime?: {
    _id: string;
    datetime: string;
    totalRows: number;
    totalColumns: number;
  };
  movie?: {
    _id: string;
    tmdbId: number;
    title: string;
    posterPath: string;
    backdropPath?: string;
  } | null;
  seats: Seat[];
  status: 'hold' | 'confirmed';
  expiresAt?: string;
  createdAt?: string;
}

export const movieApi = {
  getNowPlaying: async (page: number = 1) => {
    const response = await api.get(`/movies/now-playing?page=${page}`);
    return response.data;
  },

  getMovieDetails: async (id: number) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },
};

export const showtimeApi = {
  getShowtimesByMovie: async (movieId: string) => {
    const response = await api.get(`/showtimes/movie/${movieId}`);
    return response.data;
  },

  getShowtimeById: async (id: string) => {
    const response = await api.get(`/showtimes/${id}`);
    return response.data;
  },
};

export const reservationApi = {
  getSeatAvailability: async (showtimeId: string): Promise<SeatAvailability> => {
    const response = await api.get(`/reservations/showtime/${showtimeId}`);
    return response.data;
  },

  getMyReservations: async (): Promise<Reservation[]> => {
    const response = await api.get('/reservations/my-reservations');
    return response.data;
  },

  holdSeats: async (showtimeId: string, seats: Seat[]) => {
    const response = await api.post('/reservations/hold', {
      showtimeId,
      seats: seats.map((s) => ({ row: s.row, column: s.column })),
    });
    return response.data;
  },

  confirmReservation: async (reservationId: string) => {
    const response = await api.post('/reservations/confirm', {
      reservationId,
    });
    return response.data;
  },

  cancelReservation: async (reservationId: string) => {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  signup: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/signup', { email, password, name });
    return response.data;
  },
};

export default api;
