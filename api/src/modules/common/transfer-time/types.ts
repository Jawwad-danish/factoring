export interface TransferTime {
  cutoff: {
    hour: number;
    minute: number;
  };
  send: {
    hour: number;
    minute: number;
  };
  name: string;
  next?: TransferTime;
  previous?: TransferTime;
}

export interface ArrivalTime {
  arrival: {
    hour: number;
    minute: number;
  };
  name: string;
}

export interface WireOverrideWindow {
  start: {
    hour: number;
    minute: number;
  };
  end: {
    hour: number;
    minute: number;
  };
}
