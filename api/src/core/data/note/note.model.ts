type PlaceholderPayload = {
  placeholders: Record<string, string>;
  data?: Record<string, any>;
};

type NotePayload = PlaceholderPayload | Record<string, any>;

export interface NoteOptions {
  suffix?: string;
  prefix?: string;
}

interface NoteInput {
  payload?: NotePayload;
  text?: string;
  options?: NoteOptions;
}

export class Note {
  static fromPayload(payload: NotePayload): Note {
    return new Note({ payload });
  }

  static fromText(text: string): Note {
    return new Note({ text });
  }

  static from(input: NoteInput): Note {
    return new Note(input);
  }

  readonly payload: NotePayload;
  private readonly text: null | string;
  private readonly options: null | NoteOptions;

  constructor(readonly input: NoteInput) {
    this.payload = input?.payload || {};
    this.text = input?.text || null;
    this.options = input?.options || null;
  }

  getPlaceholderAwareNote(text: string, placeholders: string[]): string {
    if (!this.isPlaceholderPayload(this.payload)) {
      return this.getWrappedText(text);
    }

    let note = text;
    for (const placeholder of placeholders) {
      const value = this.payload.placeholders[placeholder];
      if (value) {
        note = note.replace(`\${${placeholder}}`, value);
      }
    }
    return this.getWrappedText(note);
  }

  hasText(): boolean {
    return this.text != null;
  }

  getText(): string {
    return this.getWrappedText(this.text || '');
  }

  isEmpty(): boolean {
    return this.text != null && Object.keys(this.payload).length > 0;
  }

  private getWrappedText(value: string): string {
    const prefix = this.options?.prefix ? `${this.options.prefix} ` : '';
    const suffix = this.options?.suffix ? ` ${this.options.suffix}` : '';
    return `${prefix}${value}${suffix}`;
  }

  private isPlaceholderPayload(payload: any): payload is PlaceholderPayload {
    return payload.placeholders;
  }
}
