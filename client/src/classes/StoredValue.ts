const PREFIX = "demostrike-stored-value";

export class StoredValue<T> {
  private readonly key = `${PREFIX}${this.name}`;

  constructor(private readonly name: string, private defaultValue: T) {}

  read() {
    return this.readStorage()
  }

  update(updater: (currentValue: T) => T) {
    this.writeStorage(updater(this.readStorage()));
  }

  private writeStorage(value: T) {
    localStorage.setItem(this.key, this.serialise(value));
  }

  private readStorage(): T {
    const serialised = localStorage.getItem(this.key);
    if (!serialised) {
      this.writeStorage(this.defaultValue);
      return this.readStorage();
    }
    return this.deserialise(serialised);
  }

  private serialise(value: T): string {
    switch (typeof value) {
      case "string":
        return value;
      default:
        throw new Error("Tried to store invalid value");
    }
  }

  private deserialise(value: string): T {
    switch (typeof this.defaultValue) {
      case "string":
        return value as unknown as T;
      default:
        throw new Error("Tried to store invalid value");
    }
  }
}
