
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

                display: block;
            }
            :host([selected]), 
            :host([selected][cleared]) {
                --background: gold;
            }
            :host([cleared]) {
                --background: darkseagreen;
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

            `;
        return styles.cloneNode(true);
    }
});
