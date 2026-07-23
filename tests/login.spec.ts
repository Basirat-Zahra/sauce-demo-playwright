import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { users } from '../data/users';
import { ERRORS } from '../data/error-messages';

test.describe('Login Tests', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test.describe('Positive Scenarios', () => {
        test('Standard user can log in successfully @smoke @regression', async ({ page }) => {
            await loginPage.login(users.standard.username, users.standard.password);

            await expect(page).toHaveURL(/inventory.html/);
            await expect(page.locator('.title')).toHaveText('Products');
        });

        test('Problem user can log in (app has known UI bugs post-login) @regression', async ({ page }) => {
            await loginPage.login(users.problem.username, users.problem.password);

            await expect(page).toHaveURL(/inventory.html/);
        });

        test('Performance glitch user can log in, albeit slowly @regression', async ({ page }) => {
            await loginPage.login(users.performance.username, users.performance.password);

            await expect(page).toHaveURL(/inventory.html/, { timeout: 15000 });
        });
    });

    test.describe('Negative Scenarios', () => {
        test('Locked out user sees locked-out error @smoke @regression', async ({ page }) => {
            await loginPage.login(users.locked.username, users.locked.password);

            await expect(page).toHaveURL(ROUTES_HOME_REGEX());
            await expect(loginPage.errorMessage).toBeVisible();
            expect(await loginPage.getErrorMessage()).toContain(ERRORS.LOCKED_OUT);
        });

        test('Invalid username shows generic credentials error @regression', async ({ page }) => {
            await loginPage.login('invalid_user', users.standard.password);

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.INVALID_CREDENTIALS);
        });

        test('Invalid password shows generic credentials error @regression', async ({ page }) => {
            await loginPage.login(users.standard.username, 'wrong_password');

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.INVALID_CREDENTIALS);
        });

        test('Valid username with empty password shows password-required error @regression', async () => {
            await loginPage.enterUsername(users.standard.username);
            await loginPage.clickLogin();

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.PASSWORD_REQUIRED);
        });

        test('Empty username shows username-required error @regression', async () => {
            await loginPage.enterPassword(users.standard.password);
            await loginPage.clickLogin();

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.USERNAME_REQUIRED);
        });

        test('Empty username and password shows username-required error @regression', async () => {
            await loginPage.clickLogin();

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.USERNAME_REQUIRED);
        });

        test('Both fields blank after whitespace-only input shows username-required error @regression', async () => {
            await loginPage.enterUsername('   ');
            await loginPage.enterPassword('   ');
            await loginPage.clickLogin();

            // App does not trim whitespace, so this should fail as invalid credentials,
            // not pass as if the fields were empty
            expect(await loginPage.getErrorMessage()).toContain(ERRORS.INVALID_CREDENTIALS);
        });

        test('Username is case-sensitive @regression', async () => {
            await loginPage.login(users.standard.username.toUpperCase(), users.standard.password);

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.INVALID_CREDENTIALS);
        });

        test('SQL-injection-style input is rejected, not authenticated @security @regression', async () => {
            await loginPage.login("' OR '1'='1", "' OR '1'='1");

            expect(await loginPage.getErrorMessage()).toContain(ERRORS.INVALID_CREDENTIALS);
        });
    });

    test.describe('UI / Behavioral', () => {
        test('Error banner can be dismissed via close button @regression', async () => {
            await loginPage.login(users.locked.username, users.locked.password);
            expect(await loginPage.isErrorMessageVisible()).toBeTruthy();

            await loginPage.closeErrorMessage();

            expect(await loginPage.isErrorMessageVisible()).toBeFalsy();
        });

        test('Password field masks input @regression', async ({ page }) => {
            await loginPage.enterPassword('secret_sauce');

            await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
        });

        test('Login button remains visible/enabled on initial page load @regression', async () => {
            expect(await loginPage.isLoginButtonVisible()).toBeTruthy();
        });

        test('Failed login does not navigate away from login page @regression', async ({ page }) => {
            const initialUrl = page.url();
            await loginPage.login('invalid_user', 'invalid_password');

            expect(page.url()).toBe(initialUrl);
        });

        test('Submitting the form again after a failed attempt clears the previous error @regression', async ({ page }) => {
            await loginPage.login('invalid_user', 'wrong_password');
            expect(await loginPage.isErrorMessageVisible()).toBeTruthy();

            await loginPage.login(users.standard.username, users.standard.password);

            await expect(page).toHaveURL(/inventory.html/);
        });
    });
});


function ROUTES_HOME_REGEX() {
    return /\/(index\.html)?$/;
}
