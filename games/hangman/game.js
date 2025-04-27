class Game {
    constructor() {
        this.score = 0;
        this.guessesRemaining = 10;
        this.currentWord = '';
        this.usedLetters = new Set();
        this.rejectedLetters = new Set();
        this.wordList = [];

        // DOM elements
        this.wordDisplay = document.getElementById('wordDisplay');
        this.letterInput = document.getElementById('letterInput');
        this.submitButton = document.getElementById('submitButton');
        this.scoreDisplay = document.getElementById('score');
        this.guessesDisplay = document.getElementById('guesses');
        this.messageDisplay = document.getElementById('message');
        this.rejectedLettersDisplay = document.getElementById('rejectedLetters');

        // Event listeners
        this.submitButton.addEventListener('click', () => this.handleSubmit());
        this.letterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });

        // Load word list and start game
        this.loadWordList();
    }

    async loadWordList() {
        try {
            const response = await fetch('https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt');
            const text = await response.text();
            // Process the word list - each line is in format "number word"
            this.wordList = text.split('\n')
                .map(line => line.split('\t')[1]) // Get the word part
                .filter(word => word && word.length >= 4 && word.length <= 8) // Filter for reasonable length words
                .map(word => word.toUpperCase());
            
            this.startGame();
        } catch (error) {
            console.error('Error loading word list:', error);
            // Fallback to a small set of words if the fetch fails
            this.wordList = [
                'APPLE', 'BANANA', 'CHERRY', 'DATE', 'ELDERBERRY',
                'FIG', 'GRAPE', 'HONEYDEW', 'KIWI', 'LEMON',
                'MANGO', 'NECTARINE', 'ORANGE', 'PEACH', 'QUINCE',
                'RASPBERRY', 'STRAWBERRY', 'TANGERINE', 'UGLI', 'VANILLA',
                'WATERMELON', 'XYLOPHONE', 'YAM', 'ZUCCHINI'
            ];
            this.startGame();
        }
    }

    startGame() {
        this.score = 0;
        this.guessesRemaining = 10;
        this.usedLetters.clear();
        this.rejectedLetters.clear();
        this.updateScore();
        this.updateGuesses();
        this.updateRejectedLetters();
        this.generateNewWord();
    }

    generateNewWord() {
        if (this.wordList.length === 0) {
            this.showMessage('No words available');
            return;
        }
        this.currentWord = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        this.wordDisplay.textContent = '_'.repeat(this.currentWord.length);
    }

    handleSubmit() {
        const letter = this.letterInput.value.toUpperCase();
        this.letterInput.value = '';

        if (!letter || letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
            this.showMessage('Please enter a valid letter');
            return;
        }

        if (this.usedLetters.has(letter)) {
            this.showMessage('Letter already used');
            return;
        }

        this.usedLetters.add(letter);
        this.checkLetter(letter);
    }

    checkLetter(letter) {
        let found = false;
        let newDisplay = this.wordDisplay.textContent.split('');
        
        // First pass: find all occurrences of the letter
        for (let i = 0; i < this.currentWord.length; i++) {
            if (this.currentWord[i] === letter) {
                newDisplay[i] = letter;
                found = true;
            }
        }

        this.wordDisplay.textContent = newDisplay.join('');

        if (found) {
            this.score += 10;
            this.updateScore();
            
            if (!this.wordDisplay.textContent.includes('_')) {
                this.showMessage('Congratulations! Word completed!');
                this.score += 50; // Bonus for completing the word
                this.updateScore();
                this.celebrate();
                setTimeout(() => {
                    this.generateNewWord();
                    this.usedLetters.clear();
                    this.rejectedLetters.clear();
                    this.updateRejectedLetters();
                }, 1500);
            } else {
                this.showMessage(`Found letter ${letter}!`);
            }
        } else {
            this.rejectedLetters.add(letter);
            this.updateRejectedLetters();
            this.guessesRemaining--;
            this.updateGuesses();
            this.showMessage('Letter not found');
            
            if (this.guessesRemaining <= 0) {
                this.endGame();
            }
        }
    }

    celebrate() {
        const duration = 3000;
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

            // Since particles fall down, start a bit higher than random
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

    updateRejectedLetters() {
        this.rejectedLettersDisplay.textContent = Array.from(this.rejectedLetters).sort().join(' ');
    }

    updateGuesses() {
        this.guessesDisplay.textContent = this.guessesRemaining;
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
    }

    showMessage(message) {
        this.messageDisplay.textContent = message;
        setTimeout(() => {
            this.messageDisplay.textContent = '';
        }, 2000);
    }

    endGame() {
        this.showMessage(`Game Over! Final Score: ${this.score}`);
        setTimeout(() => {
            this.startGame();
        }, 3000);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 