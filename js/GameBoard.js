
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
        this._dimension = 8;

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
        <ul class="list">
        </ul>
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
            .list {
                display: flex;
                flex-flow: row wrap;
                gap: .75em;
                margin-block: 1em;
                padding: 0;
                list-style: none;
            }
            .list li {
                color: black;
                font-family: var(--wf-font);
                font-size: 1.33em;
                text-transform: uppercase;
                font-weight: bold;
                margin: 0;
                padding: 0;
                line-height: 1;
                padding-block: .4em .3em;
                padding-inline: .75em;
                background: #eee;
                border: 1px solid #ccc;
                border-radius: 1em;
            }
            `;
        return styles.cloneNode(true);
    }


    connectedCallback() {
    //    this._setup();

        let slot = this.shadowRoot.querySelector("slot");
        slot.addEventListener("slotchange", () => {
            this._setup();
        });
    }

    async _setup() {
        let letterElements = await this._getLetterElements("wf-letter");
        this._addListeners(letterElements);
        this._showWordsToFind(letterElements);
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
                this._markWordInWordlist(currentWordX);
            }
        });
        currentWords[1].forEach((currentWordY) => {
            selectedLettersInWord = this.querySelectorAll(`wf-letter[selected][word-id-y="${currentWordY}"]`).length;
            lettersInWord = this.querySelectorAll(`wf-letter[word-id-y="${currentWordY}"]`);

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

    _showWordsToFind(allLetters) {
        let words = this._getWordsFromLetters(allLetters).flat();
        this._shuffleArray(words);

        let uniqueWords = words.filter((word, index) => {
            return words.indexOf(word) === index;
        });

        let listElement = this.shadowRoot.querySelector(".list");
        listElement.innerHTML = "";
        uniqueWords.forEach((word) => {
            let listItem = document.createElement("li");
            listItem.innerHTML = word;
            listElement.append(listItem.cloneNode(true));
        });
    }

    _markWordInWordlist(word) {
        let wordElements = this.shadowRoot.querySelectorAll("li");
        wordElements.forEach((wordElement) => {
            if (wordElement.textContent === word) {
                wordElement.style.textDecoration = "line-through";
                wordElement.style.opacity = 0.5;
            }
        });
    }

    _shuffleArray(array) {
        for (let currentIndex = array.length - 1; currentIndex > 0; currentIndex--) {
          const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

});
