
customElements.define('wf-game-engine', class extends HTMLElement  {
    static observedAttributes = ["dimension", "max-words"];
    constructor() {
        super();
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
            wf-game-board wf-letter[cleared] {
                animation: 120ms cubic-bezier(0,.37,.48,1) calc(var(--index, 0) * 70ms) 2 alternate winning;
            }
            wf-game-board.complete-animation wf-letter[cleared] {
                /* 1000ms is magic nbr */
                animation: 200ms steps(10, jump-none) calc(var(--index, 1) * 50ms + 1000ms) 10 glitter,
                    120ms cubic-bezier(0,.37,.48,1) calc(var(--index, 0) * 70ms) 2 alternate winning;
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
                100% {
                    transform: scale(1.5) translateY(-.5em);
                }
            }
            `;
        return styles.cloneNode(true);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "dimension"){
            this._createLetterGrid(newValue);
        }
        if (name === "max-words") {
            this._setup();
        }
    }

    _getAttribute(attributeName) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
              let attribute = this.getAttribute(attributeName);
              if (attribute) {
                clearInterval(interval);
                resolve(attribute);
              }
            }, 100);
        
            // Timeout if attribute is not found
            setTimeout(() => {
              clearInterval(interval);
              reject(new Error(`Timeout waiting for attribute: ${attributeName}`));
            }, 10000);
          });
    }

    _createLetterGrid(dimension) {
        let oldBoard = this.shadowRoot.querySelector("wf-game-board");
        if (oldBoard) {
            oldBoard.remove();
        }
        let newBoard = document.createElement("wf-game-board");
        newBoard.addEventListener("wf-word-found", (event) => {
            this._crossOutWordFromList(event.detail.word);
            if (event.detail.isComplete) {
                newBoard.classList.add("complete-animation");
                this.dispatchEvent(new CustomEvent("wf-game-complete"));
            }
        });
        newBoard.style.setProperty("--dimension", dimension);

        let amountOfLetters = dimension * dimension;
        for (let i = 0; i < amountOfLetters; i ++) {
            let letterElement = this._createLetterElement("-");
            newBoard.append(letterElement);
        }
        this.shadowRoot.prepend(newBoard);
    }

    async _crossOutWordFromList(foundWord) {
        await this._getElementsFromLightDom("ul[data-wf-wordlist] li")
            .then ((words) => {
                words.forEach((word) => {
                    if (word.textContent === foundWord) {
                        word.style.opacity = "0.5";
                        word.style.textDecoration = "line-through";
                    }
                });
            });
    }

    async _setup() {
        let letters = await this._getElementsFromLightDom("ul[data-wf-wordlist] li")
            .then((elements) => this._parseWords(elements))
            .then((elements) => this._generateBoard(elements));

        
        letters.forEach((row) => {
            row.forEach((letter) => {
                if (letter.textContent === "-") {
                    this._updateLetterElement(letter, this._randomChar());
                }
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

    async _parseWords(elements) {
        let words = [];
        let dimension = await this._getAttribute("dimension");
        elements.forEach((wordElement) => {
            let word = wordElement.textContent;
            // Hide all words
            wordElement.setAttribute("hidden", "");
            // Sort in a new array, but exclude words that doesnt fit
            if (word.length <= dimension) {
                words.push(wordElement);
            }
        });
        this._shuffleArray(words);
        return words;
    }

    _generateBoard(words) {
        // Skapa ett korsord
        let letters = this.shadowRoot.querySelectorAll("wf-letter");
        let maxWords = parseInt(this.getAttribute('max-words'));
        let dimension = Math.sqrt(letters.length);
        let board = [];
        for (let y = 0; y < dimension; y++) {
            board[y] = [];
            for (let x = 0; x < dimension; x++) {
                board[y][x] = letters[y * dimension + x];
            }
        }

        // Placera in orden i korsordet
        let placedWords = 0;
        for (let i = 0; i < words.length && placedWords <  maxWords; i++) {
            let wordElement = words[i];
            const word = wordElement.textContent;
            const direction = Math.random() < 0.5 ? "across" : "down";
            let x, y;

            if (direction === "across") {
                x = Math.floor(Math.random() * (dimension - word.length));
                y = Math.floor(Math.random() * dimension);
            } else {
                x = Math.floor(Math.random() * dimension);
                y = Math.floor(Math.random() * (dimension - word.length));
            }
            if (this._canPlaceWord(board, word, x, y, direction, dimension)) {
                this._placeWord(board, wordElement, x, y, direction);
                placedWords++;
            }
        }

        return board;
    }

    // Hjälpfunktion för att kontrollera om ett ord kan placeras
    _canPlaceWord(board, word, x, y, direction, dimension) {
        const length = word.length;
        if (direction === "across") {
            if (x + length > dimension) return false;
            for (let i = 0; i < length; i++) {
                if (board[y][x + i].textContent !== "-" 
                    && board[y][x + i].textContent !== word[i]) {
                    return false;
                }
            }
        } else {
            if (y + length > dimension) return false;
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
    _placeWord(board, wordElement, x, y, direction) {
        let word = wordElement.textContent;

        if (direction === "across") {
            for (let i = 0; i < word.length; i++) {
                this._updateLetterElement(board[y][x + i], word[i], word);
            }
        } else {
            for (let i = 0; i < word.length; i++) {
                this._updateLetterElement(board[y + i][x], word[i], "", word);
            }
        }
        wordElement.removeAttribute("hidden");
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
