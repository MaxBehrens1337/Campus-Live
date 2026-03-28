// ─── Enums ────────────────────────────────────────────────────────────────────

export type CampusVersion = "1.0" | "2.0";
export type StampStatus = "pending" | "in_progress" | "completed";
export type GameType = "memory" | "ordering" | "quiz" | "configurator";
export type Locale = "de" | "en";

// ─── Database Types ────────────────────────────────────────────────────────────

export interface CampusEvent {
  id: string;
  title: string;
  version: CampusVersion;
  date: string;
  location: string;
  created_at: string;
}

export interface CampusRegistration {
  id: string;
  event_id: string;
  company_name: string;
  customer_number: string;
  registered_at: string;
}

export interface CampusIsland {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface CampusStation {
  id: string;
  island_id: string;
  title: string;
  description: string | null;
  game_type: GameType;
  game_config: Record<string, unknown>;
  order_index: number;
  max_minutes: number;
  qr_code: string | null;
  created_at: string;
}

export interface CampusStamp {
  id: string;
  registration_id: string;
  station_id: string;
  status: StampStatus;
  completed_at: string | null;
  score: number | null;
}

export interface CampusQuizResult {
  id: string;
  registration_id: string;
  event_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, unknown>;
  completed_at: string;
}

export interface CampusFeedback {
  id: string;
  registration_id: string;
  event_id: string;
  overall_rating: number;
  content_rating: number;
  organization_rating: number;
  comment: string | null;
  submitted_at: string;
}

// ─── UI / App Types ────────────────────────────────────────────────────────────

export interface IslandWithStations extends CampusIsland {
  stations: StationWithStamp[];
}

export interface StationWithStamp extends CampusStation {
  stamp: CampusStamp | null;
}

export interface StampBookEntry {
  island: CampusIsland;
  stations: StationWithStamp[];
  completedCount: number;
  totalCount: number;
}

// ─── Mini-Game Types ───────────────────────────────────────────────────────────

export interface MemoryCard {
  id: string;
  productId: string;
  type: "image" | "name";
  content: string;
}

export interface OrderingStep {
  id: string;
  content: string;
  correctIndex: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

// ─── Product / Configurator Types ─────────────────────────────────────────────

export type ProductId =
  | "wipro3"
  | "pro-finder"
  | "vernetzung"
  | "gas-pro3"
  | "gas"
  | "tsa-rauchmelder"
  | "nfc"
  | "funk-handsender"
  | "funk-magnetkontakt"
  | "funk-kabelschleife";

export interface Product {
  id: ProductId;
  nameKey: string;
  descriptionKey: string;
  category: "alarm" | "tracking" | "networking" | "gas" | "accessory";
  required: boolean;
  dependencies: ProductId[];
  imageUrl?: string;
}

export interface ConfiguratorSelection {
  selectedProducts: ProductId[];
  scenario?: string;
}

// ─── Session Types ─────────────────────────────────────────────────────────────

export interface CampusSession {
  registrationId: string;
  companyName: string;
  customerNumber: string;
  eventId: string;
}
