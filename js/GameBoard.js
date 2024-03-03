
customElements.define('wf-game-board', class extends HTMLElement  {

    constructor() {
        super();

        // TODO: dimension borde komma fr engine
        /* 
        Idé:
        - Sätt m en custom prop i css
        - uppdatera custom prop när attribut sätts
        - göm spelplan om attr saknas - animera in
        */
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
        <div class="board">
            <slot></slot>
        </div>
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
                display: block;
                width: min-content;
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
        this._getLetterElements("wf-letter")
            .then((letterElements) => {
                this._addListeners(letterElements);
            });
        
    }

    _getLetterElements(selector) {
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

    _addListeners(allLetters) {
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
        let selectedLetters = this.querySelectorAll(`wf-letter[selected]`);
        let currentWords = this._getWordsFromLetters(selectedLetters);
        let selectedLettersInWord, lettersInWord;
        currentWords[0].forEach((currentWordX) => {
            selectedLettersInWord = this.querySelectorAll(`wf-letter[selected][word-id-x="${currentWordX}"]`).length;
            lettersInWord = this.querySelectorAll(`wf-letter[word-id-x="${currentWordX}"]`);

            if (this._wordIsSelected(selectedLetters.length, lettersInWord.length, selectedLettersInWord)) {
                this._setCleared(lettersInWord);
                this.dispatchEvent(this._createEvent(currentWordX));
            }
        });
        currentWords[1].forEach((currentWordY) => {
            selectedLettersInWord = this.querySelectorAll(`wf-letter[selected][word-id-y="${currentWordY}"]`).length;
            lettersInWord = this.querySelectorAll(`wf-letter[word-id-y="${currentWordY}"]`);

            if (this._wordIsSelected(selectedLetters.length, lettersInWord.length, selectedLettersInWord)) {
                this._setCleared(lettersInWord);
                this.dispatchEvent(this._createEvent(currentWordY));
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

    _createEvent(clearedWord) {
        return new CustomEvent("wf-cleared-word", {
            detail: {
              word: clearedWord,
            }
          });
    }

});
