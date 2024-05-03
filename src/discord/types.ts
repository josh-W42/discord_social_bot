export interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface Channel {
  id: string;
  guild_id?: string;
  name?: string;
}

export interface CreateMessagePayload {
  content: string;
}
