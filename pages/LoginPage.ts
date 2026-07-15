import { Page, Locator } from '@playwright/test';
import { ROUTES } from '../config/routes';

export class LoginPage {
    readonly page: Page;

    // Locators
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly errorCloseButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.usernameInput = page.locator("#user-name");
        this.passwordInput = page.locator("#password");
        this.loginButton = page.locator("#login-button");
        this.errorMessage = page.locator('[data-test="error"]');
        this.errorCloseButton = page.locator('[data-test="error-button"]')
    }

    // Navigate to login page
    async goto() {
        await this.page.goto(ROUTES.HOME);
    }

    // Enter username
    async enterUsername(username: string) {
        await this.usernameInput.fill(username);
    }

    // Enter password
    async enterPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    // Click login
    async clickLogin() {
        await this.loginButton.click();
    }

    async login(username: string, password: string) {
        await this.enterUsername(username);
        await this.enterPassword(password);
        await this.clickLogin();
    }

    async getErrorMessage() {
        return this.errorMessage.textContent();
    }

    async isErrorMessageVisible() {
        return this.errorMessage.isVisible();
    }

    async closeErrorMessage() {
        await this.errorCloseButton.click();
    }

    async isLoginButtonVisible() {
        return this.loginButton.isVisible();
    }
}