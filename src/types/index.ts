export interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

export interface SystemStats {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    load: number;
    temp: number;
  };
  mainboard?: {
    manufacturer: string;
    model: string;
    temp?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
    available?: number;
    percentage: number;
  };
  network: {
    iface: string;
    rx_sec: number;
    tx_sec: number;
    operstate: string;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
