
customElements.define('wf-game-board', class extends HTMLElement  {

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
                /* default value - will be replaced by engine */
                --dimension: 8;
                display: block;
                width: min-content;
            }
            .board {
                display: grid;
                grid-template-columns: repeat(var(--dimension), 1fr);
                gap: .25em;
                width: fit-content;
            }
            `;
        return styles.cloneNode(true);
    }


    connectedCallback() {
        this._setup();
    }

    async _setup() {
        await this._getLetterElements("wf-letter")
            .then((letterElements) => this._addListeners(letterElements));
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
        let isMouseDown = false;
        let board = this.shadowRoot.querySelector(".board");
        // If swipe is leaving the board - exit the movement
        board.addEventListener("pointerleave", () => {
            isMouseDown = false;
            this._checkClearStatus();
        });

        allLetters.forEach((letter) => {
            // Letter where interaction starts
            letter.addEventListener("wf-letter-press", (event) => {
                isMouseDown = true;
                event.target.toggleAttribute("selected");
            });

            // Letters which are selected with a "swipe/drag"
            letter.addEventListener("wf-letter-activate", (event) => {
                if (isMouseDown) {
                    event.target.toggleAttribute("selected");
                }
            });

            letter.addEventListener("wf-letter-release", () => {
                isMouseDown = false;
                this._checkClearStatus();
            });
        });
        return allLetters;
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
                this.dispatchEvent(
                    this._createEvent(
                        currentWordX,
                        this._allWordsAreCleared()));
            }
        });
        currentWords[1].forEach((currentWordY) => {
            selectedLettersInWord = this.querySelectorAll(`wf-letter[selected][word-id-y="${currentWordY}"]`).length;
            lettersInWord = this.querySelectorAll(`wf-letter[word-id-y="${currentWordY}"]`);

            if (this._wordIsSelected(selectedLetters.length, lettersInWord.length, selectedLettersInWord)) {
                this._setCleared(lettersInWord);
                this.dispatchEvent(
                    this._createEvent(
                        currentWordY,
                        this._allWordsAreCleared()));
            }
        });
    }
    _wordIsSelected(selectedLetters, lettersInWord, selectedLettersInWord) {
        return selectedLetters === lettersInWord 
                && lettersInWord === selectedLettersInWord;
    }
    _allWordsAreCleared() {
        let xWords = this.querySelectorAll(`wf-letter[word-id-x]:not([cleared])`);
        let yWords = this.querySelectorAll(`wf-letter[word-id-y]:not([cleared])`);
        if (xWords.length || yWords.length) {
            return false;
        } else {
            return true;
        }
    }
    _setCleared(lettersInWord) {
        let colorIndex = Math.floor(Math.random() * 360);
        lettersInWord.forEach((letter, index) => {
            letter.style.setProperty("--index", index);
            letter.style.setProperty("--colorIndex", colorIndex);
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

    _createEvent(foundWord, isComplete = false) {
        return new CustomEvent("wf-word-found", {
            detail: {
                word: `${foundWord}`,
                isComplete: isComplete
            }
        });
    }
});
