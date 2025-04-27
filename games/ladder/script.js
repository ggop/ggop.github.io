// Word list will be loaded from wordlist.txt
let wordList = [];
let wordLengths = new Set();

class WordLadder {
    constructor() {
        this.startWord = '';
        this.targetWord = '';
        this.currentWord = '';
        this.history = [];
        this.wordLength = 5; // Default word length
        this.maxSteps = 6; // Maximum steps allowed
        this.hintsRemaining = 2; // Number of hints available
        this.shortestPath = []; // Store the shortest path for hints
        this.guessesRemaining = 10; // Maximum number of guesses
        this.loadWordList();
    }

    async loadWordList() {
        try {
            // First try to load from the same directory
            let response = await fetch('wordlist.txt');
            
            // If that fails, try loading from the root directory
            if (!response.ok) {
                response = await fetch('/wordlist.txt');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Word list loaded successfully');
            
            // Process words and store unique lengths
            wordList = text.split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length > 0);
            
            if (wordList.length === 0) {
                throw new Error('No words found in the word list');
            }
            
            console.log(`Loaded ${wordList.length} words`);
            
            // Store available word lengths
            wordList.forEach(word => wordLengths.add(word.length));
            
            // Sort word lengths for display
            this.availableLengths = Array.from(wordLengths).sort((a, b) => a - b);
            
            // Create length selector
            this.createLengthSelector();
            
            // Set default to 5 letters if available
            if (this.availableLengths.includes(5)) {
                document.getElementById('word-length').value = '5';
            }
            
            this.initializeGame();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading word list:', error);
            // Show a more user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <p>Error loading word list: ${error.message}</p>
                <p>Please make sure wordlist.txt is in the correct location.</p>
            `;
            document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.game-board'));
        }
    }

    // Find all words that are one letter different from the given word
    getNeighbors(word) {
        return wordList.filter(w => 
            w.length === word.length && 
            this.isOneLetterDifferent(word, w)
        );
    }

    // Find the shortest path between two words using BFS
    findPath(start, target) {
        const queue = [[start]];
        const visited = new Set([start]);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === target) {
                return path;
            }

            if (path.length > this.maxSteps) {
                return null; // Path too long
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        return null; // No path found
    }

    // Find a valid pair of words that are within maxSteps of each other
    findValidWordPair(sameLengthWords) {
        const maxAttempts = 100; // Limit attempts to prevent infinite loops
        let attempts = 0;

        while (attempts < maxAttempts) {
            const randomIndex1 = Math.floor(Math.random() * sameLengthWords.length);
            let randomIndex2;
            do {
                randomIndex2 = Math.floor(Math.random() * sameLengthWords.length);
            } while (randomIndex2 === randomIndex1);

            const start = sameLengthWords[randomIndex1];
            const target = sameLengthWords[randomIndex2];

            const path = this.findPath(start, target);
            if (path && path.length <= this.maxSteps + 1) {
                return { start, target, path };
            }

            attempts++;
        }

        return null;
    }

    createLengthSelector() {
        const container = document.querySelector('.game-info');
        const selector = document.createElement('div');
        selector.className = 'length-selector';
        selector.innerHTML = `
            <label for="word-length">Select word length:</label>
            <select id="word-length">
                ${this.availableLengths.map(len => `<option value="${len}">${len} letters</option>`).join('')}
            </select>
        `;
        container.appendChild(selector);

        document.getElementById('word-length').addEventListener('change', (e) => {
            this.wordLength = parseInt(e.target.value);
            this.initializeGame();
        });
    }

    initializeGame() {
        // Get words of the same length
        const sameLengthWords = wordList.filter(word => word.length === this.wordLength);
        
        if (sameLengthWords.length < 2) {
            alert(`Not enough ${this.wordLength}-letter words in the word list`);
            return;
        }

        const validPair = this.findValidWordPair(sameLengthWords);
        if (!validPair) {
            alert(`Could not find words that are within ${this.maxSteps} steps of each other. Try a different word length.`);
            return;
        }

        this.startWord = validPair.start;
        this.targetWord = validPair.target;
        this.currentWord = this.startWord;
        this.history = [this.startWord];
        this.hintsRemaining = 2;
        this.shortestPath = validPair.path;
        this.guessesRemaining = 10;

        this.updateDisplay();
        this.updateHintButton();
        this.updateGuessesDisplay();
    }

    setupEventListeners() {
        document.getElementById('submit-word').addEventListener('click', () => this.submitWord());
        document.getElementById('new-game').addEventListener('click', () => this.initializeGame());
        document.getElementById('hint-button').addEventListener('click', () => this.giveHint());
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            }
        });
    }

    updateDisplay() {
        document.getElementById('start-word').textContent = this.startWord;
        document.getElementById('current-word').textContent = this.currentWord;
        document.getElementById('target-word').textContent = this.targetWord;
        
        const historyElement = document.getElementById('word-history');
        historyElement.innerHTML = this.history.map(word => `<p>${word}</p>`).join('');
    }

    isValidWord(word) {
        return wordList.includes(word.toLowerCase());
    }

    isOneLetterDifferent(word1, word2) {
        if (word1.length !== word2.length) return false;
        let differences = 0;
        for (let i = 0; i < word1.length; i++) {
            if (word1[i] !== word2[i]) differences++;
            if (differences > 1) return false;
        }
        return differences === 1;
    }

    updateGuessesDisplay() {
        const guessesElement = document.querySelector('.guesses-remaining');
        const guessesLeftElement = document.getElementById('guesses-left');
        
        guessesLeftElement.textContent = this.guessesRemaining;
        
        // Update styling based on remaining guesses
        guessesElement.classList.remove('warning', 'danger');
        if (this.guessesRemaining <= 3) {
            guessesElement.classList.add('danger');
        } else if (this.guessesRemaining <= 5) {
            guessesElement.classList.add('warning');
        }
    }

    updateHintButton() {
        const hintButton = document.getElementById('hint-button');
        hintButton.textContent = `Hint (${this.hintsRemaining} remaining)`;
        hintButton.disabled = this.hintsRemaining === 0;
    }

    giveHint() {
        if (this.hintsRemaining <= 0) {
            alert('No hints remaining!');
            return;
        }

        // Find the next word in the shortest path that hasn't been used yet
        const currentIndex = this.shortestPath.indexOf(this.currentWord);
        if (currentIndex === -1 || currentIndex >= this.shortestPath.length - 1) {
            alert('No more hints available for this path!');
            return;
        }

        const nextWord = this.shortestPath[currentIndex + 1];
        if (this.history.includes(nextWord)) {
            alert('No more hints available for this path!');
            return;
        }

        // Auto-submit the next word
        document.getElementById('word-input').value = nextWord;
        this.submitWord();
        this.hintsRemaining--;
        this.updateHintButton();
    }

    submitWord() {
        const input = document.getElementById('word-input');
        const newWord = input.value.toLowerCase().trim();
        
        if (!newWord) {
            alert('Please enter a word');
            return;
        }

        if (newWord.length !== this.wordLength) {
            alert(`Word must be ${this.wordLength} letters long`);
            return;
        }

        if (!this.isValidWord(newWord)) {
            alert('Not a valid word');
            return;
        }

        if (!this.isOneLetterDifferent(this.currentWord, newWord)) {
            alert('Can only change one letter at a time');
            return;
        }

        if (this.history.includes(newWord)) {
            alert('Word already used');
            return;
        }

        this.currentWord = newWord;
        this.history.push(newWord);
        this.guessesRemaining--;
        input.value = '';
        this.updateDisplay();
        this.updateGuessesDisplay();

        if (this.currentWord === this.targetWord) {
            this.celebrateVictory();
            setTimeout(() => {
                alert('Congratulations! You won!');
                this.initializeGame();
            }, 2000);
        } else if (this.guessesRemaining === 0) {
            alert(`Game Over! The target word was: ${this.targetWord}`);
            this.initializeGame();
        }
    }

    celebrateVictory() {
        // Create confetti effect
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    getOrdinalSuffix(n) {
        const j = n % 10;
        const k = n % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new WordLadder();
}); 