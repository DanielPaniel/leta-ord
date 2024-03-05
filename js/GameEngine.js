
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
            <slot></slot>
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

            ::slotted(ul) {
                display: none;
            }
            `;
        return styles.cloneNode(true);
    }

    connectedCallback() {
        this._setup();
    }

    async _setup() {
        let words = await this._getElementsFromLightDom("ul[data-wf-wordlist] li")
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
