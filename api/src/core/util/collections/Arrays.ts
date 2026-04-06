export class Arrays {
  static firstNotEmpty<I, O>(items: I[], fn: (input: I) => null | O): null | O {
    for (const item of items) {
      const result = fn(item);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  static async mapAsync<TElement, TResult>(
    elements: TElement[],
    mapper: (element: TElement) => Promise<TResult>,
  ): Promise<TResult[]> {
    const result: TResult[] = [];
    for (const element of elements) {
      result.push(await mapper(element));
    }
    return result;
  }

  static group<TKey, TElement>(
    elements: TElement[],
    keyProvider: (element: TElement) => TKey,
  ): Map<TKey, TElement[]> {
    const map = new Map<TKey, TElement[]>();
    elements.forEach((element) => {
      const key = keyProvider(element);
      let values = map.get(key);
      if (!values) {
        values = [];
        map.set(key, values);
      }
      values.push(element);
    });
    return map;
  }

  static async filterAsync<TElement>(
    elements: TElement[],
    predicate: (element: TElement) => Promise<boolean>,
  ): Promise<TElement[]> {
    const filtered: TElement[] = [];
    for (const element of elements) {
      const result = await predicate(element);
      if (result) {
        filtered.push(element);
      }
    }
    return filtered;
  }

  static lastItem<TElement>(elements: TElement[]) {
    if (elements.length === 0) {
      throw new Error('Could not obtain last element because of empty array');
    }
    return elements[elements.length - 1];
  }

  static uniqueNotNull<TElement, TResult>(
    items: TElement[],
    mapper: (item: TElement) => TResult,
  ): NonNullable<TResult>[] {
    return Array.from(
      new Set(items.map(mapper).filter((result) => result != null)),
    );
  }

  static unique<TElement, TResult>(
    items: TElement[],
    mapper: (item: TElement) => TResult,
  ): TResult[] {
    return Array.from(new Set(items.map(mapper)));
  }

  static wrap<TElement>(item: TElement | TElement[]): TElement[] {
    return Array.isArray(item) ? item : [item];
  }
}
