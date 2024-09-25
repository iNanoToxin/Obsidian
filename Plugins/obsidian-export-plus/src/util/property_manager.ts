export class PropertyManager {
    private overrides: Map<
        object,
        Map<
            string,
            {
                original: any;
                current: any;
            }
        >
    >;

    constructor() {
        this.overrides = new Map();
    }

    disable(obj: any, key: string): void {
        if (!this.overrides.has(obj)) {
            this.overrides.set(obj, new Map());
        }

        const objMap = this.overrides.get(obj)!;
        const original = obj[key];

        objMap.set(key, { original, current: original });

        if (typeof original === "function") {
            obj[key] = () => {};
        } else {
            Object.defineProperty(obj, key, {
                get: () => objMap.get(key)!.current,
                set: () => {},
                configurable: true,
                enumerable: true,
            });
        }
    }

    disableAll(obj: any, keys: string[]): void {
        keys.forEach((key) => this.disable(obj, key));
    }

    enable(obj: any, key: string): void {
        const objMap = this.overrides.get(obj);

        if (objMap && objMap.has(key)) {
            const { original } = objMap.get(key)!;
            if (typeof original === "function") {
                obj[key] = original;
            } else {
                Object.defineProperty(obj, key, {
                    value: original,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            objMap.delete(key);
        }
    }

    setValue(obj: any, key: string, value: any): void {
        const objMap = this.overrides.get(obj);
        if (objMap && objMap.has(key as string)) {
            const override = objMap.get(key as string)!;
            if (typeof override.original !== "function") {
                override.current = value;
            }
        }
    }

    reset(): void {
        for (const [obj, objMap] of this.overrides) {
            for (const key of objMap.keys()) {
                this.enable(obj as any, key);
            }
        }
        this.overrides.clear();
    }
}
