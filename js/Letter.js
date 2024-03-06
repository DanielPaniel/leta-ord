
customElements.define('wf-letter', class extends HTMLElement  {

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
            <slot></slot>
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
                --background: floralwhite;

                --rainbow-1: #f8d1f8;
                --rainbow-2: #a5a7ff;
                --rainbow-3: #a5eaff;
                --rainbow-4: #95ffdf;
                --rainbow-5: #ffffb1;
                --rainbow-6: #ffdea8;
                --rainbow-7: #c4faa1;

                --color-clear: var(--rainbow-7);
                --color-select: gold;

                display: block;
            }
            :host([selected]), 
            :host([selected][cleared]) {
                --background: var(--color-select);
                filter: none;
            }
            :host([cleared]) {
                --background: var(--color-clear);
                filter: hue-rotate(calc(var(--colorIndex) * 1deg));
                animation: 300ms cubic-bezier(.13,1.2,1,.31) calc(var(--index, 0) * 75ms) 1 forwards winning,
                        150ms steps(10, jump-none) calc(var(--index, 0) * 35ms) calc(var(--index, 0) + 1) glitter;
            }

            button {
                color: black;
                font-family: var(--font);
                font-size: 2em;
                text-transform: uppercase;
                font-weight: bold;
                text-align: center;
                inline-size: 2em;
                block-size: 2em;
                background: var(--background);
                border-radius: .15em;
                border: .075em solid #8882;
                border-inline-end-color: #8883;
                border-block-end-color: #8884;
                cursor: pointer;
                padding: 0;
                margin: 0;
            }

            @keyframes glitter {
                from {
                    filter: hue-rotate(0deg);
                  }
                  to {
                    filter: hue-rotate(360deg);
                  }
            }

            @keyframes winning {
                0% {
                    transform: scale(1) translateY(0);
                }
                50% {
                    transform: scale(1.4) translateY(-.5em);
                }
                100% {
                    transform: scale(1) translateY(0);
                }
            }

            `;
        return styles.cloneNode(true);
    }

    connectedCallback() {
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
