/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

// Load the HTML file content
// Note: Adjust the filename if it changes from "index (1).html"
const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

describe('Universo Real Tests', () => {
    beforeEach(() => {
        // Load the HTML into the test document before each test
        document.documentElement.innerHTML = html;
    });

    describe('Initial State', () => {
        test('should have the correct page title', () => {
            expect(document.title).toBe('Universo Real — RPG de Desenvolvimento Pessoal');
        });

        test('should show Auth Modal by default', () => {
            const authModal = document.getElementById('authModal');
            expect(authModal).toBeTruthy();
            // The modal should NOT have the 'hidden' class initially
            expect(authModal.classList.contains('hidden')).toBe(false);
        });

        test('should hide Game Screen by default', () => {
            const gameScreen = document.getElementById('gameScreen');
            expect(gameScreen).toBeTruthy();
            // The game screen SHOULD have the 'hidden' class initially
            expect(gameScreen.classList.contains('hidden')).toBe(true);
        });
    });

    describe('Authentication Forms', () => {
        test('should display Login form and hide Register form initially', () => {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');

            expect(loginForm).toBeTruthy();
            expect(registerForm).toBeTruthy();

            // Login form is visible (no hidden class)
            expect(loginForm.classList.contains('hidden')).toBe(false);
            // Register form is hidden
            expect(registerForm.classList.contains('hidden')).toBe(true);
        });

        test('should have all required registration inputs', () => {
            expect(document.getElementById('registerUsername')).toBeTruthy();
            expect(document.getElementById('registerPassword')).toBeTruthy();
            expect(document.getElementById('registerName')).toBeTruthy();
            expect(document.getElementById('registerRace')).toBeTruthy();
            expect(document.getElementById('registerAura')).toBeTruthy();
        });
    });

    describe('Game Interface', () => {
        test('should have navigation tabs configured correctly', () => {
            const tabs = document.querySelectorAll('.tab-btn');
            expect(tabs.length).toBe(5);
            
            // Check data attributes
            expect(tabs[0].dataset.tab).toBe('hero');
            expect(tabs[1].dataset.tab).toBe('quests');
            expect(tabs[2].dataset.tab).toBe('finance');
            expect(tabs[3].dataset.tab).toBe('social');
            expect(tabs[4].dataset.tab).toBe('dom');
        });

        test('should have Hero tab active by default', () => {
            const heroTab = document.querySelector('.tab-btn[data-tab="hero"]');
            const heroContent = document.getElementById('tab-hero');

            expect(heroTab.classList.contains('active')).toBe(true);
            expect(heroContent.classList.contains('active')).toBe(true);
        });

        test('should have Chart.js canvas elements', () => {
            expect(document.getElementById('xpChart')).toBeTruthy();
            expect(document.getElementById('financeChart')).toBeTruthy();
            expect(document.getElementById('financeMonthlyChart')).toBeTruthy();
        });
    });

    describe('Feature Sections', () => {
        test('should have Finance input fields', () => {
            expect(document.getElementById('financeDesc')).toBeTruthy();
            expect(document.getElementById('financeValue')).toBeTruthy();
            expect(document.getElementById('financeType')).toBeTruthy();
            expect(document.getElementById('financeCategory')).toBeTruthy();
            expect(document.getElementById('addFinanceBtn')).toBeTruthy();
        });

        test('should have Social Relationship setup fields', () => {
            expect(document.getElementById('relationshipDateInput')).toBeTruthy();
            expect(document.getElementById('relationshipPhotoInput')).toBeTruthy();
            expect(document.getElementById('setRelationshipBtn')).toBeTruthy();
        });

        test('should have Zen Mode elements', () => {
            const zenOverlay = document.getElementById('zenModeOverlay');
            expect(zenOverlay).toBeTruthy();
            expect(zenOverlay.classList.contains('hidden')).toBe(true);
        });
    });
});