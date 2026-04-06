export type JSONValue =
  | string
  | number
  | null
  | boolean
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type JSONArray = Array<JSONValue>;
