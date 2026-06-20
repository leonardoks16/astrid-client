export type GraphQLVariables = Record<string, unknown>;

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLErrorShape {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: ReadonlyArray<string | number>;
  extensions?: Record<string, unknown>;
}

export interface PersistedQueryOptions {
  sha256Hash: string;
}
