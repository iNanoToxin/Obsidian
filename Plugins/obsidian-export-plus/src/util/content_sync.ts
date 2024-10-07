export class ContentSync {
    // Target window to sync with
    private windowToSync: Window;
    // Additional elements to sync (e.g., extra styles or nodes)
    private additionalElements: HTMLElement[];
    // WeakMap to store cloned elements for reuse
    private clonedElementsMap: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
    // List of currently synced styles
    private syncedStyles: HTMLElement[] = [];

    // List of CSS custom properties to sync between windows
    private stylesToSync: string[] = [
        "--font-interface-override",
        "--font-text-override",
        "--font-monospace-override",
        "--font-text-size",
        "--accent-h",
        "--accent-s",
        "--accent-l",
    ];
    // List of classes to sync between windows
    private classesToSync: string[] = ["is-frameless", "is-focused"];
    // Mutation observer to track and sync changes
    private observer: MutationObserver;

    constructor(windowToSync: Window, additionalElements: HTMLElement[] = []) {
        this.windowToSync = windowToSync;
        this.additionalElements = additionalElements;
        this.observer = new MutationObserver(this.mutationCallback.bind(this)); // Bind mutation observer callback

        // Initial sync of head elements and body styles/classes
        this.syncHeadElements();
        this.syncBodyClassesAndStyles();

        // Observe changes in the document head (e.g., styles added/removed)
        this.observer.observe(document.head, {
            attributes: true,
            attributeFilter: ["data-change"], // Only observe changes to data-change attribute
            subtree: true,
            childList: true,
            characterData: true,
        });

        // Observe changes in the document body (class or inline style changes)
        this.observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class", "style"], // Track changes to class and style attributes
        });

        // Handle focus change events to sync body classes based on window focus
        if (this.windowToSync.parent !== this.windowToSync) {
            this.windowToSync.parent.addEventListener("focuschange", this.syncBodyClassesAndStyles.bind(this));
        }
    }

    // Clone an element or retrieve it from the WeakMap if already cloned
    private cloneElement(element: HTMLElement): HTMLElement {
        if (!this.clonedElementsMap.has(element)) {
            const clonedElement = element.cloneNode(true) as HTMLElement;

            // Special case for MathJax styles to preserve CSS rules
            if (element instanceof HTMLStyleElement && element.sheet && element.id === "MJX-CHTML-styles") {
                clonedElement.textContent = Array.from(element.sheet.cssRules)
                    .map((rule) => rule.cssText)
                    .join("\n");
            }

            // Store cloned element in WeakMap for future reuse
            this.clonedElementsMap.set(element, clonedElement);
        }
        return this.clonedElementsMap.get(element)!;
    }

    // Sync <head> elements like stylesheets or <style> tags
    private syncHeadElements(): void {
        const head = this.windowToSync.document.head;

        // Clone and collect elements to sync (styles and CSS links)
        const elementsToSync: HTMLElement[] = this.additionalElements
            .concat(
                Array.from(document.head.children).filter(
                    (el) => el instanceof HTMLStyleElement || (el instanceof HTMLLinkElement && el.type === "text/css")
                ) as HTMLElement[]
            )
            .map(this.cloneElement.bind(this));

        // Remove old styles that are no longer present
        this.syncedStyles.forEach((oldStyle) => !elementsToSync.includes(oldStyle) && oldStyle.remove());
        this.syncedStyles = elementsToSync;

        // Replace all current head elements with the newly synced ones
        head.replaceChildren(...elementsToSync);
    }

    // Sync body classes and inline styles between windows
    private syncBodyClassesAndStyles(): void {
        // Sync classes between the original window and the target window
        let originalClasses = document.body.className.split(" ");
        let syncedClasses = new Set(this.windowToSync.document.body.className.split(" "));

        // Add/remove specific classes based on the state of the target window
        this.classesToSync.forEach((cls) => {
            if (syncedClasses.has(cls)) {
                originalClasses.push(cls);
            } else {
                originalClasses = originalClasses.filter((c) => c !== cls);
            }
        });

        // Ensure the "is-popout-window" class is applied if necessary
        if (this.windowToSync === this.windowToSync.parent && !originalClasses.includes("is-popout-window")) {
            originalClasses.push("is-popout-window");
        }

        // Update body class on the target window
        this.windowToSync.document.body.className = originalClasses.join(" ");

        // Sync specific inline styles between the windows
        this.stylesToSync.forEach((style) => {
            const originalStyle = document.body.style.getPropertyValue(style);
            this.windowToSync.document.body.style.setProperty(style, originalStyle);
        });
    }

    // MutationObserver callback that triggers syncing based on mutations
    private mutationCallback(mutations: MutationRecord[]): void {
        const syncHead = mutations.some(
            (mutation) => mutation.target instanceof HTMLStyleElement || mutation.target instanceof HTMLLinkElement
        );
        const syncBody = mutations.some((mutation) => mutation.target === document.body);

        // Sync head elements if relevant mutations occurred
        syncHead && this.syncHeadElements();

        // Sync body classes/styles if relevant mutations occurred
        syncBody && this.syncBodyClassesAndStyles();
    }

    // Cleanup function to stop observing and remove event listeners
    public cleanup(): void {
        this.observer.disconnect(); // Stop observing mutations
        if (this.windowToSync.parent !== this.windowToSync) {
            // Remove focuschange event listener if added
            this.windowToSync.parent.removeEventListener("focuschange", this.syncBodyClassesAndStyles.bind(this));
        }
    }
}
