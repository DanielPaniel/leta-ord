
customElements.define('wf-game-board', class extends HTMLElement  {

    constructor() {
        super();

        this._dimension = 7;

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
        <div class="board"></div>
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

            }
            .board {
                display: grid;
                grid-template-columns: repeat(${this._dimension}, 1fr);
                gap: .15em;
                width: fit-content;
            }
            `;
        return styles.cloneNode(true);
    }


    connectedCallback() {
        this._setup();
    }

    async _setup() {
        // TODO: borde leta ordlistan med ett attribute eller namn el ngt
        let words = await this._getWordElements("ol li")
            .then((elements) => this._parseWords(elements));
        let letters = this._generateBoard(words);
        
        let boardElement = this.shadowRoot.querySelector(".board");
        letters.forEach((row) => {
            row.forEach((letter) => {
                if (letter.textContent === "-") {
                    this._updateLetterElement(letter, this._randomChar());
                }
                boardElement.append(letter);
            });
        });  
        this._addListeners();  
    }

    _addListeners() {
        let allLetters = this.shadowRoot.querySelectorAll("wf-letter");
        let board = this.shadowRoot.querySelector(".board");
        let isMouseDown = false;

        // Verify interaction has begun
        board.addEventListener("mousedown", () => {
            isMouseDown = true;
        });

        // Stop interaction and evaluate selection
        board.addEventListener("mouseup", () => {
            isMouseDown = false;
            this._checkClearStatus();
        });

        allLetters.forEach((letter) => {
            // Letter where interaction starts
            letter.addEventListener("mousedown", () => {
                this._setSelected(letter);
            });

            // Letters which are selected with a "swipe/drag"
            letter.addEventListener("mouseenter", () => {
                if (isMouseDown) {
                    this._setSelected(letter);
                }
            });
        });
    }

    _setSelected(letterElement) {
        if (letterElement.hasAttribute("selected")) {
            letterElement.removeAttribute("selected");
        } else {
            letterElement.setAttribute("selected", "");
        }
    }

    _checkClearStatus() {
        let selectedLetters = this.shadowRoot.querySelectorAll(`wf-letter[selected]`);
        let currentWords = this._getWordsFromLetters(selectedLetters);
        let selectedLettersInWord, lettersInWord;
        currentWords[0].forEach((currentWordX) => {
            selectedLettersInWord = this.shadowRoot
                .querySelectorAll(`wf-letter[selected][word-id-x="${currentWordX}"]`).length;
            lettersInWord = this.shadowRoot.querySelectorAll(`wf-letter[word-id-x="${currentWordX}"]`);

            if (this._wordIsSelected(selectedLetters.length, lettersInWord.length, selectedLettersInWord)) {
                this._setCleared(lettersInWord);
                this._markWordInWordlist(currentWordX);
            }
        });
        currentWords[1].forEach((currentWordY) => {
            selectedLettersInWord = this.shadowRoot
                .querySelectorAll(`wf-letter[selected][word-id-y="${currentWordY}"]`).length;
            lettersInWord = this.shadowRoot.querySelectorAll(`wf-letter[word-id-y="${currentWordY}"]`);

            if (this._wordIsSelected(selectedLetters.length, lettersInWord.length, selectedLettersInWord)) {
                this._setCleared(lettersInWord);
                this._markWordInWordlist(currentWordY);
            }
        });
    }
    _wordIsSelected(selectedLetters, lettersInWord, selectedLettersInWord) {
        return selectedLetters === lettersInWord 
                && lettersInWord === selectedLettersInWord;
    }
    _setCleared(lettersInWord) {
        lettersInWord.forEach((letter) => {
            letter.setAttribute("cleared", "");
            letter.removeAttribute("selected");
        });      
    }
   async  _markWordInWordlist(word) {
        let wordElements = await this._getWordElements("ol li");
        wordElements.forEach((wordElement) => {
            if (wordElement.textContent === word) {
                wordElement.style.textDecoration = "line-through";
                wordElement.style.opacity = 0.5;
            }
        });
    }
    _getWordsFromLetters(letters) {
        let wordsX = [];
        let wordsY = [];
        letters.forEach((letter) => {
            if(letter.hasAttribute("word-id-x")) {
                wordsX.push(letter.getAttribute("word-id-x"));
            }
            if(letter.hasAttribute("word-id-y")) {
                wordsY.push(letter.getAttribute("word-id-y"));
            }
        });
        return [wordsX, wordsY];
    }

    _getWordElements(selector) {
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
            words.push(wordElement.textContent)
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
        for (let i = 0; i < words.length && placedWords < words.length; i++) {
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
            } else {

                // Gör ett nytt försök att placera ut ord, 
                // TODO:
                // borde kanske finnas ett tak för hur många försök..? / D
                // Kanske en timeout och set interval som i promisen?
                i--;
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

});
