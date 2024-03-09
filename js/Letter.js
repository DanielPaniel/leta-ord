
customElements.define('wf-letter', class extends HTMLElement  {
    static observedAttributes = ["has-loaded"];
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        let shadow = this.shadowRoot;
        shadow.appendChild(this._getTemplate());
        shadow.appendChild(this._getStyle());
    }

    /**
     * Create structure
     * @returns {Node}
     */
    _getTemplate() {
        let template = document.createElement("template");
        template.innerHTML = // html
        `
        <button>
            <div>
                <slot></slot>
            </div>
        </button>
        `;
        return template.content.cloneNode(true);
    }
    
    /**
     * Create CSS for shadow DOM
     * @returns {Node}
     */
    _getStyle() {
        let styles = document.createElement("style");
        styles.textContent = //css
        `
            :host {
                --font: var(--wf-font, monospace);
                --background: #4e4d4c;
                --foreground: #fff;
                --color-clear: #c4faa1;
                --color-select: #ffe44b;
                --foreground-color-select: #000;

                display: block;
            }
            :host([selected]), 
            :host([selected][cleared]) {
                --background: var(--color-select);
                --foreground: var(--foreground-color-select);
                filter: none;
                animation: none;
            }
            :host([cleared]) {
                --background: var(--color-clear);
                --foreground: var(--foreground-color-select);
                filter: hue-rotate(calc(var(--colorIndex) * 1deg));
            }
            :host([has-loaded]) button div {
                /* for some reason this could not be done with transition: opacity in safari */
                animation: 200ms ease-in-out calc(var(--index, 0) * 8ms) 1 forwards reveal;
            }
            button {
                color: var(--foreground);
                display: block;
                font-family: var(--font);
                font-size: calc(var(--letter-size) / 2);
                text-transform: uppercase;
                font-weight: bold;
                text-align: center;
                inline-size: var(--letter-size);
                block-size: var(--letter-size);
                inline-size: 2em;
                block-size: 2em;
                background: var(--background);
                border-radius: .15em;
                border: .075em solid #fff3;
                border-inline-end-color: #0005;
                border-block-end-color: #0006;
                cursor: pointer;
                padding: 0;
                margin: 0;
            }
            button div {
                opacity: 0;

            }

            @keyframes reveal {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            `;
        return styles.cloneNode(true);
    }

    connectedCallback() {
        let randomIndex = Math.floor(Math.random() * 100);
        this.style.setProperty("--index", randomIndex);
        let button = this.shadowRoot.querySelector("button");

        /* Use listeners on native html button element, 
        in order to make use of release pointer capture.
        Otherwise the pointer-event will be stuck on its initial element */
        button.addEventListener("pointerdown", (event) => {
            event.target.releasePointerCapture(event.pointerId);
            this.dispatchEvent(new CustomEvent("wf-letter-press"));
        });

        // Letters which are selected with a "swipe/drag"
        button.addEventListener("pointerenter", (event) => {
            event.target.releasePointerCapture(event.pointerId);
            this.dispatchEvent(new CustomEvent("wf-letter-activate"));
        });

        button.addEventListener("pointerup", () => {
            this.dispatchEvent(new CustomEvent("wf-letter-release"));
        });
    }
});
