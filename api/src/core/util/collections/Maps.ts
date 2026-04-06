export class Maps {
  static concat<TKey, TValue>(...maps: Map<TKey, TValue>[]): Map<TKey, TValue> {
    const result = new Map<TKey, TValue>();
    for (const map of maps) {
      map.forEach((value, key) => {
        result.set(key, value);
      });
    }
    return result;
  }

  static transform<TKey, TValue, TResult>(
    map: Map<TKey, TValue>,
    transformerFn: (key: TKey, value: TValue) => null | TResult,
  ): TResult[] {
    const result: TResult[] = [];
    map.forEach((value, key) => {
      const transformed = transformerFn(key, value);
      if (transformed != null) {
        result.push(transformed);
      }
    });
    return result;
  }

  static getOrDefault<TKey, TValue>(
    map: Map<TKey, TValue>,
    key: TKey,
    defaultValue: TValue,
  ): TValue {
    const value = map.get(key);
    if (value == null) {
      map.set(key, defaultValue);
      return defaultValue;
    }
    return value;
  }
}
