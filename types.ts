

export interface Note {
  id: string;
  text: string;
  timestamp: number;
  type: 'note' | 'outcome' | 'autotag' | 'system';
}

export interface FollowUp {
  contactId: string;
  dueDate: number;
  completed: boolean;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  leadType?: string;
  dealStage?: string;
  contactNote?: string;
  notes: Note[];
  lastActivity: number;
  snoozeUntil?: number;
  ignoreReminder?: boolean;
  lastActionTimestamps?: { [key: string]: number };
}

export interface CustomLeadType {
  id: string;
  name: string;
  theme: string;
}

export interface CustomDealStage {
  id: string;
  name: string;
  theme: string;
}

export interface CustomCallOutcome {
  id: string;
  name: string;
}

export interface AppSettings {
  leadTypes: CustomLeadType[];
  dealStages: CustomDealStage[];
  callOutcomes: CustomCallOutcome[];
}


export type View = 'list' | 'dashboard' | 'dealflow';