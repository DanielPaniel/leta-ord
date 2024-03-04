
customElements.define('wf-game-engine', class extends HTMLElement  {

    constructor() {
        super();
        this._dimension = 8;
        this._maxNbrOfWords = 10;

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
        <header>
            <slot name="title"></slot>
            <button>Nytt</button>
        </header>
        <slot></slot>
        <dialog>
            <div class="dialog-container">
                <h2>Nytt spel</h2>
                <div class="menu"></div>
            </div>
        </dialog>
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

                font-size: 12px;
                display: block;
                width: min-content;
            }
            header {
                font-family: var(--font);

                display: flex;
                padding-block: .5rem;
            }
            header button {
                margin-inline: auto 0;
                font-family: var(--font);
                font-weight: bold;
                font-size: 1em;

            } 
            ::slotted(h1) {
                margin: 0;
                padding: 0;
                font-size: 1.5em;
            }
            dialog {
                --foreground: #fff;
                --background: #333;

                font-family: var(--font);
                font-size: 1em;
                background: transparent;
                border: none;

                color: var(--foreground);
                padding-block: 0;
                padding-inline: 0;
                width: min(80vw, 20em);
            }
            dialog::backdrop {
                background: rgba(0,0,0,.5);
                backdrop-filter: blur(10px);
            }
            .dialog-container {
                padding-block: 1em;
                padding-inline: 2em;
                border: 1px solid var(--foreground);
                border-radius: .2em;
                background: var(--background);
            }
            .menu {
                display: flex;
                flex-flow: row wrap;
                gap: 1em;
            }
            .menu button {
                font-family: var(--font);
                font-weight: bold;
                font-size: 1em;
                background: #fff3;
                border: 1px solid var(--foreground);
                color: var(--foreground);
                text-transform: capitalize;
                cursor: pointer;
                padding: .3em .5em;
                border-radius: .2em;
            }
            `;
        return styles.cloneNode(true);
    }

    connectedCallback() {
        this._setup();
        this._setupDialogMenu();
    }

    async _setup() {
        let words = await this._getElementsFromLightDom("wf-wordlist[selected] li")
            .then((elements) => this._parseWords(elements));
        let letters = this._generateBoard(this._shuffleArray(words));
        
        let boardElement = this.querySelector("wf-game-board");
        boardElement.innerHTML = "";
        letters.forEach((row) => {
            row.forEach((letter) => {
                if (letter.textContent === "-") {
                    this._updateLetterElement(letter, this._randomChar());
                }
                boardElement.append(letter);
            });
        });

    }

    async _createWordlistMenu() {
        let lists = await this._getElementsFromLightDom("wf-wordlist");
        let dialog = this.shadowRoot.querySelector("dialog");
        let menuElement = this.shadowRoot.querySelector(".menu");
        lists.forEach((list) => {
            let button = document.createElement("button");
            let wordlistName = list.getAttribute("name");
            button.innerHTML = wordlistName;
            button.addEventListener("click", () => {
                this._selectWordlist(lists, wordlistName);
                dialog.close();
                this._setup();
            });
            menuElement.append(button);
        });
    }

    _setupDialogMenu() {
        this._createWordlistMenu();
        let dialog = this.shadowRoot.querySelector("dialog");
        let menuButton = this.shadowRoot.querySelector("header button");
        menuButton.addEventListener("click", () => {
            dialog.showModal();
        });
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                dialog.close();
            }
        });

    }

    _selectWordlist(lists, nameOfSelectedList) {
        lists.forEach((list) => {
            list.removeAttribute("selected");
            if (list.getAttribute("name") === nameOfSelectedList) {
                list.setAttribute("selected", "");
            }
        });
    }

    _getElementsFromLightDom(selector) {
        return new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            let elements = this.querySelectorAll(selector);
            if (elements.length) {
              clearInterval(interval);
              resolve(elements);
            }
          }, 100);
      
          // Timeout efter 10 sekunder (om elementet inte hittas)
          setTimeout(() => {
            clearInterval(interval);
            reject(new Error(`Timeout waiting for element with selector: ${selector}`));
          }, 10000); // Timeout efter 10 sekunder
        });
    }

    _parseWords(elements) {
        let words = [];
        elements.forEach((wordElement) => {
            let word = wordElement.textContent;
            // Ta bort för långa ord
            if (word.length <= this._dimension) {
                words.push(word);
            }
        });
        return words;
    }

    _generateBoard(words) {
        // Skapa ett korsord
        const board = [];
        for (let i = 0; i < this._dimension; i++) {
            board[i] = [];
            for (let j = 0; j < this._dimension; j++) {
                board[i][j] = this._createLetterElement("-");
            }
        }

        // Placera in orden i korsordet
        let placedWords = 0;
        for (let i = 0; i < words.length && placedWords <  this._maxNbrOfWords; i++) {
            const word = words[i];
            const length = words[i].length;
            const direction = Math.random() < 0.5 ? "across" : "down";
            let x, y;

            if (direction === "across") {
                x = Math.floor(Math.random() * (this._dimension - length));
                y = Math.floor(Math.random() * this._dimension);
            } else {
                x = Math.floor(Math.random() * this._dimension);
                y = Math.floor(Math.random() * (this._dimension - length));
            }
            if (this._canPlaceWord(board, word, x, y, direction)) {
                this._placeWord(board, word, x, y, direction);
                placedWords++;
            }
        }

        return board;
    }

    // Hjälpfunktion för att kontrollera om ett ord kan placeras
    _canPlaceWord(board, word, x, y, direction) {
        const length = word.length;
        if (direction === "across") {
            if (x + length > this._dimension) return false;
            for (let i = 0; i < length; i++) {
                if (board[y][x + i].textContent !== "-" 
                    && board[y][x + i].textContent !== word[i]) {
                    return false;
                }
            }
        } else {
            if (y + length > this._dimension) return false;
            for (let i = 0; i < length; i++) {
                if (board[y + i][x].textContent !== "-" 
                    && board[y + i][x].textContent !== word[i]) {
                    return false;
                }
            }
        }

        return true;
    }
              
    // Placera ett ord i korsordet
    _placeWord(board, word, x, y, direction) {
        const length = word.length;

        if (direction === "across") {
            for (let i = 0; i < length; i++) {
                this._updateLetterElement(board[y][x + i], word[i], word);
            }
        } else {
            for (let i = 0; i < length; i++) {
                this._updateLetterElement(board[y + i][x], word[i], "", word);
            }
        }
    }

    _createLetterElement(letter) {
        let letterElement = document.createElement("wf-letter");
        this._updateLetterElement(letterElement, letter);
        return letterElement.cloneNode(true);
    }

    _updateLetterElement(letterElement, letter, wordIdX = "", wordIdY = "") {
        letterElement.innerHTML = letter;
        if (wordIdX !== "") {
            letterElement.setAttribute("word-id-x", wordIdX);
        }
        if (wordIdY !== "") {
            letterElement.setAttribute("word-id-y", wordIdY);
        }
    }

    _randomChar() {
        const chars = "abcdefghijklmnopqrstuvwxyzåäö";
        const index = Math.floor(Math.random() * chars.length);
        return chars.charAt(index);          
    }

    _shuffleArray(array) {
        for (let currentIndex = array.length - 1; currentIndex > 0; currentIndex--) {
          const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
});
